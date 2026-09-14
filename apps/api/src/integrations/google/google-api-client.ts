import { Inject, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { GoogleOAuthConfig } from './google-config';
import { GOOGLE_OAUTH_SCOPES } from './google-config';
import type {
  GoogleCalendarListEntry,
  GoogleCalendarListResponse,
  GoogleTaskList,
  GoogleTaskListsResponse,
  GoogleTokenResponse,
} from './google-api-types';
import { GOOGLE_FETCH, GOOGLE_OAUTH_CONFIG, type GoogleFetch } from './google.tokens';

const OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const OAUTH_REVOKE_URL = 'https://oauth2.googleapis.com/revoke';
const OAUTH_AUTHORIZE_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';
const TASKS_API_BASE = 'https://tasks.googleapis.com/tasks/v1';

export type GoogleApiErrorCode =
  | 'invalid_request'
  | 'unauthorized' // token inválido/expirado/revogado
  | 'forbidden' // permissão insuficiente (ex.: accessRole de leitura)
  | 'not_found'
  | 'rate_limited'
  | 'server_error'
  | 'timeout'
  | 'network_error';

export class GoogleApiError extends Error {
  constructor(
    message: string,
    public readonly code: GoogleApiErrorCode,
    public readonly status: number | null,
    public readonly requestId: string,
    public readonly retryAfterMs: number | null = null,
  ) {
    super(message);
    this.name = 'GoogleApiError';
  }
}

function errorCodeForStatus(status: number): GoogleApiErrorCode {
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not_found';
  if (status === 429) return 'rate_limited';
  if (status >= 500) return 'server_error';
  return 'invalid_request';
}

const MAX_GET_RETRIES = 2;

/**
 * Cliente centralizado das APIs do Google usadas por esta issue (#31):
 * troca/refresh/revogação de token OAuth + Calendar API (calendarList) +
 * Tasks API (tasklists). Nunca chama `fetch` diretamente de outro
 * arquivo do módulo.
 *
 * - `client_id`/`client_secret` (app OAuth do BRAÇO) vêm de
 *   `GoogleOAuthConfig`, injetável — testes trocam por config local sem
 *   precisar de rede real.
 * - Chamadas autenticadas por usuário (Calendar/Tasks) recebem o access
 *   token da PRÓPRIA empresa como parâmetro — nunca lido de variável
 *   global, nunca logado.
 * - Retry automático só em GET (idempotente por natureza HTTP), mesmo
 *   padrão do `ZernioClient`.
 * - Logs nunca incluem token, client_secret, corpo da requisição/resposta
 *   — só método, path, status, duração, um `requestId` de correlação
 *   interno.
 */
@Injectable()
export class GoogleApiClient {
  constructor(
    @Inject(GOOGLE_OAUTH_CONFIG) private readonly config: GoogleOAuthConfig | null,
    @Inject(GOOGLE_FETCH) private readonly fetchFn: GoogleFetch,
  ) {}

  isEnabled(): boolean {
    return this.config !== null;
  }

  private requireConfig(): GoogleOAuthConfig {
    if (!this.config) {
      throw new ServiceUnavailableException('Integração com o Google não está configurada neste ambiente.');
    }
    return this.config;
  }

  /** Pura — não faz nenhuma chamada de rede. */
  buildAuthorizationUrl(state: string): string {
    const config = this.requireConfig();
    const url = new URL(OAUTH_AUTHORIZE_URL);
    url.searchParams.set('client_id', config.clientId);
    url.searchParams.set('redirect_uri', config.redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', GOOGLE_OAUTH_SCOPES.join(' '));
    url.searchParams.set('state', state);
    // access_type=offline + prompt=consent: garante refresh_token mesmo
    // em reautorizações (issue #31 §8 — "considerar que um refresh token
    // novo pode não ser retornado em todas as autorizações"; pedir
    // consent explicitamente aumenta a chance de recebê-lo quando
    // precisamos, sem forçar em toda vez seria pior para o usuário, mas
    // é a troca mais segura para não ficar sem refresh token na primeira
    // conexão).
    url.searchParams.set('access_type', 'offline');
    url.searchParams.set('prompt', 'consent');
    url.searchParams.set('include_granted_scopes', 'true');
    return url.toString();
  }

  async exchangeCodeForTokens(code: string): Promise<GoogleTokenResponse> {
    const config = this.requireConfig();
    return this.postForm<GoogleTokenResponse>(OAUTH_TOKEN_URL, {
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      grant_type: 'authorization_code',
    });
  }

  async refreshAccessToken(refreshToken: string): Promise<GoogleTokenResponse> {
    const config = this.requireConfig();
    return this.postForm<GoogleTokenResponse>(OAUTH_TOKEN_URL, {
      refresh_token: refreshToken,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: 'refresh_token',
    });
  }

  /** Best-effort — chamador nunca deve deixar uma falha aqui impedir o disconnect local. */
  async revokeToken(token: string): Promise<void> {
    await this.postForm(OAUTH_REVOKE_URL, { token });
  }

  async listCalendars(accessToken: string): Promise<GoogleCalendarListEntry[]> {
    const items: GoogleCalendarListEntry[] = [];
    let pageToken: string | undefined;
    do {
      const query = pageToken ? `?pageToken=${encodeURIComponent(pageToken)}` : '';
      const page = await this.authenticatedGet<GoogleCalendarListResponse>(
        `${CALENDAR_API_BASE}/users/me/calendarList${query}`,
        accessToken,
      );
      items.push(...page.items);
      pageToken = page.nextPageToken;
    } while (pageToken);
    return items;
  }

  /** Mais barato que `calendars.get` — já traz `accessRole` (issue #31 §3: usar metadata oficial, não criar evento fake para provar acesso). */
  async getCalendarListEntry(accessToken: string, calendarId: string): Promise<GoogleCalendarListEntry> {
    return this.authenticatedGet<GoogleCalendarListEntry>(
      `${CALENDAR_API_BASE}/users/me/calendarList/${encodeURIComponent(calendarId)}`,
      accessToken,
    );
  }

  async listTaskLists(accessToken: string): Promise<GoogleTaskList[]> {
    const items: GoogleTaskList[] = [];
    let pageToken: string | undefined;
    do {
      const query = pageToken ? `?pageToken=${encodeURIComponent(pageToken)}` : '';
      const page = await this.authenticatedGet<GoogleTaskListsResponse>(`${TASKS_API_BASE}/users/@me/lists${query}`, accessToken);
      items.push(...(page.items ?? []));
      pageToken = page.nextPageToken;
    } while (pageToken);
    return items;
  }

  async createTaskList(accessToken: string, title: string): Promise<GoogleTaskList> {
    return this.authenticatedPost<GoogleTaskList>(`${TASKS_API_BASE}/users/@me/lists`, accessToken, { title });
  }

  // --- internals ---------------------------------------------------------

  private async postForm<T>(url: string, body: Record<string, string>): Promise<T> {
    return this.request<T>({
      method: 'POST',
      url,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(body).toString(),
      canRetry: false,
    });
  }

  private async authenticatedGet<T>(url: string, accessToken: string): Promise<T> {
    return this.request<T>({
      method: 'GET',
      url,
      headers: { Authorization: `Bearer ${accessToken}` },
      canRetry: true,
    });
  }

  private async authenticatedPost<T>(url: string, accessToken: string, body: unknown): Promise<T> {
    return this.request<T>({
      method: 'POST',
      url,
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      canRetry: false,
    });
  }

  private async request<T>(options: {
    method: 'GET' | 'POST';
    url: string;
    headers: Record<string, string>;
    body?: string;
    canRetry: boolean;
  }): Promise<T> {
    const config = this.requireConfig();
    let attempt = 0;

    for (;;) {
      const requestId = randomUUID();
      const startedAt = Date.now();
      try {
        const result = await this.doRequest<T>(options, config.requestTimeoutMs, requestId);
        this.log(options.method, options.url, 200, Date.now() - startedAt, requestId);
        return result;
      } catch (err) {
        if (!(err instanceof GoogleApiError)) throw err;
        this.log(options.method, options.url, err.status ?? 0, Date.now() - startedAt, requestId);

        const shouldRetry =
          options.canRetry &&
          attempt < MAX_GET_RETRIES &&
          (err.code === 'rate_limited' || err.code === 'server_error' || err.code === 'timeout' || err.code === 'network_error');
        if (!shouldRetry) throw err;

        attempt += 1;
        const backoffMs = err.retryAfterMs ?? 2 ** attempt * 250;
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }
  }

  private async doRequest<T>(
    options: { method: 'GET' | 'POST'; url: string; headers: Record<string, string>; body?: string },
    timeoutMs: number,
    requestId: string,
  ): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    let response: Response;
    try {
      response = await this.fetchFn(options.url, {
        method: options.method,
        headers: options.headers,
        body: options.body,
        signal: controller.signal,
      });
    } catch (err) {
      const isAbort = err instanceof Error && err.name === 'AbortError';
      throw new GoogleApiError(
        isAbort ? 'Tempo limite excedido ao chamar o Google.' : 'Falha de rede ao chamar o Google.',
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
      // Nunca inclui o corpo da resposta de erro do Google na mensagem —
      // pode conter detalhe interno; quem chama decide a mensagem exibida.
      throw new GoogleApiError(
        `Google respondeu ${response.status} para ${options.method} ${new URL(options.url).pathname}.`,
        errorCodeForStatus(response.status),
        response.status,
        requestId,
        Number.isFinite(retryAfterMs) ? retryAfterMs : null,
      );
    }

    if (response.status === 204) return undefined as T;
    const text = await response.text();
    if (!text) return undefined as T;
    return JSON.parse(text) as T;
  }

  private log(method: string, url: string, status: number, durationMs: number, requestId: string) {
    // eslint-disable-next-line no-console
    console.log(
      JSON.stringify({
        scope: 'google_http',
        method,
        path: new URL(url).hostname + new URL(url).pathname,
        status,
        durationMs,
        requestId,
      }),
    );
  }
}
