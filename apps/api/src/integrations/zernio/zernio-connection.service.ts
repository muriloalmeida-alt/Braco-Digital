import { Inject, Injectable, Logger } from '@nestjs/common';
import { IntegrationConnectionMode, IntegrationStatus, IntegrationType, Prisma, ZernioConnectionStatus } from '@prisma/client';
import { createHash } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { ZernioClient, ZernioApiError } from './zernio-client';
import { ZERNIO_CONFIG } from './zernio.tokens';
import type { ZernioConfig } from './zernio-config';
import { ZernioMetrics } from './zernio-metrics';
import type {
  ZernioCallbackErrorCode,
  ZernioConnectWhatsappResponse,
  ZernioCreateProfileResponse,
  ZernioNumberInfoResponse,
} from './zernio-api-types';

const ONBOARDING_ATTEMPT_TTL_MS = 10 * 60 * 1000; // 10 minutos

/** Mapeia o estado detalhado do Zernio para o `IntegrationStatus` genérico
 * que `ResourcesService`/`PreparationReadinessService` (Track A, TD19) já
 * leem — nenhuma dessas duas classes precisa saber que "Zernio" existe. */
export function toIntegrationStatus(status: ZernioConnectionStatus): IntegrationStatus {
  switch (status) {
    case ZernioConnectionStatus.CONNECTED:
      return IntegrationStatus.CONNECTED;
    case ZernioConnectionStatus.CONNECTING:
      return IntegrationStatus.CONNECTING;
    case ZernioConnectionStatus.DEGRADED:
    case ZernioConnectionStatus.FAILED:
      return IntegrationStatus.NEEDS_ATTENTION;
    case ZernioConnectionStatus.DISCONNECTED:
      return IntegrationStatus.DISCONNECTED;
    case ZernioConnectionStatus.NOT_CONNECTED:
    default:
      return IntegrationStatus.NOT_CONFIGURED;
  }
}

export interface ZernioCallbackResult {
  redirectTo: string;
}

/**
 * Onboarding, callback e status real da conexão WhatsApp/Zernio
 * (issue #30). `ResourcesService`/`PreparationReadinessService` (TD19,
 * Product Review 01) não são alterados — este serviço só escreve na
 * mesma linha `Integration` (tipo WHATSAPP) que eles já leem, sempre com
 * `connectionMode: REAL` (nunca `SIMULATED`, que é o caminho de
 * `ResourcesService.confirmConnection`).
 */
@Injectable()
export class ZernioConnectionService {
  private readonly logger = new Logger(ZernioConnectionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly client: ZernioClient,
    @Inject(ZERNIO_CONFIG) private readonly config: ZernioConfig | null,
    private readonly metrics: ZernioMetrics,
  ) {}

  /**
   * "Idempotente do ponto de vista do BRAÇO": nunca cria um segundo
   * profile para uma empresa que já tem um — sempre olha nosso próprio
   * banco primeiro.
   */
  private async ensureProfile(tx: Prisma.TransactionClient, companyId: string): Promise<string> {
    const existing = await tx.zernioConnection.findUnique({ where: { companyId } });
    if (existing?.profileId) return existing.profileId;

    const company = await tx.company.findUniqueOrThrow({ where: { id: companyId } });
    const created = await this.client.request<ZernioCreateProfileResponse>({
      method: 'POST',
      path: '/profiles',
      body: { name: `BRAÇO — ${company.name}` },
    });

    await tx.zernioConnection.upsert({
      where: { companyId },
      create: { companyId, profileId: created._id },
      update: { profileId: created._id },
    });
    return created._id;
  }

