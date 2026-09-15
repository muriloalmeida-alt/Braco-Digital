/**
 * Bootstrap idempotente da role pública `braco_public` (issue #46 —
 * Robustez de deploy). Substitui a dependência de alguém lembrar de
 * rodar `prisma/bootstrap/public-role.sql` manualmente num ambiente
 * novo — quando o usuário do `DATABASE_URL` já tem privilégio
 * suficiente (caso do Postgres do plugin do Railway), este script
 * resolve tudo sozinho; quando não tem, falha claro apontando para o
 * bootstrap manual, nunca silenciosamente.
 *
 * Lógica testável em `scripts/lib/ensure-public-role-core.ts`
 * (`apps/api/test/ensure-public-role-bootstrap.e2e-spec.ts` cobre os 4
 * cenários exigidos pela issue). Este arquivo é só o wrapper de CLI:
 * lê `process.env`, chama a lógica, formata a saída, decide o exit
 * code — nunca imprime `DATABASE_URL`/segredo nenhum.
 *
 * Contrato de quem é a role de aplicação (issue #46, "Importante —
 * CURRENT_USER"):
 * - **Self-bootstrap** (default): sem `APP_DATABASE_ROLE` definida, o
 *   destino da membership é o próprio usuário conectado
 *   (`DATABASE_URL`) — válido quando esse usuário já É a role de
 *   aplicação e já tem privilégio suficiente (ex.: Railway).
 * - **Bootstrap administrativo**: com `APP_DATABASE_ROLE=<role>`
 *   definida, um admin/superuser roda isto à parte — a membership vai
 *   para `<role>`, nunca para quem está conectado.
 *
 * Uso:
 *   npm run db:ensure-public-role
 *   APP_DATABASE_ROLE=braco npm run db:ensure-public-role   # bootstrap administrativo
 */
import { PrismaClient } from '@prisma/client';
import { ensurePublicRole, EnsurePublicRoleError, PUBLIC_ROLE_NAME } from './lib/ensure-public-role-core';

async function main() {
  const appDatabaseRole = process.env.APP_DATABASE_ROLE?.trim();
  const prisma = new PrismaClient();
  try {
    const result = await ensurePublicRole(prisma, { appDatabaseRole });

    const sourceLabel = result.targetRoleSource === 'app_database_role_env' ? 'via APP_DATABASE_ROLE (bootstrap administrativo)' : 'self-bootstrap (mesmo usuário da conexão)';
    console.log(`[db:ensure-public-role] role de destino da membership: "${result.targetRole}" (${sourceLabel})`);

    switch (result.outcome) {
      case 'already_satisfied':
        console.log(`[db:ensure-public-role] "${PUBLIC_ROLE_NAME}" já existia e "${result.targetRole}" já era membro. Nada a fazer.`);
        break;
      case 'membership_granted':
        console.log(`[db:ensure-public-role] "${PUBLIC_ROLE_NAME}" já existia; membership concedida agora para "${result.targetRole}".`);
        break;
      case 'role_created_and_granted':
        console.log(`[db:ensure-public-role] "${PUBLIC_ROLE_NAME}" criada (NOLOGIN) e membership concedida para "${result.targetRole}".`);
        break;
    }
    console.log(`[db:ensure-public-role] OK — validado: role existe, NOLOGIN, "${result.targetRole}" é membro.`);
  } catch (err) {
    if (err instanceof EnsurePublicRoleError) {
      console.error(`[db:ensure-public-role] FALHA (${err.reason}): ${err.message}`);
      process.exitCode = 1;
      return;
    }
    throw err;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('[db:ensure-public-role] Erro inesperado:', err instanceof Error ? err.message : err);
  process.exit(1);
});
