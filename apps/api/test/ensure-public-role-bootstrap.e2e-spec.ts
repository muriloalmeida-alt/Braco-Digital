import { PrismaClient } from '@prisma/client';
import { ensurePublicRole, EnsurePublicRoleError, PUBLIC_ROLE_NAME } from '../scripts/lib/ensure-public-role-core';
import { resolvePgBinaries, startEphemeralCluster, type EphemeralCluster } from './helpers/ephemeral-postgres';

/**
 * Issue #46 — Robustez de deploy, Parte 3. Cobre os 4 cenários exigidos
 * pela issue, cada um contra um cluster Postgres efêmero e descartável
 * (nunca o banco de desenvolvimento compartilhado, nunca um mock —
 * permissão/role é comportamento real do servidor, não algo que faça
 * sentido simular).
 */

let pgAvailable = true;
try {
  resolvePgBinaries();
} catch {
  pgAvailable = false;
  // eslint-disable-next-line no-console
  console.warn('[ensure-public-role-bootstrap] initdb/pg_ctl não encontrados — suíte pulada (ver test/helpers/ephemeral-postgres.ts).');
}
const maybeDescribe = pgAvailable ? describe : describe.skip;

maybeDescribe('db:ensure-public-role — bootstrap (issue #46)', () => {
  let cluster: EphemeralCluster;
  let admin: PrismaClient;

  beforeEach(() => {
    cluster = startEphemeralCluster();
    admin = new PrismaClient({ datasources: { db: { url: cluster.adminUrl() } } });
  });

  afterEach(async () => {
    await admin.$disconnect();
    cluster.stop();
  });

  async function roleInfo(name: string): Promise<{ exists: boolean; canLogin: boolean | null; canCreateRole: boolean | null; isSuper: boolean | null }> {
    const rows = await admin.$queryRawUnsafe<{ rolcanlogin: boolean; rolcreaterole: boolean; rolsuper: boolean }[]>(
      'SELECT rolcanlogin, rolcreaterole, rolsuper FROM pg_roles WHERE rolname = $1',
      name,
    );
    if (rows.length === 0) return { exists: false, canLogin: null, canCreateRole: null, isSuper: null };
    return { exists: true, canLogin: rows[0].rolcanlogin, canCreateRole: rows[0].rolcreaterole, isSuper: rows[0].rolsuper };
  }

  async function isMember(role: string, of: string): Promise<boolean> {
    const rows = await admin.$queryRawUnsafe<{ exists: boolean }[]>(
      `SELECT EXISTS (
         SELECT 1 FROM pg_auth_members m
         JOIN pg_roles r ON r.oid = m.roleid
         JOIN pg_roles u ON u.oid = m.member
         WHERE r.rolname = $1 AND u.rolname = $2
       ) AS exists`,
      of,
      role,
    );
    return rows[0].exists;
  }

  it('Cenário A — banco novo, braco_public inexistente, usuário com privilégio suficiente: cria, NOLOGIN, concede, e a segunda execução é no-op', async () => {
    expect((await roleInfo(PUBLIC_ROLE_NAME)).exists).toBe(false);

    const first = await ensurePublicRole(admin, {});
    expect(first.outcome).toBe('role_created_and_granted');
    expect(first.targetRole).toBe('postgres'); // self-bootstrap: sem APP_DATABASE_ROLE, alvo é o próprio conectado

    const info = await roleInfo(PUBLIC_ROLE_NAME);
    expect(info.exists).toBe(true);
    expect(info.canLogin).toBe(false);
    expect(await isMember('postgres', PUBLIC_ROLE_NAME)).toBe(true);

    const second = await ensurePublicRole(admin, {});
    expect(second.outcome).toBe('already_satisfied');
  });

  it('Cenário B — role já existe (com membership já concedida): não falha, não recria, mantém as propriedades corretas', async () => {
    await admin.$executeRawUnsafe(`CREATE ROLE ${PUBLIC_ROLE_NAME} NOLOGIN`);
    await admin.$executeRawUnsafe(`GRANT ${PUBLIC_ROLE_NAME} TO postgres`);

    const result = await ensurePublicRole(admin, {});
    expect(result.outcome).toBe('already_satisfied');

    const info = await roleInfo(PUBLIC_ROLE_NAME);
    expect(info.canLogin).toBe(false); // propriedade preservada, não sobrescrita
  });

  it('Cenário C — usuário sem CREATEROLE: falha clara, nenhum fallback silencioso, nenhum privilégio adicional concedido', async () => {
    await admin.$executeRawUnsafe(`CREATE ROLE restricted_app LOGIN NOCREATEROLE NOSUPERUSER`);
    const restricted = new PrismaClient({ datasources: { db: { url: cluster.adminUrl().replace('postgres@', 'restricted_app@') } } });

    try {
      await expect(ensurePublicRole(restricted, {})).rejects.toMatchObject({
        reason: 'insufficient_privilege_create_role',
      } satisfies Partial<EnsurePublicRoleError>);

      // Nenhum efeito colateral: braco_public continua não existindo.
      expect((await roleInfo(PUBLIC_ROLE_NAME)).exists).toBe(false);
    } finally {
      await restricted.$disconnect();
    }
  });

  it('Cenário D — admin executando bootstrap para outra role de aplicação: membership vai para a role explícita, nunca para CURRENT_USER', async () => {
    await admin.$executeRawUnsafe(`CREATE ROLE app_role LOGIN`);

    const result = await ensurePublicRole(admin, { appDatabaseRole: 'app_role' });
    expect(result.outcome).toBe('role_created_and_granted');
    expect(result.targetRole).toBe('app_role');
    expect(result.targetRoleSource).toBe('app_database_role_env');

    expect(await isMember('app_role', PUBLIC_ROLE_NAME)).toBe(true);
    // O admin (current_user real da conexão) nunca devia ganhar membership por isso.
    expect(await isMember('postgres', PUBLIC_ROLE_NAME)).toBe(false);
  });
});
