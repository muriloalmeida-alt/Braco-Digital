import { Injectable } from '@nestjs/common';

/**
 * Contadores/observações de latência para a integração Zernio.
 *
 * Placeholder deliberado: este projeto não tem Prometheus/OpenTelemetry
 * instalado (`docs/technical/11-observability.md` descreve um stack
 * externo que ainda não existe em código — nenhuma dependência nova de
 * infra foi adicionada só para esta feature). Os nomes das métricas abaixo
 * já seguem a convenção que um `prom-client` real usaria
 * (`zernio_http_requests_total`, etc.), então trocar este serviço por um
 * `Counter`/`Histogram` de verdade no futuro é uma troca local, sem
 * reescrever os pontos de instrumentação espalhados pelo módulo.
 *
 * Nenhum label usa telefone, conteúdo, segredo ou identificador pessoal —
 * só `event`, `status`, `errorCode`, `direction` (valores de baixa
 * cardinalidade, nunca um ID de mensagem/conta).
 */
@Injectable()
export class ZernioMetrics {
  private readonly counters = new Map<string, number>();
  private readonly durations: number[] = [];

  private key(name: string, labels?: Record<string, string | number>): string {
    if (!labels) return name;
    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join(',');
    return `${name}{${labelStr}}`;
  }

  private inc(name: string, labels?: Record<string, string | number>) {
    const k = this.key(name, labels);
    this.counters.set(k, (this.counters.get(k) ?? 0) + 1);
  }

  httpRequest(method: string, path: string, status: number, durationMs: number) {
    this.inc('zernio_http_requests_total', { method, path, status });
    this.durations.push(durationMs);
    if (status >= 400) this.inc('zernio_http_errors_total', { method, path, status });
  }

  webhookReceived(event: string) {
    this.inc('zernio_webhooks_received_total', { event });
  }

  webhookInvalidSignature() {
    this.inc('zernio_webhooks_invalid_signature_total');
  }

  webhookDuplicate(event: string) {
    this.inc('zernio_webhooks_duplicate_total', { event });
  }

  messageSent() {
    this.inc('zernio_messages_sent_total');
  }

  messageFailed(errorCode: string) {
    this.inc('zernio_messages_failed_total', { errorCode });
  }

  connectionStatus(status: string) {
    this.inc('zernio_connection_status', { status });
  }

  /** Só para testes/inspeção — nunca exposto por uma rota pública. */
  snapshot(): Record<string, number> {
    return Object.fromEntries(this.counters);
  }
}
