import { Inject, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { GCP_KMS_CONFIG, GCP_KMS_FETCH, type GcpKmsFetch } from './gcp-kms.tokens';
import type { GcpKmsConfig } from './gcp-kms-config';
import { GcpServiceAccountTokenProvider } from './gcp-service-account-token-provider';

export type GcpKmsErrorCode = 'invalid_request' | 'unauthorized' | 'forbidden' | 'not_found' | 'server_error' | 'timeout' | 'network_error';

export class GcpKmsError extends Error {
  constructor(
    message: string,
    public readonly code: GcpKmsErrorCode,
    public readonly status: number | null,
  ) {
    super(message);
    this.name = 'GcpKmsError';
  }
}

function errorCodeForStatus(status: number): GcpKmsErrorCode {
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not_found';
  if (status >= 500) return 'server_error';
  return 'invalid_request';
}

/**
 * Cliente HTTP fino do Cloud KMS REST API (`cryptoKeys.encrypt`/
 * `.decrypt`) — mesmo padrão de `GoogleApiClient`/`ZernioClient`: sem
 * SDK oficial, `fetch` injetável (testes trocam por um fake sem rede
 * real), erro nunca vaza o corpo bruto da resposta do Google, log nunca
 * inclui plaintext/ciphertext/token de acesso.
 */
@Injectable()
export class GcpKmsClient {
  constructor(
    @Inject(GCP_KMS_CONFIG) private readonly config: GcpKmsConfig | null,
    @Inject(GCP_KMS_FETCH) private readonly fetchFn: GcpKmsFetch,
    private readonly tokenProvider: GcpServiceAccountTokenProvider,
  ) {}

  private requireConfig(): GcpKmsConfig {
    if (!this.config) {
      throw new ServiceUnavailableException('GCP KMS não está configurado neste ambiente.');
    }
    return this.config;
  }

  /** `plaintextB64`/retorno em base64 — o Cloud KMS REST API troca bytes cifrados como base64 no corpo JSON. */
  async encrypt(plaintextB64: string): Promise<string> {
    const result = await this.call('encrypt', { plaintext: plaintextB64 });
    return (result as { ciphertext: string }).ciphertext;
  }

  async decrypt(ciphertextB64: string): Promise<string> {
    const result = await this.call('decrypt', { ciphertext: ciphertextB64 });
    return (result as { plaintext: string }).plaintext;
  }

  private async call(operation: 'encrypt' | 'decrypt', body: Record<string, string>): Promise<unknown> {
    const config = this.requireConfig();
    const accessToken = await this.tokenProvider.getAccessToken();
    const url = `${config.apiBase}/${config.keyName}:${operation}`;
    const requestId = randomUUID();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.requestTimeoutMs);
    let response: Response;
    const startedAt = Date.now();
    try {
      response = await this.fetchFn(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (err) {
      const isAbort = err instanceof Error && err.name === 'AbortError';
      this.log(operation, isAbort ? 'timeout' : 'network_error', Date.now() - startedAt, requestId);
      throw new GcpKmsError(isAbort ? 'Tempo limite excedido ao chamar o GCP KMS.' : 'Falha de rede ao chamar o GCP KMS.', isAbort ? 'timeout' : 'network_error', null);
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      const code = errorCodeForStatus(response.status);
      this.log(operation, code, Date.now() - startedAt, requestId);
      // Nunca inclui o corpo da resposta de erro do Google — pode conter
      // detalhe interno da chave/projeto GCP.
      throw new GcpKmsError(`GCP KMS respondeu ${response.status} para ${operation}.`, code, response.status);
    }

    this.log(operation, 'ok', Date.now() - startedAt, requestId);
    return response.json();
  }

  private log(operation: string, outcome: string, durationMs: number, requestId: string) {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify({ scope: 'gcp_kms_http', operation, outcome, durationMs, requestId }));
  }
}
