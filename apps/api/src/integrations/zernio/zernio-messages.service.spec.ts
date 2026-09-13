import { ConflictException, ForbiddenException } from '@nestjs/common';
import { ZernioConnectionStatus } from '@prisma/client';
import type { PrismaService } from '../../prisma/prisma.service';
import type { ZernioClient } from './zernio-client';
import { ZernioMessagesService } from './zernio-messages.service';
import { ZernioMetrics } from './zernio-metrics';

function createFakePrisma(connection: { accountId: string | null; status: ZernioConnectionStatus } | null) {
  const idempotencyKeys = new Map<string, { requestHash: string; responseBody: unknown }>();
  const messages: Record<string, unknown>[] = [];

  const tx = {
    idempotencyKey: {
      findUnique: async ({ where }: { where: { companyId_key: { companyId: string; key: string } } }) =>
        idempotencyKeys.get(`${where.companyId_key.companyId}:${where.companyId_key.key}`) ?? null,
      create: async ({ data }: { data: { companyId: string; key: string; requestHash: string; responseBody: unknown } }) => {
        idempotencyKeys.set(`${data.companyId}:${data.key}`, data);
        return data;
      },
    },
    zernioConnection: {
      findUnique: async () => connection,
    },
    zernioMessage: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        messages.push(data);
        return data;
      },
    },
  };

  return {
    prisma: { withTenant: async (_companyId: string, fn: (tx: unknown) => unknown) => fn(tx) } as unknown as PrismaService,
    idempotencyKeys,
    messages,
  };
}

const CONNECTED = { accountId: 'acc-1', status: ZernioConnectionStatus.CONNECTED };

describe('ZernioMessagesService', () => {
  it('envia e persiste a mensagem + a IdempotencyKey na primeira chamada', async () => {
    const { prisma, idempotencyKeys, messages } = createFakePrisma(CONNECTED);
    const client = {
      request: jest.fn(async () => ({ success: true, warnings: [], data: { messageId: 'wamid.1', conversationId: 'conv-1', attachments: [], messageIds: ['wamid.1'] } })),
    } as unknown as ZernioClient;
    const service = new ZernioMessagesService(prisma, client, new ZernioMetrics());

    const result = await service.sendMessage('company-1', 'conv-1', 'Olá!', 'idem-1');

    expect(result).toEqual({ messageId: 'wamid.1', conversationId: 'conv-1' });
    expect(client.request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        path: '/inbox/conversations/conv-1/messages',
        idempotencyKey: 'idem-1',
        body: { accountId: 'acc-1', message: 'Olá!' },
      }),
    );
    expect(messages).toHaveLength(1);
    expect(idempotencyKeys.get('company-1:idem-1')).toBeDefined();
  });

  it('reutiliza a MESMA chave para o mesmo corpo: retorna a resposta já salva, sem chamar o Zernio de novo', async () => {
    const { prisma } = createFakePrisma(CONNECTED);
    const client = {
      request: jest.fn(async () => ({ success: true, warnings: [], data: { messageId: 'wamid.1', conversationId: 'conv-1', attachments: [], messageIds: ['wamid.1'] } })),
    } as unknown as ZernioClient;
    const service = new ZernioMessagesService(prisma, client, new ZernioMetrics());

    const first = await service.sendMessage('company-1', 'conv-1', 'Olá!', 'idem-1');
    const second = await service.sendMessage('company-1', 'conv-1', 'Olá!', 'idem-1'); // retry técnico — mesma chave

    expect(second).toEqual(first);
    expect(client.request).toHaveBeenCalledTimes(1); // não chamou o Zernio de novo
  });

  it('rejeita a mesma chave com um corpo diferente (não é uma repetição técnica)', async () => {
    const { prisma } = createFakePrisma(CONNECTED);
    const client = { request: jest.fn(async () => ({ success: true, warnings: [], data: { messageId: 'wamid.1', conversationId: 'conv-1', attachments: [], messageIds: [] } })) } as unknown as ZernioClient;
    const service = new ZernioMessagesService(prisma, client, new ZernioMetrics());

    await service.sendMessage('company-1', 'conv-1', 'Olá!', 'idem-1');

    await expect(service.sendMessage('company-1', 'conv-1', 'Mensagem completamente diferente', 'idem-1')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('nunca aceita accountId do chamador — usa sempre o da própria conexão da empresa', async () => {
    const { prisma } = createFakePrisma(CONNECTED);
    const client = { request: jest.fn(async () => ({ success: true, warnings: [], data: { messageId: 'wamid.1', conversationId: 'conv-1', attachments: [], messageIds: [] } })) } as unknown as ZernioClient;
    const service = new ZernioMessagesService(prisma, client, new ZernioMetrics());

    await service.sendMessage('company-1', 'conv-1', 'Olá!', 'idem-1');
    const call = (client.request as jest.Mock).mock.calls[0][0];
    expect(call.body.accountId).toBe('acc-1'); // não há como o chamador injetar outro
  });

  it('recusa enviar sem uma conexão real (sem accountId)', async () => {
    const { prisma } = createFakePrisma(null);
    const client = { request: jest.fn() } as unknown as ZernioClient;
    const service = new ZernioMessagesService(prisma, client, new ZernioMetrics());

    await expect(service.sendMessage('company-1', 'conv-1', 'Olá!', 'idem-1')).rejects.toBeInstanceOf(ForbiddenException);
    expect(client.request).not.toHaveBeenCalled();
  });

  it('recusa enviar quando a conexão não está CONNECTED (ex.: DEGRADED)', async () => {
    const { prisma } = createFakePrisma({ accountId: 'acc-1', status: ZernioConnectionStatus.DEGRADED });
    const client = { request: jest.fn() } as unknown as ZernioClient;
    const service = new ZernioMessagesService(prisma, client, new ZernioMetrics());

    await expect(service.sendMessage('company-1', 'conv-1', 'Olá!', 'idem-1')).rejects.toBeInstanceOf(ForbiddenException);
    expect(client.request).not.toHaveBeenCalled();
  });

  it('falha ambígua (erro do client): não persiste a mensagem nem a IdempotencyKey — permite retry legítimo depois', async () => {
    const { prisma, messages, idempotencyKeys } = createFakePrisma(CONNECTED);
    const client = { request: jest.fn(async () => { throw new Error('timeout'); }) } as unknown as ZernioClient;
    const service = new ZernioMessagesService(prisma, client, new ZernioMetrics());

    await expect(service.sendMessage('company-1', 'conv-1', 'Olá!', 'idem-1')).rejects.toThrow('timeout');
    expect(messages).toHaveLength(0);
    expect(idempotencyKeys.size).toBe(0);
  });
});
