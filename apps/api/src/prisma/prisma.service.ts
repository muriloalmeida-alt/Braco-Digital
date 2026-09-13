import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

/**
 * Wrapper fino sobre o PrismaClient.
 *
 * `withTenant` é o único caminho aprovado para ler/escrever tabelas
 * tenant-scoped (company_memberships, digital_employees, work_manuals,
 * idempotency_keys): ele abre uma transação e seta
 * `app.current_company_id` via `set_config(..., true)` (equivalente a
 * `SET LOCAL`, resetado ao fim da transação) antes de qualquer query,
 * para que as policies de Row-Level Security (ver migration
 * `enable_row_level_security`) tenham o contexto de tenant correto.
 *
 * Nunca aceitar `companyId` vindo do corpo/query da requisição do
 * cliente para decidir isolamento — sempre do tenant resolvido no
 * JWT/sessão (ver docs/technical/04-multi-tenancy.md §2).
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async withTenant<T>(
    companyId: string,
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(
        `SELECT set_config('app.current_company_id', $1, true)`,
        companyId,
      );
      return fn(tx);
    });
  }

  /**
   * Usado apenas no login: nesse momento ainda não sabemos qual empresa é
   * o tenant ativo (é isso que a consulta de memberships vai descobrir), só
   * quem é o usuário. A policy de `company_memberships` permite que um
   * usuário leia suas próprias linhas via `app.current_user_id` — ver
   * migration `company_memberships_self_lookup`.
   */
  async withUser<T>(
    userId: string,
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(
        `SELECT set_config('app.current_user_id', $1, true)`,
        userId,
      );
      return fn(tx);
    });
  }

  /**
   * Terceiro modo de acesso a dados: PÚBLICO (Track B, TD15,
   * docs/technical/20-sprint-02-tech-readiness.md §16). Nem tenant, nem
   * usuário autenticado — a rota que chama isto não tem `req.user` nem
   * `company_id` nenhum.
   *
   * `SET LOCAL ROLE braco_public` troca o privilégio efetivo da conexão,
   * só dentro desta transação, para exatamente os privilégios da role
   * `braco_public` (GRANT SELECT em employee_types, GRANT INSERT em
   * leads — nada além disso, `prisma/bootstrap/public-role.sql` +
   * migration `sprint02_track_b_public_leads`). Isso não é "confiar que o
   * código só vai fazer a query certa": é o próprio Postgres recusando
   * qualquer outra tabela, mesmo que um bug de aplicação tentasse ler
   * `companies` ou `digital_employees` a partir daqui.
   *
   * A role de aplicação (`braco`, dona das tabelas) precisa ser membro de
   * `braco_public` para o `SET ROLE` funcionar — ver bootstrap. `SET
   * LOCAL` é revertido automaticamente ao fim da transação.
   */
  async withPublicAccess<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL ROLE braco_public`);
      return fn(tx);
    });
  }

  /**
   * Quarto modo de acesso: resolução de tenant a partir de um `accountId`
   * do Zernio (issue #30). Um webhook chega sem `company_id` nenhum — só
   * um identificador externo — e mapear "qual empresa é dona deste
   * accountId" É a consulta que precisa acontecer antes de qualquer
   * `withTenant`. Mesmo padrão de `withUser` (login: resolve a partir de
   * `app.current_user_id`), com sua própria policy aditiva em
   * `zernio_connections` (migration `zernio_whatsapp_integration`) — nunca
   * um bypass geral de RLS, só libera a linha cujo `account_id` bate
   * exatamente com o valor setado nesta transação.
   */
  async withZernioAccountLookup<T>(
    accountId: string,
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(
        `SELECT set_config('app.current_zernio_lookup_account_id', $1, true)`,
        accountId,
      );
      return fn(tx);
    });
  }

  /**
   * Mesma ideia de `withZernioAccountLookup`, para o callback público do
   * onboarding: localiza a `ZernioOnboardingAttempt` pelo seu próprio
   * `id` (o `correlationId` de uso único) antes de saber a que empresa
   * ela pertence.
   */
  async withZernioAttemptLookup<T>(
    attemptId: string,
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(
        `SELECT set_config('app.current_zernio_lookup_attempt_id', $1, true)`,
        attemptId,
      );
      return fn(tx);
    });
  }
}