  async startOnboarding(companyId: string, userId: string): Promise<{ authUrl: string }> {
    // requireConfig acontece dentro de `client.request` — falha cedo e
    // claro (503) se a integração não estiver habilitada.
    const { profileId, attemptId } = await this.prisma.withTenant(companyId, async (tx) => {
      const profileId = await this.ensureProfile(tx, companyId);
      const attempt = await tx.zernioOnboardingAttempt.create({
        data: {
          companyId,
          initiatedByUserId: userId,
          profileId,
          expiresAt: new Date(Date.now() + ONBOARDING_ATTEMPT_TTL_MS),
        },
      });
      return { profileId, attemptId: attempt.id };
    });

    const config = this.config as ZernioConfig; // client.request já validou que existe
    const redirectUrl = `${config.redirectUrl}?correlationId=${encodeURIComponent(attemptId)}`;

    const response = await this.client.request<ZernioConnectWhatsappResponse>({
      method: 'GET',
      path: '/connect/whatsapp',
      query: { profileId, redirect_url: redirectUrl, onboarding: 'api', signup: 'hosted' },
    });

    await this.prisma.withTenant(companyId, (tx) =>
      tx.zernioConnection.update({ where: { companyId }, data: { status: ZernioConnectionStatus.CONNECTING } }),
    );
    await this.syncGenericIntegration(companyId, ZernioConnectionStatus.CONNECTING, null);
    this.metrics.connectionStatus(ZernioConnectionStatus.CONNECTING);

    // Só o necessário devolvido ao frontend — nunca o `state` bruto do
    // Zernio nem qualquer outro detalhe interno.
    return { authUrl: response.authUrl };
  }

  /**
   * Callback público (issue #30, seção "Callback"). `query` são os
   * parâmetros crus da URL — nunca confiados isoladamente; a validação
   * real é a correlação interna (`correlationId`) mais a consulta de
   * status real ao Zernio antes de marcar CONNECTED.
   */
  async handleCallback(query: Record<string, string | undefined>): Promise<ZernioCallbackResult> {
    const correlationId = query.correlationId;
    if (!correlationId) {
      return { redirectTo: this.resultUrl('error', 'session_expired') };
    }

    const attempt = await this.prisma.withZernioAttemptLookup(correlationId, (tx) =>
      tx.zernioOnboardingAttempt.findUnique({ where: { id: correlationId } }),
    );

    if (!attempt || attempt.consumedAt || attempt.expiresAt.getTime() < Date.now()) {
      // Não existe, já foi usada (replay) ou expirou — os três casos são
      // tratados igual: nunca revelar qual dos três é, por segurança.
      return { redirectTo: this.resultUrl('error', 'session_expired') };
    }

    const { companyId, profileId } = attempt;

    // Consome a tentativa JÁ AQUI, antes de qualquer outro efeito — uma
    // segunda chamada com o mesmo correlationId (replay) cai no bloco
    // acima na próxima vez, não importa o resultado desta.
    await this.prisma.withZernioAttemptLookup(correlationId, (tx) =>
      tx.zernioOnboardingAttempt.update({ where: { id: correlationId }, data: { consumedAt: new Date() } }),
    );

    const errorCode = query.error as ZernioCallbackErrorCode | undefined;
    if (errorCode) {
      await this.prisma.withTenant(companyId, (tx) =>
        tx.zernioConnection.update({
          where: { companyId },
          data: {
            status: errorCode === 'connection_cancelled' ? ZernioConnectionStatus.NOT_CONNECTED : ZernioConnectionStatus.FAILED,
            failureReason: errorCode,
          },
        }),
      );
      await this.syncGenericIntegration(companyId, ZernioConnectionStatus.FAILED, null);
      return { redirectTo: this.resultUrl('error', errorCode) };
    }

    if (query.connected !== 'whatsapp' || query.profileId !== profileId || !query.accountId) {
      // Parâmetros de sucesso ausentes/inconsistentes com a tentativa que
      // conhecemos — não confiar isoladamente neles (issue #30).
      await this.prisma.withTenant(companyId, (tx) =>
        tx.zernioConnection.update({
          where: { companyId },
          data: { status: ZernioConnectionStatus.FAILED, failureReason: 'callback_mismatch' },
        }),
      );
      return { redirectTo: this.resultUrl('error', 'whatsapp_error') };
    }

    // Sucesso reportado pelo Zernio: persiste provisoriamente e SÓ ENTÃO
    // consulta o status real — o callback sozinho nunca marca CONNECTED.
    await this.prisma.withTenant(companyId, (tx) =>
      tx.zernioConnection.update({
        where: { companyId },
        data: { accountId: query.accountId, phoneNumber: query.username ?? null },
      }),
    );

    const status = await this.refreshStatus(companyId);
    return status === ZernioConnectionStatus.CONNECTED
      ? { redirectTo: this.resultUrl('success') }
      : { redirectTo: this.resultUrl('error', 'whatsapp_error') };
  }

