import { request } from './client';

/**
 * UI real de Recursos (issue #38) — cliente HTTP dos endpoints
 * company-level de conexão real, separados da rota genérica
 * `digital-employees/:id/resources` (que continua sendo a fonte de
 * status/obrigatoriedade lida por `RecursosStep`, ver `preparation.ts`).
 *
 * Nunca guarda token/refresh token/client secret aqui nem em nenhum
 * outro lugar do cliente — só o que os endpoints já devolvem
 * publicamente (status, referências de conta/calendário/lista).
 */

// --- WhatsApp / Zernio ---------------------------------------------------

export interface ZernioConnectResponse {
  authUrl: string;
}

export const zernioApi = {
  connect: () => request<ZernioConnectResponse>('/integrations/zernio/whatsapp/connect', { method: 'POST' }),
  refresh: () => request<{ status: string }>('/integrations/zernio/whatsapp/refresh', { method: 'POST' }),
  disconnect: () => request<{ status: string }>('/integrations/zernio/whatsapp/disconnect', { method: 'POST' }),
};

// --- Google (Calendar + Tasks) -------------------------------------------

export interface GoogleConnectResponse {
  authorizationUrl: string;
}

export interface GoogleCalendarOption {
  id: string;
  summary: string;
  primary: boolean;
  accessRole: string;
  canWrite: boolean;
}

export type GoogleResourceStatus = 'NOT_CONFIGURED' | 'CONNECTING' | 'CONNECTED' | 'NEEDS_ATTENTION' | 'DISCONNECTED' | 'NOT_NECESSARY';

export interface GoogleResourceState {
  status: GoogleResourceStatus;
  connectionMode: 'SIMULATED' | 'REAL' | null;
  externalAccountRef: string | null;
  connectedAt: string | null;
}

export interface GoogleStatusView {
  connection: {
    status: 'NOT_CONNECTED' | 'CONNECTING' | 'CONNECTED' | 'DEGRADED' | 'DISCONNECTED' | 'FAILED';
    googleAccountEmail: string | null;
    connectedAt: string | null;
    lastRefreshAt: string | null;
    failureReason: string | null;
  } | null;
  calendar: GoogleResourceState & { calendarId: string | null; calendarSummary: string | null };
  tasks: GoogleResourceState & { taskListId: string | null };
}

export const googleApi = {
  connect: () => request<GoogleConnectResponse>('/integrations/google/connect', { method: 'POST' }),
  getStatus: () => request<GoogleStatusView>('/integrations/google/status'),
  listCalendars: () => request<GoogleCalendarOption[]>('/integrations/google/calendars'),
  selectCalendar: (calendarId: string) =>
    request<GoogleResourceState>('/integrations/google/calendar/select', { method: 'POST', body: JSON.stringify({ calendarId }) }),
  setupTasks: () => request<GoogleResourceState>('/integrations/google/tasks/setup', { method: 'POST' }),
  disconnectCalendar: () => request<GoogleStatusView>('/integrations/google/calendar/disconnect', { method: 'POST' }),
  disconnectTasks: () => request<GoogleStatusView>('/integrations/google/tasks/disconnect', { method: 'POST' }),
};

// --- Callback UX (return path) -------------------------------------------

const RETURN_PATH_KEY = 'braco.integrations.returnPath';

/**
 * Guarda só o *path* atual (same-origin, relativo) antes de redirecionar
 * para o provedor externo — nunca um token/segredo/PII. Usado pelo
 * handler central (`IntegrationsCallbackPage`) para voltar exatamente de
 * onde o usuário saiu, mesmo depois de um hard reload da página de
 * callback (o `sessionStorage` sobrevive a isso; estado React não).
 */
export function rememberIntegrationReturnPath(path: string = window.location.pathname + window.location.search) {
  // Só aceita caminho relativo same-origin — nunca uma URL absoluta (isso
  // é exatamente o que evita abrir um redirect para fora do BRAÇO aqui).
  if (path.startsWith('/')) {
    sessionStorage.setItem(RETURN_PATH_KEY, path);
  }
}

export function consumeIntegrationReturnPath(fallback = '/equipe'): string {
  const stored = sessionStorage.getItem(RETURN_PATH_KEY);
  sessionStorage.removeItem(RETURN_PATH_KEY);
  return stored && stored.startsWith('/') ? stored : fallback;
}
