import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { ensurePublicRole, PUBLIC_ROLE_NAME } from '../scripts/lib/ensure-public-role-core';
import { resolvePgBinaries, startEphemeralCluster, type EphemeralCluster } from './helpers/ephemeral-postgres';

/**
 * Issue #46 — Robustez de deploy, Parte 4 ("critério de aceite
 * central"): prova que um engenheiro consegue provisionar um ambiente
 * novo lendo só o que existe em `main`, sem conhecimento histórico do
 * incidente e sem SQL ad-hoc — bootstrap da role pública + `prisma
 * migrate deploy` de verdade (não um mock), do zero, num cluster
 * Postgres efêmero e descartável.
 */

const API_ROOT = join(__dirname, '..');

let pgAvailable = true;
try {
  resolvePgBinaries();
} catch {
  pgAvailable = false;
  // eslint-disable-next-line no-console
  console.warn('[provisioning-from-scratch] initdb/pg_ctl não encontrados — suíte pulada (ver test/helpers/ephemeral-postgres.ts).');
}
const maybeIt = pgAvailable ? it : it.skip;

describe('Provisionamento de ambiente do zero (issue #46, Parte 4)', () => {
  let cluster: EphemeralCluster;

  afterEach(() => {
    cluster?.stop();
  });

  maybeIt(
    'bootstrap da role pública + prisma migrate deploy do zero, sem SQL ad-hoc, produz um ambiente correto e validável',
    async () => {
      cluster = startEphemeralCluster();
      const databaseUrl = cluster.adminUrl('braco_provisioning_test');

      const admin = new PrismaClient({ datasources: { db: { url: cluster.adminUrl() } } });
      await admin.$executeRawUnsafe('CREATE DATABASE braco_provisioning_test');
      await admin.$disconnect();

      const dbClient = new PrismaClient({ datasources: { db: { url: databaseUrl } } });

      try {
        // 1. Bootstrap da role pública — exatamente o comando que
        // `npm run db:ensure-public-role` roda em produção, chamado
        // aqui como função (o CLI em si é só um wrapper fino em cima
        // desta mesma lógica).
        const bootstrap = await ensurePublicRole(dbClient, {});
        expect(bootstrap.outcome).toBe('role_created_and_granted');

        // 2. `prisma migrate deploy` de verdade — nenhum atalho, nenhuma
        // migration pulada, contra um banco que nunca viu nenhuma delas.
        execFileSync('npx', ['prisma', 'migrate', 'deploy'], {
          cwd: API_ROOT,
          env: { ...process.env, DATABASE_URL: databaseUrl },
          stdio: 'pipe',
        });

        // 3. Validar todas as migrations aplicadas.
        const migrations = await dbClient.$queryRawUnsafe<{ migration_name: string; finished_at: Date | null }[]>(
          'SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY started_at',
        );
        expect(migrations.length).toBeGreaterThanOrEqual(9);
        expect(migrations.every((m) => m.finished_at !== null)).toBe(true);

        // 4. Validar braco_public NOLOGIN.
        const roleRows = await dbClient.$queryRawUnsafe<{ rolcanlogin: boolean }[]>('SELECT rolcanlogin FROM pg_roles WHERE rolname = $1', PUBLIC_ROLE_NAME);
        expect(roleRows[0]?.rolcanlogin).toBe(false);

        // 5. Validar os grants esperados — só o que a migration concede,
        // nada além.
        const grantChecks = await dbClient.$queryRawUnsafe<{ can_select_employee_types: boolean; can_insert_leads: boolean; can_select_leads: boolean; can_select_companies: boolean }[]>(
          `SELECT
             has_table_privilege('${PUBLIC_ROLE_NAME}', 'employee_types', 'SELECT') AS can_select_employee_types,
             has_table_privilege('${PUBLIC_ROLE_NAME}', 'leads', 'INSERT') AS can_insert_leads,
             has_table_privilege('${PUBLIC_ROLE_NAME}', 'leads', 'SELECT') AS can_select_leads,
             has_table_privilege('${PUBLIC_ROLE_NAME}', 'companies', 'SELECT') AS can_select_companies`,
        );
        expect(grantChecks[0].can_select_employee_types).toBe(true);
        expect(grantChecks[0].can_insert_leads).toBe(true);
        // Privilégio de tabela concedido não é a mesma coisa que a RLS
        // permitir de fato — validado de forma negativa no passo 6.
        expect(grantChecks[0].can_select_companies).toBe(false); // nunca teve GRANT nenhum em companies

        // 6. RLS negativa — o mesmo padrão de `PrismaService.
        // withPublicAccess`: `SET LOCAL ROLE braco_public` dentro de uma
        // transação já aberta pela role de aplicação. Cada checagem usa
        // sua própria transação: uma vez que uma query falha, o
        // Postgres aborta o resto da transação corrente (não dá pra
        // encadear mais de um "espera falhar" na mesma).
        await dbClient.$transaction(async (tx) => {
          await tx.$executeRawUnsafe(`SET LOCAL ROLE ${PUBLIC_ROLE_NAME}`);
          // Consegue: SELECT em employee_types (mesmo sem linhas, não pode dar erro de permissão).
          await expect(tx.$queryRawUnsafe('SELECT 1 FROM "employee_types" LIMIT 1')).resolves.toBeDefined();
          // Consegue: INSERT em leads (grant de tabela + policy de INSERT).
          await expect(
            tx.$executeRawUnsafe(
              `INSERT INTO "leads" (id, name, company_name, whatsapp, segment, team_size, needs, priority, volume, ranking, rule_version, source)
               VALUES ('rls-test-1', 'Teste', 'Empresa Teste', '+5511999999999', 'outro', 'SO_EU', ARRAY[]::text[], 'x', 'ATE_10', '{}'::jsonb, 'v1', 'e2e-provisioning-test')`,
            ),
          ).resolves.toBeDefined();
        });

        // NUNCA consegue: SELECT em leads — nem GRANT de SELECT existe
        // (a migration só concede INSERT), e mesmo que existisse, a
        // policy de RLS só cobre INSERT (ver migration
        // 20260913173626_sprint02_track_b_public_leads).
        await dbClient.$transaction(async (tx) => {
          await tx.$executeRawUnsafe(`SET LOCAL ROLE ${PUBLIC_ROLE_NAME}`);
          await expect(tx.$queryRawUnsafe('SELECT * FROM "leads" WHERE id = \'rls-test-1\'')).rejects.toThrow(/permission denied/i);
        });

        // NUNCA consegue: qualquer acesso a dado de tenant (companies) — nem GRANT de tabela existe.
        await dbClient.$transaction(async (tx) => {
          await tx.$executeRawUnsafe(`SET LOCAL ROLE ${PUBLIC_ROLE_NAME}`);
          await expect(tx.$queryRawUnsafe('SELECT 1 FROM "companies" LIMIT 1')).rejects.toThrow(/permission denied/i);
        });
      } finally {
        await dbClient.$disconnect();
      }
    },
    60_000,
  );
});
