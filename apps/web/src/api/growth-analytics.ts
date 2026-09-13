import { request } from './client';

/**
 * TD17 — Funil de Track B sem PII, relayado pelo servidor
 * (`POST /public/analytics/events`). `sessionId` é um UUID de cliente
 * guardado em `sessionStorage` (nunca `localStorage` — não deve
 * sobreviver ao fechamento da aba, docs/technical/20-sprint-02-tech-
 * readiness.md §8) — nunca ligado a nome/telefone/e-mail.
 */
const SESSION_KEY = 'braco.growth.sessionId';

export function getGrowthSessionId(): string {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export type GrowthAnalyticsEvent =
  | 'landing_view'
  | 'diagnostic_start'
  | 'diagnostic_step_complete'
  | 'diagnostic_complete'
  | 'recommendation_view'
  | 'lead_submit'
  | 'lead_submit_success'
  | 'lead_submit_error';

/**
 * Fire-and-forget de propósito: uma falha de rede no relay de analytics
 * nunca deve travar ou atrapalhar a experiência do visitante.
 */
export function trackGrowthEvent(event: GrowthAnalyticsEvent, properties?: Record<string, unknown>) {
  request('/public/analytics/events', {
    method: 'POST',
    body: JSON.stringify({
      event,
      sessionId: getGrowthSessionId(),
      eventId: crypto.randomUUID(),
      path: window.location.pathname + window.location.search,
      properties,
    }),
  }).catch(() => {
    // Silencioso — analytics nunca deve interromper a experiência.
  });
}
