import { BadRequestException, ForbiddenException, Inject, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { Prisma, ZernioMessageDirection, ZernioMessageStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ZernioConnectionService } from './zernio-connection.service';
import { ZernioMetrics } from './zernio-metrics';
import { verifyZernioSignature } from './zernio-signature';
import { ZERNIO_CONFIG } from './zernio.tokens';
import type { ZernioConfig } from './zernio-config';
import type { ZernioMessageReceivedEvent, ZernioWebhookEnvelope } from './zernio-api-types';

export interface ZernioWebhookHeaders {
  signature?: string;
  eventId?: string;
  eventType?: string;
}

const PRISMA_UNIQUE_CONSTRAINT_ERROR = 'P2002';

function isUniqueConstraintError(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === PRISMA_UNIQUE_CONSTRAINT_ERROR;
}

/**
 * Sempre que um evento novo é usado como "sender" (`businessScopedUserId`
 * preferido, telefone como fallback — issue #30). Nunca assume que o
 * telefone está presente.
 */
export function resolveSenderIdentity(sender: { businessScopedUserId?: string; phoneNumber?: string }): string | null {
  return sender.businessScopedUserId ?? sender.phoneNumber ?? null;
}

/**
 * `metadata.standby === true` — o Meta Business Agent está no controle
 * da conversa; nenhuma resposta automática deve ser enviada enquanto
 * isso for verdade. Não há Runtime/auto-resposta neste código (fora de
 * escopo da issue #30), então esta função hoje só documenta a regra para
 * quem construir o consumidor de `ZernioMessage` no futuro — é ela quem
 * os testes unitários exercitam.
 */
export function shouldAutoRespond(event: Pick<ZernioMessageReceivedEvent, 'metadata'>): boolean {
  return event.metadata?.standby !== true;
}

/**
 * Recebimento seguro de webhook (issue #30): assinatura HMAC sobre o
 * corpo bruto, dedup persistente por `eventId`, resposta rápida (o
 * dedup e o registro do evento acontecem ANTES de qualquer efeito de
 * domínio, e o processamento em si é síncrono porque não há fila/Runtime
 * neste código — ver docs/technical/21-zernio-whatsapp-integration.md,
 * seção "Processamento assíncrono").
 */
@Injectable()
export class ZernioWebhookService {
  private readonly logger = new Logger(ZernioWebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(ZERNIO_CONFIG) private readonly config: ZernioConfig | null,
    private readonly metrics: ZernioMetrics,
    private readonly connectionService: ZernioConnectionService,
  ) {}

  async handleWebhook(rawBody: Buffer, headers: ZernioWebhookHeaders): Promise<void> {
    if (!this.config) {
      throw new ServiceUnavailableException('Integração com o Zernio não está configurada neste ambiente.');
    }

    if (!headers.signature || !verifyZernioSignature(rawBody, headers.signature, this.config.webhookSecret)) {
      this.metrics.webhookInvalidSignature();
      // Nunca registrar o segredo nem a assinatura recebida — só o fato
      // de que a verificação falhou.
      throw new ForbiddenException('Assinatura do webhook inválida.');
    }

    let payload: ZernioWebhookEnvelope;
    try {
      payload = JSON.parse(rawBody.toString('utf8'));
    } catch {
      throw new BadRequestException('Corpo do webhook não é JSON válido.');
    }

    if (!payload.id || !payload.event) {
      throw new BadRequestException('Payload do webhook malformado (faltando id/event).');
    }
    if (headers.eventId && headers.eventId !== payload.id) {
      // payload.id e X-Zernio-Event-Id precisam bater — issue #30.
      throw new BadRequestException('X-Zernio-Event-Id não corresponde a payload.id.');
    }

    this.metrics.webhookReceived(payload.event);

    const accountId = payload.account?.accountId ?? payload.account?.id ?? null;
    const companyId = accountId ? await this.connectionService.findCompanyIdByAccountId(accountId) : null;

    const eventRow = await this.insertEventOrNull(companyId, payload);
    if (!eventRow) {
      // Já existia (mesmo eventId) — entrega repetida (at-least-once).
      // 200 sem repetir nenhum efeito de domínio.
      this.metrics.webhookDuplicate(payload.event);
      return;
    }

    try {
      await this.processEvent(companyId, payload);
      await this.markProcessed(companyId, eventRow.id, null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'erro desconhecido';
      this.logger.warn(`Falha ao processar evento Zernio ${payload.event} (eventId=${payload.id}): ${message}`);
      await this.markProcessed(companyId, eventRow.id, message);
      // Não relança: o evento já foi persistido e a resposta HTTP já vai
      // ser 200 — uma falha de processamento não deve fazer o Zernio
      // reentregar infinitamente algo que vai falhar do mesmo jeito de
      // novo. `processingError` fica registrado para investigação manual.
    }
  }

  private async insertEventOrNull(companyId: string | null, payload: ZernioWebhookEnvelope) {
    const data = { eventId: payload.id, eventType: payload.event, companyId, payload: payload as unknown as Prisma.InputJsonValue };
    try {
      if (companyId) {
        return await this.prisma.withTenant(companyId, (tx) => tx.zernioWebhookEvent.create({ data }));
      }
      // Evento órfão (accountId desconhecido) — sem tenant para setar;
      // a policy de RLS libera explicitamente `company_id IS NULL`.
      return await this.prisma.zernioWebhookEvent.create({ data });
    } catch (err) {
      if (isUniqueConstraintError(err)) return null;
      throw err;
    }
  }

  private async markProcessed(companyId: string | null, eventRowId: string, processingError: string | null) {
    const data = { processedAt: new Date(), processingError };
    if (companyId) {
      await this.prisma.withTenant(companyId, (tx) => tx.zernioWebhookEvent.update({ where: { id: eventRowId }, data }));
    } else {
      await this.prisma.zernioWebhookEvent.update({ where: { id: eventRowId }, data });
    }
  }

  private async processEvent(companyId: string | null, payload: ZernioWebhookEnvelope): Promise<void> {
    if (!companyId) {
      // Evento órfão: nenhum tenant sabido, nada além de persistir para
      // auditoria (já feito) — não há como aplicar efeito de domínio sem
      // saber de quem é.
      return;
    }

    switch (payload.event) {
      case 'message.received':
        await this.handleMessageReceived(companyId, payload as unknown as ZernioMessageReceivedEvent);
        break;
      case 'message.sent':
      case 'message.delivered':
      case 'message.read':
      case 'message.failed':
        await this.handleMessageStatus(companyId, payload);
        break;
      case 'account.connected':
        await this.connectionService.touchLastWebhookAt(companyId);
        await this.connectionService.refreshStatus(companyId);
        break;
      case 'account.disconnected':
        await this.connectionService.touchLastWebhookAt(companyId);
        await this.connectionService.markDisconnected(companyId, 'account.disconnected');
        break;
      case 'whatsapp.number.activated':
      case 'whatsapp.number.declined':
      case 'whatsapp.number.action_required':
      case 'whatsapp.number.verification_required':
      case 'whatsapp.number.suspended':
      case 'whatsapp.number.reactivated':
      case 'whatsapp.number.released':
        // Qualquer mudança de status de número: reconsulta o status real
        // em vez de tentar mapear cada evento individualmente — "nunca
        // tratar ausência/presença de webhook como prova de estado",
        // sempre perguntar ao provedor (issue #30).
        await this.connectionService.touchLastWebhookAt(companyId);
        await this.connectionService.refreshStatus(companyId);
        break;
      default:
        this.logger.log(`Evento Zernio sem handler dedicado: ${payload.event}`);
    }
  }

  private async handleMessageReceived(companyId: string, event: ZernioMessageReceivedEvent): Promise<void> {
    const standby = event.metadata?.standby === true;
    const senderIdentity = resolveSenderIdentity(event.message.sender);

    await this.prisma.withTenant(companyId, async (tx) => {
      const existing = await tx.zernioMessage.findUnique({
        where: { platformMessageId: event.message.platformMessageId },
      });
      if (existing) return; // defesa extra além do dedup por eventId

      await tx.zernioMessage.create({
        data: {
          companyId,
          direction: ZernioMessageDirection.INBOUND,
          conversationId: event.message.conversationId,
          platformMessageId: event.message.platformMessageId,
          text: event.message.text,
          status: ZernioMessageStatus.RECEIVED,
          senderIdentity,
          standby,
        },
      });
    });

    // `shouldAutoRespond(event)` é a regra que um futuro consumidor de
    // Runtime deve checar antes de responder — nenhuma resposta
    // automática é disparada a partir daqui (fora de escopo, ver módulo).
  }

  private async handleMessageStatus(companyId: string, payload: ZernioWebhookEnvelope): Promise<void> {
    const message = (payload as { message?: { platformMessageId?: string } }).message;
    const platformMessageId = message?.platformMessageId;
    if (!platformMessageId) return;

    const statusByEvent: Record<string, ZernioMessageStatus> = {
      'message.sent': ZernioMessageStatus.SENT,
      'message.delivered': ZernioMessageStatus.DELIVERED,
      'message.read': ZernioMessageStatus.READ,
      'message.failed': ZernioMessageStatus.FAILED,
    };
    const status = statusByEvent[payload.event];
    if (!status) return;

    await this.prisma.withTenant(companyId, async (tx) => {
      const existing = await tx.zernioMessage.findUnique({ where: { platformMessageId } });
      if (!existing) {
        // Mensagem anterior a este deploy, ou pertence a outra conta —
        // ignora silenciosamente (não é um erro de processamento).
        return;
      }
      await tx.zernioMessage.update({
        where: { platformMessageId },
        data: {
          status,
          deliveredAt: status === ZernioMessageStatus.DELIVERED ? new Date() : existing.deliveredAt,
          readAt: status === ZernioMessageStatus.READ ? new Date() : existing.readAt,
        },
      });
    });
  }
}
