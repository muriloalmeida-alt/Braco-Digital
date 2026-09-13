import { Injectable, Logger } from '@nestjs/common';
import { AnalyticsEventDto, AnalyticsEventName } from './dto/analytics-event.dto';

/**
 * TD17 — Analytics de Track B relayado pelo servidor. `properties` é
 * restrito a uma allowlist por evento — a garantia técnica de que PII
 * (nome/telefone/e-mail) nunca é enviada, não uma convenção de boa
 * vontade. Qualquer chave fora da lista é descartada antes de logar.
 */
const ANALYTICS_PROPERTY_ALLOWLIST: Record<AnalyticsEventName, string[]> = {
  landing_view: [],
  diagnostic_start: [],
  diagnostic_step_complete: ['step'],
  diagnostic_complete: [],
  recommendation_view: ['availableCount', 'typeKeys'],
  lead_submit: [],
  lead_submit_success: ['leadId'],
  lead_submit_error: ['reason'],
};

const DEDUP_WINDOW_MS = 60_000;

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger('GrowthAnalytics');
  // Relay leve em memória — não sobrevive a restart/múltiplas instâncias.
  // Evolução futura (TD17): trocar por um destino compartilhado sem
  // mudar o contrato do evento no frontend.
  private readonly seenEventIds = new Map<string, number>();

  track(dto: AnalyticsEventDto) {
    this.evictExpired();
    if (this.seenEventIds.has(dto.eventId)) {
      return { deduped: true };
    }
    this.seenEventIds.set(dto.eventId, Date.now());

    const allowlist = ANALYTICS_PROPERTY_ALLOWLIST[dto.event];
    const sanitizedProperties: Record<string, unknown> = {};
    for (const key of allowlist) {
      if (dto.properties && key in dto.properties) {
        sanitizedProperties[key] = dto.properties[key];
      }
    }

    this.logger.log(
      JSON.stringify({
        event: dto.event,
        sessionId: dto.sessionId,
        path: dto.path,
        properties: sanitizedProperties,
      }),
    );

    return { deduped: false };
  }

  private evictExpired() {
    const cutoff = Date.now() - DEDUP_WINDOW_MS;
    for (const [id, seenAt] of this.seenEventIds) {
      if (seenAt < cutoff) this.seenEventIds.delete(id);
    }
  }
}
