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
}
