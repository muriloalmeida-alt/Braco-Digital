import { IsIn, IsObject, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/**
 * TD17 — Analytics de Track B relayado pelo servidor, nunca um SDK de
 * terceiro no browser. `properties` é restrito a uma allowlist por
 * evento na camada de serviço (`ANALYTICS_PROPERTY_ALLOWLIST`,
 * `analytics.service.ts`) — a allowlist é a garantia técnica de que PII
 * não é enviada, não uma convenção de boa vontade.
 */
export const ANALYTICS_EVENT_NAMES = [
  'landing_view',
  'diagnostic_start',
  'diagnostic_step_complete',
  'diagnostic_complete',
  'recommendation_view',
  'lead_submit',
  'lead_submit_success',
  'lead_submit_error',
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENT_NAMES)[number];

export class AnalyticsEventDto {
  @IsIn(ANALYTICS_EVENT_NAMES)
  event!: AnalyticsEventName;

  /** UUID de cliente (sessionStorage) — nunca ligado a PII até virar Lead. */
  @IsUUID()
  sessionId!: string;

  /** Dedup: mesmo id reentregue dentro da janela curta é ignorado. */
  @IsUUID()
  eventId!: string;

  @IsOptional()
  @IsObject()
  properties?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  path?: string;
}
