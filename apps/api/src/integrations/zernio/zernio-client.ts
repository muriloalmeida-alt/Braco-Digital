import { Inject, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ZERNIO_CONFIG, ZERNIO_FETCH, type ZernioFetch } from './zernio.tokens';
import type { ZernioConfig } from './zernio-config';
import { ZernioMetrics } from './zernio-metrics';

/**
 * Mapeamento de erro pedido pela issue #30 — cada código vira uma decisão
 * de retry diferente para quem chama (`ZernioClient` nunca decide sozinho
 * se uma escrita ambígua deve ser repetida, só classifica o erro).
 */
export type ZernioErrorCode =
  | 'invalid_request' // 400 — não repetir
  | 'unauthorized' // 401 — credencial inválida, alerta operacional
  | 'payment_required' // 402
  | 'forbidden' // 403
  | 'not_found' // 404 — reconciliar vínculo
  | 'conflict' // 409
  | 'unprocessable' // 422 — payload inválido ou idempotency key reutilizada com corpo diferente
  | 'rate_limited' // 429 — respeitar Retry-After
  | 'server_error' // 5xx
  | 'timeout' // abortado por timeout local
  | 'network_error'; // fetch nunca completou (DNS, conexão recusada, etc.)

export class ZernioApiError extends Error {
  constructor(
    message: string,
    public readonly code: ZernioErrorCode,
    public readonly status: number | null,
    public readonly requestId: string,
    public readonly retryAfterMs: number | null = null,
  ) {
    super(message);
    this.name = 'ZernioApiError';
  }
}

function errorCodeForStatus(status: number): ZernioErrorCode {
  if (status === 401) return 'unauthorized';
  if (status === 402) return 'payment_required';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not_found';
  if (status === 409) return 'conflict';
  if (status === 422) return 'unprocessable';
  if (status === 429) return 'rate_limited';
  if (status >= 500) return 'server_error';
  return 'invalid_request';
}

export interface ZernioRequestOptions {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  query?: Record<string, string | undefined>;
  body?: unknown;
  idempotencyKey?: string;
}

const MAX_GET_RETRIES = 2;

/**
 * Cliente HTTP centralizado do Zernio (issue #30). Todo o resto do módulo
 * fala com o Zernio só através daqui — nunca `fetch` direto em outro
 * arquivo.
 *
 * - Base URL e timeout vêm de `ZernioConfig` (injetável — testes trocam
 *   por uma base local sem precisar de rede real).
 * - `Authorization: Bearer <API_KEY>` é automático; a key nunca aparece
 *   em query string, payload, log ou erro devolvido ao chamador.
 * - Retry automático só em GET (idempotente por natureza HTTP) com
 *   backoff, respeitando `Retry-After` em 429. POST/PATCH/DELETE nunca
 *   são repetidos aqui dentro — uma falha ambígua (timeout/5xx) sobe como
 *   `ZernioApiError` para quem chamou decidir (a Meta pode ter aceitado a
 *   mensagem antes da falha; só o chamador tem contexto para reconciliar
 *   antes de repetir).
 * - Logs (`logRequest`) nunca incluem corpo, headers de auth ou payload —
 *   só método, path, status, duração e um `requestId` de correlação
 *   interno (gerado aqui, não enviado ao Zernio).
 */
@Injectable()
export class ZernioClient {
  constructor(
    @Inject(ZERNIO_CONFIG) private readonly config: ZernioConfig | null,
    @Inject(ZERNIO_FETCH) private readonly fetchFn: ZernioFetch,
    private readonly metrics: ZernioMetrics,
  ) {}

  isEnabled(): boolean {
    return this.config !== null;
  }

  private requireConfig(): ZernioConfig {
    if (!this.config) {
      throw new ServiceUnavailableException('Integração com o Zernio não está configurada neste ambiente.');
    }
    return this.config;
  }

  async request<T>(options: ZernioRequestOptions): Promise<T> {
    const config = this.requireConfig();
    const canRetry = options.method === 'GET';
    let attempt = 0;

    for (;;) {
      const requestId = randomUUID();
      const startedAt = Date.now();
      try {
        const result = await this.doRequest<T>(config, options, requestId);
        this.logAndRecord(options, requestId, 200, Date.now() - startedAt);
        return result;
      } catch (err) {
        if (!(err instanceof ZernioApiError)) throw err;
        this.logAndRecord(options, requestId, err.status ?? 0, Date.now() - startedAt);

        const shouldRetry =
          canRetry &&
          attempt < MAX_GET_RETRIES &&
          (err.code === 'rate_limited' || err.code === 'server_error' || err.code === 'timeout' || err.code === 'network_error');
        if (!shouldRetry) throw err;

        attempt += 1;
        const backoffMs = err.retryAfterMs ?? 2 ** attempt * 250;
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }
  }

  private async doRequest<T>(config: ZernioConfig, options: ZernioRequestOptions, requestId: string): Promise<T> {
    const url = new URL(config.baseUrl + options.path);
    for (const [key, value] of Object.entries(options.query ?? {})) {
      if (value !== undefined) url.searchParams.set(key, value);
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    };
    if (options.idempotencyKey) headers['Idempotency-Key'] = options.idempotencyKey;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.requestTimeoutMs);

    let response: Response;
    try {
      response = await this.fetchFn(url.toString(), {
        method: options.method,
        headers,
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });
    } catch (err) {
      const isAbort = err instanceof Error && err.name === 'AbortError';
      throw new ZernioApiError(
        isAbort ? 'Tempo limite excedido ao chamar o Zernio.' : 'Falha de rede ao chamar o Zernio.',
        isAbort ? 'timeout' : 'network_error',
        null,
        requestId,
      );
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      const retryAfterHeader = response.headers.get('retry-after');
      const retryAfterMs = retryAfterHeader ? Number(retryAfterHeader) * 1000 : null;
      // Nunca inclui o corpo da resposta de erro do provedor na mensagem
      // devolvida — evita vazar detalhe interno do Zernio ao frontend
      // (a rota que chama isto decide a mensagem exibida ao usuário).
      throw new ZernioApiError(
        `Zernio respondeu ${response.status} para ${options.method} ${options.path}.`,
        errorCodeForStatus(response.status),
        response.status,
        requestId,
        Number.isFinite(retryAfterMs) ? retryAfterMs : null,
      );
    }

    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  }

  private logAndRecord(options: ZernioRequestOptions, requestId: string, status: number, durationMs: number) {
    this.metrics.httpRequest(options.method, options.path, status, durationMs);
    // eslint-disable-next-line no-console
    console.log(
      JSON.stringify({
        scope: 'zernio_http',
        method: options.method,
        path: options.path,
        status,
        durationMs,
        requestId,
      }),
    );
  }
}
