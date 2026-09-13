import { ConflictException, ForbiddenException, Injectable } from '@nestjs/common';
import { ZernioConnectionStatus, ZernioMessageDirection, ZernioMessageStatus } from '@prisma/client';
import { createHash } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { ZernioClient } from './zernio-client';
import { ZernioMetrics } from './zernio-metrics';
import type { ZernioSendMessageResponse } from './zernio-api-types';

export interface SendMessageResult {
  messageId: string;
  conversationId: string;
}

/**
 * Envio idempotente de mensagem (issue #30). Reaproveita o mesmo
 * `IdempotencyKey` genérico já usado em US03
 * (`digital-employees.service.ts`) — mesmo contrato que o Zernio pede:
 * mesma chave + corpo igual devolve a mesma resposta; corpo diferente
 * rejeita (422 lá, `ConflictException` aqui).
 */
@Injectable()
export class ZernioMessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly client: ZernioClient,
    private readonly metrics: ZernioMetrics,
  ) {}

  async sendMessage(companyId: string, conversationId: string, text: string, idempotencyKey: string): Promise<SendMessageResult> {
    const requestHash = createHash('sha256').update(JSON.stringify({ conversationId, text })).digest('hex');

    return this.prisma.withTenant(companyId, async (tx) => {
      const existingKey = await tx.idempotencyKey.findUnique({
        where: { companyId_key: { companyId, key: idempotencyKey } },
      });
      if (existingKey) {
        if (existingKey.requestHash !== requestHash) {
          throw new ConflictException('Idempotency-Key já usada com um corpo de mensagem diferente.');
        }
        return existingKey.responseBody as unknown as SendMessageResult;
      }

      // Ownership do accountId: nunca aceito do chamador — sempre o da
      // própria conexão da empresa (issue #30, "verificar ownership do
      // accountId"). Confirma também connectionMode=REAL e estado
      // operacional antes de gastar uma chamada de rede.
      const connection = await tx.zernioConnection.findUnique({ where: { companyId } });
      if (!connection?.accountId) {
        throw new ForbiddenException('Nenhuma conexão de WhatsApp real configurada para esta empresa.');
      }
      if (connection.status !== ZernioConnectionStatus.CONNECTED) {
        throw new ForbiddenException('A conexão de WhatsApp não está em estado operacional (CONNECTED).');
      }

      let response: ZernioSendMessageResponse;
      try {
        response = await this.client.request<ZernioSendMessageResponse>({
          method: 'POST',
          path: `/inbox/conversations/${encodeURIComponent(conversationId)}/messages`,
          idempotencyKey,
          body: { accountId: connection.accountId, message: text },
        });
      } catch (err) {
        // Timeout/5xx ambíguo: a Meta pode ter aceitado a mensagem antes
        // da falha aparente. Não repetimos aqui dentro (client já garante
        // isso para verbos não-GET) e não persistimos a IdempotencyKey —
        // uma nova tentativa com a MESMA chave continua possível depois
        // que o chamador reconciliar (issue #30: "reconcilie antes de
        // decidir pela repetição"). O que registramos é só a métrica de
        // falha, nunca a mensagem como enviada.
        this.metrics.messageFailed(errorCodeOf(err));
        throw err;
      }

      const result: SendMessageResult = {
        messageId: response.data.messageId,
        conversationId: response.data.conversationId,
      };

      await tx.zernioMessage.create({
        data: {
          companyId,
          direction: ZernioMessageDirection.OUTBOUND,
          conversationId: response.data.conversationId,
          platformMessageId: response.data.messageId,
          text,
          status: ZernioMessageStatus.SENT,
          idempotencyKey,
          sentAt: new Date(),
        },
      });

      await tx.idempotencyKey.create({
        data: {
          companyId,
          key: idempotencyKey,
          requestHash,
          statusCode: 201,
          responseBody: result as unknown as object,
        },
      });

      this.metrics.messageSent();
      return result;
    });
  }
}

function errorCodeOf(err: unknown): string {
  return err && typeof err === 'object' && 'code' in err ? String((err as { code: unknown }).code) : 'unknown_error';
}
