import { ForbiddenException } from '@nestjs/common';
import { Prisma, ZernioMessageDirection, ZernioMessageStatus } from '@prisma/client';
import crypto from 'node:crypto';
import type { PrismaService } from '../../prisma/prisma.service';
import type { ZernioConfig } from './zernio-config';
import { ZernioMetrics } from './zernio-metrics';
import { ZernioWebhookService } from './zernio-webhook.service';

const CONFIG: ZernioConfig = {
  baseUrl: 'https://zernio.test/api/v1',
  apiKey: 'sk_test',
  webhookSecret: 'whsec_test',
  redirectUrl: 'https://api.example.com/callback',
  requestTimeoutMs: 1000,
};

function sign(body: Buffer): string {
  return crypto.createHmac('sha256', CONFIG.webhookSecret).update(body).digest('hex');
}

/**
 * Duplo fiel ao contrato de `PrismaService` — não é um mock genérico:
 * reproduz o comportamento real que o serviço depende (unique constraint
 * em `eventId`/`platformMessageId`, `withTenant` abrindo a "transação").
 * Sem isto, testar dedup/mapeamento exigiria Postgres real (padrão deste
 * repo é reservar isso para `test/*.e2e-spec.ts`) — aqui é unit de
 * verdade, sem rede nem banco.
 */
function createFakePrisma() {
  const webhookEventsByEventId = new Map<string, { id: string; eventId: string; eventType: string; companyId: string | null; payload: unknown; processedAt: Date | null; processingError: string | null }>();
  const messagesByPlatformId = new Map<string, Record<string, unknown>>();
  let counter = 0;

  function uniqueConstraintError() {
    return new Prisma.PrismaClientKnownRequestError('Unique constraint failed', { code: 'P2002', clientVersion: '5.22.0' });
  }

  const tx = {
    zernioWebhookEvent: {
      create: async ({ data }: { data: { eventId: string; eventType: string; companyId: string | null; payload: unknown } }) => {
        if (webhookEventsByEventId.has(data.eventId)) throw uniqueConstraintError();
        const row = { id: `evt-${++counter}`, ...data, processedAt: null as Date | null, processingError: null as string | null };
        webhookEventsByEventId.set(data.eventId, row);
        return row;
      },
      update: async ({ where, data }: { where: { id: string }; data: Partial<{ processedAt: Date; processingError: string | null }> }) => {
        const row = [...webhookEventsByEventId.values()].find((r) => r.id === where.id);
        if (row) Object.assign(row, data);
        return row;
      },
    },
    zernioMessage: {
      findUnique: async ({ where }: { where: { platformMessageId: string } }) => messagesByPlatformId.get(where.platformMessageId) ?? null,
      create: async ({ data }: { data: Record<string, unknown> }) => {
        messagesByPlatformId.set(data.platformMessageId as string, { ...data });
        return data;
      },
      update: async ({ where, data }: { where: { platformMessageId: string }; data: Record<string, unknown> }) => {
        const row = messagesByPlatformId.get(where.platformMessageId);
        if (row) Object.assign(row, data);
        return row;
      },
    },
  };

  return {
    prisma: {
      withTenant: async (_companyId: string, fn: (tx: unknown) => unknown) => fn(tx),
      zernioWebhookEvent: tx.zernioWebhookEvent, // caminho órfão (sem tenant conhecido)
    } as unknown as PrismaService,
    webhookEventsByEventId,
    messagesByPlatformId,
  };
}

function fakeConnectionService() {
  return {
    findCompanyIdByAccountId: jest.fn(async (accountId: string) => (accountId === 'acc-known' ? 'company-1' : null)),
    touchLastWebhookAt: jest.fn(async () => undefined),
    refreshStatus: jest.fn(async () => undefined),
    markDisconnected: jest.fn(async () => undefined),
  };
}

function messageReceivedPayload(overrides: Partial<{ id: string; platformMessageId: string; standby: boolean; sender: Record<string, string> }> = {}) {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    event: 'message.received',
    message: {
      id: 'internal-1',
      conversationId: 'conv-1',
      platform: 'whatsapp',
      platformMessageId: overrides.platformMessageId ?? 'wamid.1',
      direction: 'incoming',
      text: 'Olá, quero marcar um horário',
      attachments: [],
      sender: overrides.sender ?? { businessScopedUserId: 'bsuid-1', phoneNumber: '+5511999998888' },
      sentAt: new Date().toISOString(),
      isRead: false,
      sentVia: null,
    },
    conversation: { id: 'conv-1', platformConversationId: 'conv-1', participantId: '5511999998888', status: 'active' },
    account: { id: 'acc-known', accountId: 'acc-known', profileId: 'profile-1', platform: 'whatsapp' },
    metadata: overrides.standby !== undefined ? { standby: overrides.standby } : null,
    timestamp: new Date().toISOString(),
  };
}