  /**
   * "Consultar o status real no Zernio antes de marcar a integração como
   * pronta" — chamado ao final do callback, e pode ser chamado sob
   * demanda (endpoint de refresh) ou por um evento de webhook
   * relacionado a conta/número. Nunca infere status a partir da ausência
   * de webhook — sempre pergunta ao provedor.
   */
  async refreshStatus(companyId: string): Promise<ZernioConnectionStatus> {
    const connection = await this.prisma.withTenant(companyId, (tx) => tx.zernioConnection.findUnique({ where: { companyId } }));

    if (!connection?.accountId) {
      return ZernioConnectionStatus.NOT_CONNECTED;
    }

    let status: ZernioConnectionStatus;
    let providerStatus: string | null = null;
    let qualityRating: string | null = null;
    let nameStatus: string | null = null;
    let wabaVerificationStatus: string | null = null;
    let failureReason: string | null = null;

    try {
      const info = await this.client.request<ZernioNumberInfoResponse>({
        method: 'GET',
        path: '/whatsapp/number-info',
        query: { accountId: connection.accountId },
      });
      providerStatus = info.phone.status;
      qualityRating = info.phone.quality_rating;
      nameStatus = info.phone.name_status;
      wabaVerificationStatus = info.waba.business_verification_status;
      // Vocabulário completo de `phone.status` não está documentado além
      // de "CONNECTED" no exemplo dado — qualquer outro valor é tratado
      // como degradado (precisa de atenção), nunca como confirmação
      // silenciosa de que está tudo bem nem como desconexão sem prova.
      if (providerStatus === 'CONNECTED') {
        status = qualityRating === 'RED' ? ZernioConnectionStatus.DEGRADED : ZernioConnectionStatus.CONNECTED;
      } else {
        status = ZernioConnectionStatus.DEGRADED;
        failureReason = `provider_status_${providerStatus}`;
      }
    } catch (err) {
      if (err instanceof ZernioApiError && err.code === 'not_found') {
        // Provedor confirma que a conta não existe mais — desconexão
        // confirmada, não uma falha temporária.
        status = ZernioConnectionStatus.DISCONNECTED;
        failureReason = 'account_not_found';
      } else {
        // Timeout, 5xx, rate limit, credencial etc.: falha transitória —
        // nunca vira DISCONNECTED sem confirmação do provedor.
        status = ZernioConnectionStatus.DEGRADED;
        failureReason = err instanceof ZernioApiError ? err.code : 'unknown_error';
        this.logger.warn(`Falha ao consultar status Zernio (companyId=${companyId}): ${failureReason}`);
      }
    }

    await this.prisma.withTenant(companyId, (tx) =>
      tx.zernioConnection.update({
        where: { companyId },
        data: {
          status,
          providerStatus,
          qualityRating,
          nameStatus,
          wabaVerificationStatus,
          failureReason,
          lastHealthCheckAt: new Date(),
          connectedAt: status === ZernioConnectionStatus.CONNECTED ? (connection.connectedAt ?? new Date()) : connection.connectedAt,
          disconnectedAt: status === ZernioConnectionStatus.DISCONNECTED ? new Date() : connection.disconnectedAt,
        },
      }),
    );
    await this.syncGenericIntegration(companyId, status, connection.accountId);
    this.metrics.connectionStatus(status);
    return status;
  }

