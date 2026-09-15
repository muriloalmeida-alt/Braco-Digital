/**
 * Lógica central do bootstrap idempotente da role pública (issue #46 —
 * Robustez de deploy). Separada do CLI (`scripts/ensure-public-role.ts`)
 * para ser testável diretamente contra um `PrismaClient` apontando para
 * qualquer Postgres (incluindo clusters efêmeros de teste,
 * `test/helpers/ephemeral-postgres.ts`) sem depender de `process.env`
 * nem de `process.exit`.
 *
 * Nunca usa `CURRENT_USER` cegamente como destino do `GRANT`: existem
 * dois modos legítimos —
 * - **self-bootstrap**: o próprio usuário conectado (`DATABASE_URL`) é
 *   também o usuário real da aplicação e tem privilégio suficiente (ex.:
 *   o Postgres do plugin do Railway, que historicamente entrega uma
 *   única role ampla para tudo). `appDatabaseRole` fica `undefined` e o
 *   destino da membership é o próprio `current_user`.
 * - **bootstrap administrativo**: um admin/superuser roda o script à
 *   parte da role de aplicação normal — `current_user` aqui é o admin,
 *   NUNCA o alvo da membership. `appDatabaseRole` precisa ser passado
 *   explicitamente (contrato: variável de ambiente `APP_DATABASE_ROLE`
 *   no CLI).
 *
 * Nunca dá `CREATEROLE` a ninguém, nunca concede privilégio além da
 * membership em `braco_public`, nunca cria a role dentro de uma
 * migration do Prisma. Se o usuário conectado não tiver privilégio
 * suficiente para `CREATE ROLE`/`GRANT`, falha alto e claro — nunca um
 * workaround inseguro, nunca um fallback silencioso — apontando para
 * `prisma/bootstrap/public-role.sql` como alternativa manual.
 */
import type { PrismaClient } from '@prisma/client';

export const PUBLIC_ROLE_NAME = 'braco_public';

export type EnsurePublicRoleOutcome =
  | 'already_satisfied' // braco_public já existia e a role de app já era membro (Caso 1)
  | 'membership_granted' // braco_public já existia, faltava só a membership (Caso 2)
  | 'role_created_and_granted'; // braco_public não existia, foi criada e a membership concedida (Caso 3)

export interface EnsurePublicRoleResult {
  outcome: EnsurePublicRoleOutcome;
  targetRole: string;
  targetRoleSource: 'app_database_role_env' | 'self_bootstrap';
}

/**
 * Erro operacional claro (Caso 4, ou falha parcial do Caso 2) — nunca
 * uma exceção genérica do Postgres repassada sem contexto. `cause`
 * preserva o erro original para quem quiser investigar mais fundo, sem
 * poluir a mensagem principal com detalhe interno do driver.
 */
export class EnsurePublicRoleError extends Error {
  /** Erro original do Postgres/Prisma, preservado sem poluir a mensagem principal. */
  public readonly cause?: unknown;

  constructor(
    message: string,
    public readonly reason: 'insufficient_privilege_create_role' | 'insufficient_privilege_grant' | 'inconsistent_final_state',
    options?: { cause?: unknown },
  ) {
    super(message);
    this.name = 'EnsurePublicRoleError';
    this.cause = options?.cause;
  }
}

const MANUAL_FALLBACK_HINT = 'Rode apps/api/prisma/bootstrap/public-role.sql manualmente, conectado como um administrador/superusuário do Postgres.';