describe('ZernioWebhookService', () => {
  it('rejeita webhook com assinatura ausente', async () => {
    const { prisma } = createFakePrisma();
    const service = new ZernioWebhookService(prisma, CONFIG, new ZernioMetrics(), fakeConnectionService() as never);
    const body = Buffer.from(JSON.stringify(messageReceivedPayload()));

    await expect(service.handleWebhook(body, {})).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejeita webhook com assinatura inválida', async () => {
    const { prisma } = createFakePrisma();
    const service = new ZernioWebhookService(prisma, CONFIG, new ZernioMetrics(), fakeConnectionService() as never);
    const body = Buffer.from(JSON.stringify(messageReceivedPayload()));

    await expect(service.handleWebhook(body, { signature: 'a'.repeat(64) })).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('mapeia message.received: persiste com sender preferindo businessScopedUserId', async () => {
    const { prisma, messagesByPlatformId } = createFakePrisma();
    const connectionService = fakeConnectionService();
    const service = new ZernioWebhookService(prisma, CONFIG, new ZernioMetrics(), connectionService as never);

    const payload = messageReceivedPayload({ platformMessageId: 'wamid.abc' });
    const body = Buffer.from(JSON.stringify(payload));

    await service.handleWebhook(body, { signature: sign(body), eventId: payload.id, eventType: 'message.received' });

    expect(connectionService.findCompanyIdByAccountId).toHaveBeenCalledWith('acc-known');
    const stored = messagesByPlatformId.get('wamid.abc');
    expect(stored).toMatchObject({
      companyId: 'company-1',
      direction: ZernioMessageDirection.INBOUND,
      status: ZernioMessageStatus.RECEIVED,
      senderIdentity: 'bsuid-1',
      standby: false,
    });
  });

  it('usa o telefone como fallback quando businessScopedUserId está ausente', async () => {
    const { prisma, messagesByPlatformId } = createFakePrisma();
    const service = new ZernioWebhookService(prisma, CONFIG, new ZernioMetrics(), fakeConnectionService() as never);

    const payload = messageReceivedPayload({ platformMessageId: 'wamid.fallback', sender: { phoneNumber: '+5511988887777' } });
    const body = Buffer.from(JSON.stringify(payload));
    await service.handleWebhook(body, { signature: sign(body), eventId: payload.id });

    expect(messagesByPlatformId.get('wamid.fallback')).toMatchObject({ senderIdentity: '+5511988887777' });
  });

  it('marca standby=true quando metadata.standby=true, sem disparar nada além de persistir', async () => {
    const { prisma, messagesByPlatformId } = createFakePrisma();
    const service = new ZernioWebhookService(prisma, CONFIG, new ZernioMetrics(), fakeConnectionService() as never);

    const payload = messageReceivedPayload({ platformMessageId: 'wamid.standby', standby: true });
    const body = Buffer.from(JSON.stringify(payload));
    await service.handleWebhook(body, { signature: sign(body), eventId: payload.id });

    expect(messagesByPlatformId.get('wamid.standby')).toMatchObject({ standby: true });
  });

  it('deduplicação: o mesmo eventId entregue duas vezes só produz um efeito', async () => {
    const { prisma, messagesByPlatformId } = createFakePrisma();
    const metrics = new ZernioMetrics();
    const service = new ZernioWebhookService(prisma, CONFIG, metrics, fakeConnectionService() as never);

    const payload = messageReceivedPayload({ platformMessageId: 'wamid.dup' });
    const body = Buffer.from(JSON.stringify(payload));
    const headers = { signature: sign(body), eventId: payload.id };

    await service.handleWebhook(body, headers);
    await service.handleWebhook(body, headers); // reentrega — "at least once"

    expect(messagesByPlatformId.size).toBe(1);
    expect(metrics.snapshot()['zernio_webhooks_duplicate_total{event=message.received}']).toBe(1);
  });

  it('account.disconnected atualiza o estado da conexão', async () => {
    const { prisma } = createFakePrisma();
    const connectionService = fakeConnectionService();
    const service = new ZernioWebhookService(prisma, CONFIG, new ZernioMetrics(), connectionService as never);

    const payload = { id: crypto.randomUUID(), event: 'account.disconnected', account: { id: 'acc-known', accountId: 'acc-known' } };
    const body = Buffer.from(JSON.stringify(payload));
    await service.handleWebhook(body, { signature: sign(body), eventId: payload.id });

    expect(connectionService.markDisconnected).toHaveBeenCalledWith('company-1', 'account.disconnected');
  });

  it('rejeita quando X-Zernio-Event-Id não corresponde a payload.id', async () => {
    const { prisma } = createFakePrisma();
    const service = new ZernioWebhookService(prisma, CONFIG, new ZernioMetrics(), fakeConnectionService() as never);

    const payload = messageReceivedPayload();
    const body = Buffer.from(JSON.stringify(payload));
    await expect(service.handleWebhook(body, { signature: sign(body), eventId: 'outro-id-completamente-diferente' })).rejects.toThrow();
  });

  it('evento órfão (accountId desconhecido) é persistido para auditoria, sem efeito de domínio, sem erro', async () => {
    const { prisma, webhookEventsByEventId } = createFakePrisma();
    const service = new ZernioWebhookService(prisma, CONFIG, new ZernioMetrics(), fakeConnectionService() as never);

    const payload = messageReceivedPayload({ platformMessageId: 'wamid.orphan' });
    payload.account = { id: 'acc-desconhecida', accountId: 'acc-desconhecida', profileId: 'p', platform: 'whatsapp' };
    const body = Buffer.from(JSON.stringify(payload));

    await expect(service.handleWebhook(body, { signature: sign(body), eventId: payload.id })).resolves.toBeUndefined();
    expect(webhookEventsByEventId.get(payload.id)?.companyId).toBeNull();
  });
});