  /** Webhook `account.disconnected` — desconexão confirmada pelo próprio provedor. */
  async markDisconnected(companyId: string, reason: string): Promise<void> {
    await this.prisma.withTenant(companyId, (tx) =>
      tx.zernioConnection.update({
        where: { companyId },
        data: {
          status: ZernioConnectionStatus.DISCONNECTED,
          disconnectedAt: new Date(),
          failureReason: reason,
        },
      }),
    );
    await this.syncGenericIntegration(companyId, ZernioConnectionStatus.DISCONNECTED, null);
    this.metrics.connectionStatus(ZernioConnectionStatus.DISCONNECTED);
  }

  async touchLastWebhookAt(companyId: string): Promise<void> {
    await this.prisma.withTenant(companyId, (tx) =>
      tx.zernioConnection.update({ where: { companyId }, data: { lastWebhookAt: new Date() } }),
    );
  }

  /** Resolve `companyId` a partir do `accountId` do Zernio — usado pelo webhook. */
  async findCompanyIdByAccountId(accountId: string): Promise<string | null> {
    const connection = await this.prisma.withZernioAccountLookup(accountId, (tx) =>
      tx.zernioConnection.findUnique({ where: { accountId }, select: { companyId: true } }),
    );
    return connection?.companyId ?? null;
  }

  /**
   * Registro idempotente da assinatura de webhook (issue #30: "não criar
   * nova assinatura em todo deploy"). Chamado manualmente (script/rota
   * administrativa), nunca automaticamente no bootstrap da aplicação —
   * ver docs/technical/21-zernio-whatsapp-integration.md.
   */
  async ensureWebhookRegistered(webhookUrl: string, webhookSecret: string, events: string[]): Promise<'created' | 'updated' | 'unchanged'> {
    const eventsHash = createHashOf(events);
    const existing = await this.prisma.zernioWebhookRegistration.findUnique({ where: { id: 'default' } });

    if (existing && existing.url === webhookUrl && existing.eventsHash === eventsHash) {
      return 'unchanged';
    }

    await this.client.request({
      method: 'POST',
      path: '/webhooks/settings',
      body: { name: 'BRAÇO Produção', url: webhookUrl, secret: webhookSecret, events },
    });

    await this.prisma.zernioWebhookRegistration.upsert({
      where: { id: 'default' },
      create: { id: 'default', url: webhookUrl, eventsHash },
      update: { url: webhookUrl, eventsHash },
    });

    return existing ? 'updated' : 'created';
  }

  private async syncGenericIntegration(companyId: string, status: ZernioConnectionStatus, accountId: string | null) {
    await this.prisma.withTenant(companyId, (tx) =>
      tx.integration.upsert({
        where: { companyId_type: { companyId, type: IntegrationType.WHATSAPP } },
        create: {
          companyId,
          type: IntegrationType.WHATSAPP,
          status: toIntegrationStatus(status),
          connectionMode: IntegrationConnectionMode.REAL,
          externalAccountRef: accountId,
          connectedAt: status === ZernioConnectionStatus.CONNECTED ? new Date() : null,
        },
        update: {
          status: toIntegrationStatus(status),
          connectionMode: IntegrationConnectionMode.REAL,
          ...(accountId ? { externalAccountRef: accountId } : {}),
          ...(status === ZernioConnectionStatus.CONNECTED ? { connectedAt: new Date() } : {}),
        },
      }),
    );
  }

  private resultUrl(result: 'success' | 'error', reason?: string): string {
    // Fora do escopo confirmado desta issue (não inclui apps/web): sem
    // uma tela dedicada, o redirecionamento final aponta para a origem
    // web configurada com uma querystring de resultado — ver docs/
    // technical/21-zernio-whatsapp-integration.md, seção "Limitações".
    const base = (process.env.CORS_ORIGIN ?? '').split(',')[0]?.trim() || 'http://localhost:5173';
    const url = new URL(base);
    url.searchParams.set('zernio', result);
    if (reason) url.searchParams.set('reason', reason);
    return url.toString();
  }
}

function createHashOf(events: string[]): string {
  return createHash('sha256').update(JSON.stringify([...events].sort())).digest('hex');
}