function quoteIdent(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

function isInsufficientPrivilege(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return /permission denied|must have|insufficient privilege/i.test(message);
}

async function currentUser(prisma: PrismaClient): Promise<string> {
  const rows = await prisma.$queryRawUnsafe<{ current_user: string }[]>('SELECT current_user');
  return rows[0].current_user;
}

async function publicRoleExists(prisma: PrismaClient): Promise<boolean> {
  const rows = await prisma.$queryRawUnsafe<{ exists: boolean }[]>(
    'SELECT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = $1) AS exists',
    PUBLIC_ROLE_NAME,
  );
  return rows[0].exists;
}

async function publicRoleCanLogin(prisma: PrismaClient): Promise<boolean | null> {
  const rows = await prisma.$queryRawUnsafe<{ rolcanlogin: boolean }[]>('SELECT rolcanlogin FROM pg_roles WHERE rolname = $1', PUBLIC_ROLE_NAME);
  return rows[0]?.rolcanlogin ?? null;
}

async function hasMembership(prisma: PrismaClient, targetRole: string): Promise<boolean> {
  const rows = await prisma.$queryRawUnsafe<{ exists: boolean }[]>(
    `SELECT EXISTS (
       SELECT 1 FROM pg_auth_members m
       JOIN pg_roles r ON r.oid = m.roleid
       JOIN pg_roles u ON u.oid = m.member
       WHERE r.rolname = $1 AND u.rolname = $2
     ) AS exists`,
    PUBLIC_ROLE_NAME,
    targetRole,
  );
  return rows[0].exists;
}

export async function ensurePublicRole(prisma: PrismaClient, opts: { appDatabaseRole?: string } = {}): Promise<EnsurePublicRoleResult> {
  const targetRole = opts.appDatabaseRole?.trim() || (await currentUser(prisma));
  const targetRoleSource: EnsurePublicRoleResult['targetRoleSource'] = opts.appDatabaseRole?.trim() ? 'app_database_role_env' : 'self_bootstrap';

  const existedBefore = await publicRoleExists(prisma);
  let roleWasCreatedNow = false;
  if (!existedBefore) {
    try {
      await prisma.$executeRawUnsafe(`CREATE ROLE ${quoteIdent(PUBLIC_ROLE_NAME)} NOLOGIN`);
    } catch (err) {
      if (isInsufficientPrivilege(err)) {
        throw new EnsurePublicRoleError(
          `Não foi possível criar a role "${PUBLIC_ROLE_NAME}": o usuário conectado ("${await currentUser(prisma).catch(() => '?')}") ` +
            `não tem privilégio CREATEROLE/superusuário neste ambiente. ${MANUAL_FALLBACK_HINT}`,
          'insufficient_privilege_create_role',
          { cause: err },
        );
      }
      throw err;
    }
    roleWasCreatedNow = true; // criada com sucesso — segue para o passo de membership abaixo
  }

  const alreadyMember = await hasMembership(prisma, targetRole);
  let outcome: EnsurePublicRoleOutcome;

  if (alreadyMember) {
    // Só chega aqui com `alreadyMember === true` se a role já existia
    // ANTES desta chamada (uma role recém-criada nunca tem membership
    // ainda) — Caso 1, nada para fazer.
    outcome = 'already_satisfied';
  } else {
    try {
      await prisma.$executeRawUnsafe(`GRANT ${quoteIdent(PUBLIC_ROLE_NAME)} TO ${quoteIdent(targetRole)}`);
    } catch (err) {
      if (isInsufficientPrivilege(err)) {
        throw new EnsurePublicRoleError(
          `"${PUBLIC_ROLE_NAME}" existe, mas o usuário conectado não tem privilégio para conceder membership a "${targetRole}". ${MANUAL_FALLBACK_HINT} ` +
            `(comando equivalente: GRANT ${PUBLIC_ROLE_NAME} TO ${quoteIdent(targetRole)};)`,
          'insufficient_privilege_grant',
          { cause: err },
        );
      }
      throw err;
    }
    outcome = roleWasCreatedNow ? 'role_created_and_granted' : 'membership_granted';
  }

  // Validação final — nunca reporta sucesso sem reconferir o estado real.
  const [finalExists, finalCanLogin, finalMember] = await Promise.all([publicRoleExists(prisma), publicRoleCanLogin(prisma), hasMembership(prisma, targetRole)]);
  if (!finalExists || finalCanLogin !== false || !finalMember) {
    throw new EnsurePublicRoleError(
      `Validação final inconsistente: exists=${finalExists} rolcanlogin=${finalCanLogin} membership("${targetRole}")=${finalMember}. ` +
        'Estado inesperado — investigar manualmente antes de prosseguir com o deploy.',
      'inconsistent_final_state',
    );
  }

  return { outcome, targetRole, targetRoleSource };
}
