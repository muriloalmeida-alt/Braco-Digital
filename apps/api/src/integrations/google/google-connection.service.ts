import { ForbiddenException, Inject, Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { GoogleConnectionStatus, IntegrationConnectionMode, IntegrationStatus, IntegrationType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { GoogleApiClient, GoogleApiError } from './google-api-client';
import { CREDENTIALS_CIPHER } from './google.tokens';
import type { CredentialsCipher } from './credentials-cipher';

const OAUTH_ATTEMPT_TTL_MS = 10 * 60 * 1000; // 10 minutos
const TASKS_LIST_TITLE = 'BRAÇO — Follow-ups';
/** Margem de segurança antes de considerar o access token "quase expirando". */
const TOKEN_REFRESH_SAFETY_MARGIN_MS = 60_000;

export type GoogleCallbackErrorReason =
  | 'session_expired' // state ausente/inexistente/expirado/já consumido (replay)
  | 'connection_cancelled' // usuário negou/cancelou no consentimento do Google
  | 'google_error' // troca de code por token falhou
  | 'callback_mismatch';

export interface GoogleCallbackResult {
  redirectTo: string;
}

export interface GoogleResourceState {
  status: IntegrationStatus | 'NOT_NECESSARY';
  connectionMode: IntegrationConnectionMode | null;
  externalAccountRef: string | null;
  connectedAt: Date | null;
}

export interface GoogleStatusView {
  connection: {
    status: GoogleConnectionStatus;
    googleAccountEmail: string | null;
    connectedAt: Date | null;
    lastRefreshAt: Date | null;
    failureReason: string | null;
  } | null;
  calendar: GoogleResourceState & { calendarId: string | null; calendarSummary: string | null };
  tasks: GoogleResourceState & { taskListId: string | null };
}

function errorCodeOf(err: unknown): string {
  return err instanceof GoogleApiError ? err.code : 'unknown_error';
}

/**
 * Orquestração do OAuth Google compartilhado + seleção de Calendar +
 * setup de Tasks (issue #31, US14). `ResourcesService`/
 * `PreparationReadinessService` (TD19) não são alterados — este serviço
 * só escreve nas mesmas linhas `Integration` (GOOGLE_CALENDAR/
 * GOOGLE_TASKS) que eles já leem, sempre com `connectionMode: REAL`
 * (nunca `SIMULATED`, que continua sendo o caminho de
 * `ResourcesService.confirmConnection`) — e só depois de validação real
 * contra a API do Google (nunca a partir do callback isolado).
 */
@Injectable()
export class GoogleConnectionService {
  private readonly logger = new Logger(GoogleConnectionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly apiClient: GoogleApiClient,
    @Inject(CREDENTIALS_CIPHER) private readonly cipherOrNull: CredentialsCipher | null,
  ) {}

  /**
   * `null` quando o Google não está totalmente configurado neste
   * ambiente (mesma condição que já deixa `apiClient` desabilitado) —
   * nunca chamado num caminho que `apiClient.requireConfig()` não tenha
   * validado antes, mas o guard explícito evita qualquer dúvida.
   */
  private get cipher(): CredentialsCipher {
    if (!this.cipherOrNull) {
      throw new ServiceUnavailableException('Integração com o Google não está configurada neste ambiente.');
    }
    return this.cipherOrNull;
  }

  async startOAuth(companyId: string, userId: string): Promise<{ authorizationUrl: string }> {
    // requireConfig acontece dentro de `apiClient.buildAuthorizationUrl` —
    // falha cedo e claro (503) se a integração não estiver habilitada.
    const attemptId = await this.prisma.withTenant(companyId, async (tx) => {
      const attempt = await tx.googleOAuthAttempt.create({
        data: { companyId, initiatedByUserId: userId, expiresAt: new Date(Date.now() + OAUTH_ATTEMPT_TTL_MS) },
      });
      await tx.googleConnection.upsert({
        where: { companyId },
        create: { companyId, status: GoogleConnectionStatus.CONNECTING },
        update: { status: GoogleConnectionStatus.CONNECTING },
      });
      return attempt.id;
    });

    // `state` = o próprio id da tentativa — nunca confiamos em companyId/
    // userId vindos isoladamente da query string do callback (issue #31
    // §6); o callback correlaciona por aqui, server-side.
    const authorizationUrl = this.apiClient.buildAuthorizationUrl(attemptId);
    return { authorizationUrl };
  }

  /**
   * Callback público (issue #31 §6). `query` são os parâmetros crus da
   * URL — nunca confiados isoladamente; a validação real é a correlação
   * interna (`state` == `GoogleOAuthAttempt.id`).
   */
  async handleCallback(query: Record<string, string | undefined>): Promise<GoogleCallbackResult> {
    const state = query.state;
    if (!state) return { redirectTo: this.resultUrl('error', 'session_expired') };

    const attempt = await this.prisma.withGoogleAttemptLookup(state, (tx) => tx.googleOAuthAttempt.findUnique({ where: { id: state } }));

    if (!attempt || attempt.consumedAt || attempt.expiresAt.getTime() < Date.now()) {
      // Não existe, já foi usada (replay) ou expirou — tratados igual,
      // nunca revelando qual dos três é, por segurança.
      return { redirectTo: this.resultUrl('error', 'session_expired') };
    }

    const { companyId } = attempt;

    // Consome a tentativa JÁ AQUI, antes de qualquer outro efeito — uma
    // segunda chamada com o mesmo `state` (replay) cai no bloco acima na
    // próxima vez, não importa o resultado desta.
    await this.prisma.withGoogleAttemptLookup(state, (tx) =>
      tx.googleOAuthAttempt.update({ where: { id: state }, data: { consumedAt: new Date() } }),
    );

    if (query.error) {
      // Autorização cancelada/negada pelo usuário no consentimento do
      // Google — estado compreensível, nunca um erro técnico cru.
      await this.prisma.withTenant(companyId, (tx) =>
        tx.googleConnection.update({
          where: { companyId },
          data: { status: GoogleConnectionStatus.NOT_CONNECTED, failureReason: 'connection_cancelled' },
        }),
      );
      return { redirectTo: this.resultUrl('error', 'connection_cancelled') };
    }

    if (!query.code) {
      return { redirectTo: this.resultUrl('error', 'callback_mismatch') };
    }

    let tokens;
    try {
      tokens = await this.apiClient.exchangeCodeForTokens(query.code);
    } catch (err) {
      this.logger.warn(`Falha ao trocar code por token Google (companyId=${companyId}): ${errorCodeOf(err)}`);
      await this.prisma.withTenant(companyId, (tx) =>
        tx.googleConnection.update({
          where: { companyId },
          data: { status: GoogleConnectionStatus.FAILED, failureReason: 'token_exchange_failed' },
        }),
      );
      return { redirectTo: this.resultUrl('error', 'google_error') };
    }

    await this.prisma.withTenant(companyId, async (tx) => {
      const existing = await tx.googleConnection.findUniqueOrThrow({ where: { companyId } });
      const accessTokenEncrypted = await this.cipher.encrypt(tokens.access_token);
      // Nunca sobrescrever um refresh token válido por null quando o
      // Google não devolve um novo (issue #31 §8) — só grava se veio.
      const refreshTokenEncrypted = tokens.refresh_token
        ? await this.cipher.encrypt(tokens.refresh_token)
        : existing.refreshTokenEncrypted;

      await tx.googleConnection.update({
        where: { companyId },
        data: {
          status: GoogleConnectionStatus.CONNECTED,
          accessTokenEncrypted,
          refreshTokenEncrypted,
          tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
          grantedScopes: tokens.scope ? tokens.scope.split(' ') : existing.grantedScopes,
          connectedAt: existing.connectedAt ?? new Date(),
          failureReason: null,
        },
      });
    });

    return { redirectTo: this.resultUrl('success') };
  }

  async listAvailableCalendars(companyId: string) {
    const { accessToken } = await this.ensureValidAccessToken(companyId);
    const calendars = await this.apiClient.listCalendars(accessToken);
    return calendars.map((c) => ({
      id: c.id,
      summary: c.summary,
      primary: c.primary ?? false,
      accessRole: c.accessRole,
      canWrite: c.accessRole === 'owner' || c.accessRole === 'writer',
    }));
  }

  /**
   * issue #31 §3: valida que a conta tem permissão suficiente (accessRole
   * oficial da API, nunca um evento fake criado só para provar acesso)
   * antes de persistir e marcar REAL+CONNECTED.
   */
  async selectCalendar(companyId: string, calendarId: string): Promise<GoogleResourceState> {
    const { accessToken } = await this.ensureValidAccessToken(companyId);

    let entry;
    try {
      entry = await this.apiClient.getCalendarListEntry(accessToken, calendarId);
    } catch (err) {
      if (err instanceof GoogleApiError && err.code === 'not_found') {
        throw new NotFoundException('Calendário não encontrado nesta conta Google.');
      }
      throw new ForbiddenException('Não conseguimos acessar este recurso com a conta conectada.');
    }

    if (entry.accessRole !== 'owner' && entry.accessRole !== 'writer') {
      throw new ForbiddenException(
        'Esta conta não tem permissão de escrita neste calendário — selecione um calendário onde você é dono ou colaborador.',
      );
    }

    await this.prisma.withTenant(companyId, (tx) =>
      tx.googleConnection.update({
        where: { companyId },
        data: { calendarId: entry.id, calendarSummary: entry.summary },
      }),
    );

    return this.syncGenericIntegration(companyId, IntegrationType.GOOGLE_CALENDAR, IntegrationStatus.CONNECTED, entry.id);
  }

  /**
   * issue #31 §4: nunca pede para o gestor escolher uma lista — encontra/
   * cria "BRAÇO — Follow-ups" de forma idempotente.
   */
  async setupTasksList(companyId: string): Promise<GoogleResourceState> {
    const { accessToken } = await this.ensureValidAccessToken(companyId);

    const lists = await this.apiClient.listTaskLists(accessToken);
    const existing = lists.find((l) => l.title === TASKS_LIST_TITLE);
    const taskList = existing ?? (await this.apiClient.createTaskList(accessToken, TASKS_LIST_TITLE));

    await this.prisma.withTenant(companyId, (tx) =>
      tx.googleConnection.update({ where: { companyId }, data: { taskListId: taskList.id } }),
    );

    return this.syncGenericIntegration(companyId, IntegrationType.GOOGLE_TASKS, IntegrationStatus.CONNECTED, taskList.id);
  }

  async getStatus(companyId: string): Promise<GoogleStatusView> {
    return this.prisma.withTenant(companyId, async (tx) => {
      const [connection, calendarIntegration, tasksIntegration] = await Promise.all([
        tx.googleConnection.findUnique({ where: { companyId } }),
        tx.integration.findUnique({ where: { companyId_type: { companyId, type: IntegrationType.GOOGLE_CALENDAR } } }),
        tx.integration.findUnique({ where: { companyId_type: { companyId, type: IntegrationType.GOOGLE_TASKS } } }),
      ]);

      return {
        connection: connection
          ? {
              status: connection.status,
              googleAccountEmail: connection.googleAccountEmail,
              connectedAt: connection.connectedAt,
              lastRefreshAt: connection.lastRefreshAt,
              failureReason: connection.failureReason,
            }
          : null,
        calendar: {
          status: calendarIntegration?.status ?? IntegrationStatus.NOT_CONFIGURED,
          connectionMode: calendarIntegration?.connectionMode ?? null,
          externalAccountRef: calendarIntegration?.externalAccountRef ?? null,
          connectedAt: calendarIntegration?.connectedAt ?? null,
          calendarId: connection?.calendarId ?? null,
          calendarSummary: connection?.calendarSummary ?? null,
        },
        tasks: {
          status: tasksIntegration?.status ?? IntegrationStatus.NOT_CONFIGURED,
          connectionMode: tasksIntegration?.connectionMode ?? null,
          externalAccountRef: tasksIntegration?.externalAccountRef ?? null,
          connectedAt: tasksIntegration?.connectedAt ?? null,
          taskListId: connection?.taskListId ?? null,
        },
      };
    });
  }

  /**
   * issue #31 §12: Calendar/Tasks compartilham OAuth mas são percebidos
   * separados. Desconectar um não revoga a autorização compartilhada se
   * o outro continuar ativo; só faz best-effort revoke + limpa as
   * credenciais quando NENHUM recurso Google continuar conectado.
   */
  async disconnectCalendar(companyId: string): Promise<GoogleStatusView> {
    await this.prisma.withTenant(companyId, async (tx) => {
      const existing = await tx.integration.findUnique({
        where: { companyId_type: { companyId, type: IntegrationType.GOOGLE_CALENDAR } },
      });
      if (!existing) throw new NotFoundException('Recurso não configurado.');
      await tx.integration.update({
        where: { companyId_type: { companyId, type: IntegrationType.GOOGLE_CALENDAR } },
        data: { status: IntegrationStatus.DISCONNECTED, externalAccountRef: null, connectedAt: null },
      });
      await tx.googleConnection.update({ where: { companyId }, data: { calendarId: null, calendarSummary: null } });
    });
    await this.revokeSharedConnectionIfNoResourceActive(companyId);
    return this.getStatus(companyId);
  }

  async disconnectTasks(companyId: string): Promise<GoogleStatusView> {
    await this.prisma.withTenant(companyId, async (tx) => {
      const existing = await tx.integration.findUnique({
        where: { companyId_type: { companyId, type: IntegrationType.GOOGLE_TASKS } },
      });
      if (!existing) throw new NotFoundException('Recurso não configurado.');
      await tx.integration.update({
        where: { companyId_type: { companyId, type: IntegrationType.GOOGLE_TASKS } },
        data: { status: IntegrationStatus.DISCONNECTED, externalAccountRef: null, connectedAt: null },
      });
      await tx.googleConnection.update({ where: { companyId }, data: { taskListId: null } });
    });
    await this.revokeSharedConnectionIfNoResourceActive(companyId);
    return this.getStatus(companyId);
  }

  private async revokeSharedConnectionIfNoResourceActive(companyId: string): Promise<void> {
    const stillActive = await this.prisma.withTenant(companyId, async (tx) => {
      const [calendar, tasks] = await Promise.all([
        tx.integration.findUnique({ where: { companyId_type: { companyId, type: IntegrationType.GOOGLE_CALENDAR } } }),
        tx.integration.findUnique({ where: { companyId_type: { companyId, type: IntegrationType.GOOGLE_TASKS } } }),
      ]);
      return calendar?.status === IntegrationStatus.CONNECTED || tasks?.status === IntegrationStatus.CONNECTED;
    });
    if (stillActive) return;

    const connection = await this.prisma.withTenant(companyId, (tx) => tx.googleConnection.findUnique({ where: { companyId } }));
    if (!connection) return;

    // Revoke é best-effort: um erro remoto nunca deixa o BRAÇO declarando
    // o recurso CONNECTED de novo (os dois já foram marcados DISCONNECTED
    // acima, antes desta chamada) — só registramos e seguimos limpando as
    // credenciais locais de qualquer forma, já que a intenção do usuário
    // (desconectar) deve valer localmente mesmo se o Google não confirmar.
    const tokenToRevoke = connection.refreshTokenEncrypted ?? connection.accessTokenEncrypted;
    if (tokenToRevoke) {
      try {
        const plain = await this.cipher.decrypt(tokenToRevoke);
        await this.apiClient.revokeToken(plain);
      } catch (err) {
        this.logger.warn(`Falha ao revogar token Google (companyId=${companyId}, best-effort): ${errorCodeOf(err)}`);
      }
    }

    await this.prisma.withTenant(companyId, (tx) =>
      tx.googleConnection.update({
        where: { companyId },
        data: {
          status: GoogleConnectionStatus.DISCONNECTED,
          accessTokenEncrypted: null,
          refreshTokenEncrypted: null,
          tokenExpiresAt: null,
          grantedScopes: [],
          disconnectedAt: new Date(),
        },
      }),
    );
  }

  /**
   * Devolve um access token válido, renovando via refresh token quando
   * necessário. "Nunca sobrescrever um refresh token válido por null
   * quando o Google não devolve um novo" (issue #31 §8). Falha
   * definitiva de refresh (ex.: revogado externamente) degrada a conexão
   * e os recursos afetados — nunca mantém CONNECTED silenciosamente.
   */
  private async ensureValidAccessToken(companyId: string): Promise<{ accessToken: string }> {
    const connection = await this.prisma.withTenant(companyId, (tx) => tx.googleConnection.findUnique({ where: { companyId } }));
    if (!connection?.accessTokenEncrypted) {
      throw new ForbiddenException('Nenhuma conexão Google configurada para esta empresa.');
    }

    const stillFresh = connection.tokenExpiresAt && connection.tokenExpiresAt.getTime() - TOKEN_REFRESH_SAFETY_MARGIN_MS > Date.now();
    if (stillFresh) {
      return { accessToken: await this.cipher.decrypt(connection.accessTokenEncrypted) };
    }

    if (!connection.refreshTokenEncrypted) {
      await this.markDegraded(companyId, 'missing_refresh_token');
      throw new ForbiddenException('A conexão com o Google expirou. Reconecte para continuar.');
    }

    const refreshToken = await this.cipher.decrypt(connection.refreshTokenEncrypted);
    let tokens;
    try {
      tokens = await this.apiClient.refreshAccessToken(refreshToken);
    } catch (err) {
      this.logger.warn(`Falha ao renovar token Google (companyId=${companyId}): ${errorCodeOf(err)}`);
      await this.markDegraded(companyId, errorCodeOf(err));
      throw new ForbiddenException('Não foi possível renovar a conexão com o Google. Reconecte para continuar.');
    }

    await this.prisma.withTenant(companyId, async (tx) => {
      const accessTokenEncrypted = await this.cipher.encrypt(tokens.access_token);
      const refreshTokenEncrypted = tokens.refresh_token ? await this.cipher.encrypt(tokens.refresh_token) : connection.refreshTokenEncrypted;
      await tx.googleConnection.update({
        where: { companyId },
        data: {
          accessTokenEncrypted,
          refreshTokenEncrypted,
          tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
          lastRefreshAt: new Date(),
          status: GoogleConnectionStatus.CONNECTED,
          failureReason: null,
        },
      });
    });

    return { accessToken: tokens.access_token };
  }

  /**
   * Falha definitiva de refresh/revogação (issue #31 §8): GoogleConnection
   * fica DEGRADED; qualquer recurso hoje CONNECTED vira NEEDS_ATTENTION —
   * nunca considerado válido para readiness (TD19 já garante isso ao
   * exigir status CONNECTED, que deixa de valer aqui).
   */
  private async markDegraded(companyId: string, reason: string): Promise<void> {
    await this.prisma.withTenant(companyId, async (tx) => {
      await tx.googleConnection.update({
        where: { companyId },
        data: { status: GoogleConnectionStatus.DEGRADED, failureReason: reason },
      });
      for (const type of [IntegrationType.GOOGLE_CALENDAR, IntegrationType.GOOGLE_TASKS]) {
        const row = await tx.integration.findUnique({ where: { companyId_type: { companyId, type } } });
        if (row?.status === IntegrationStatus.CONNECTED) {
          await tx.integration.update({ where: { companyId_type: { companyId, type } }, data: { status: IntegrationStatus.NEEDS_ATTENTION } });
        }
      }
    });
  }

  private async syncGenericIntegration(
    companyId: string,
    type: typeof IntegrationType.GOOGLE_CALENDAR | typeof IntegrationType.GOOGLE_TASKS,
    status: IntegrationStatus,
    externalAccountRef: string,
  ): Promise<GoogleResourceState> {
    const row = await this.prisma.withTenant(companyId, (tx) =>
      tx.integration.upsert({
        where: { companyId_type: { companyId, type } },
        create: {
          companyId,
          type,
          status,
          connectionMode: IntegrationConnectionMode.REAL,
          externalAccountRef,
          connectedAt: status === IntegrationStatus.CONNECTED ? new Date() : null,
        },
        update: {
          status,
          connectionMode: IntegrationConnectionMode.REAL,
          externalAccountRef,
          connectedAt: status === IntegrationStatus.CONNECTED ? new Date() : undefined,
        },
      }),
    );
    return {
      status: row.status,
      connectionMode: row.connectionMode,
      externalAccountRef: row.externalAccountRef,
      connectedAt: row.connectedAt,
    };
  }

  private resultUrl(result: 'success' | 'error', reason?: GoogleCallbackErrorReason): string {
    // UI real de Recursos: aponta para o handler central de callback do
    // apps/web (`/integrations/callback`), que reconstrói o estado a
    // partir da querystring + do return path guardado em sessionStorage —
    // funciona mesmo com hard reload, sem depender de estado React
    // efêmero. Ver docs/technical/22-google-workspace-integration.md.
    const base = (process.env.CORS_ORIGIN ?? '').split(',')[0]?.trim() || 'http://localhost:5173';
    const url = new URL('/integrations/callback', base);
    url.searchParams.set('google', result);
    if (reason) url.searchParams.set('reason', reason);
    return url.toString();
  }
}
