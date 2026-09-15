/**
 * Helper de teste (issue #46 — Robustez de deploy): sobe/derruba um
 * cluster PostgreSQL efêmero, totalmente isolado do banco de
 * desenvolvimento (`braco_dev`) usado pelo resto da suíte e2e. Usado
 * pelos testes de `db:ensure-public-role` (Parte 3) e de provisionamento
 * do zero (Parte 4), que precisam criar/remover roles no nível do
 * cluster — algo que nunca deve ser feito contra um banco compartilhado.
 *
 * Requer os binários `initdb`/`pg_ctl` do PostgreSQL instalados
 * localmente (mesmo requisito de infraestrutura que o resto da suíte
 * e2e já tem para "Postgres real"). Resolvidos via `PATH` primeiro, com
 * fallback para o layout padrão do Debian/Ubuntu
 * (algo como /usr/lib/postgresql/VERSAO/bin). Se nenhum dos dois for
 * encontrado, `resolvePgBinaries()` lança — os specs que dependem
 * disto usam `describe.skip`/aviso explícito no console, nunca
 * reportam sucesso silencioso.
 */
import { execFileSync, execSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export interface PgBinaries {
  initdb: string;
  pgCtl: string;
}

function which(bin: string): string | null {
  try {
    return execSync(`which ${bin}`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() || null;
  } catch {
    return null;
  }
}

export function resolvePgBinaries(): PgBinaries {
  const fromPath = { initdb: which('initdb'), pgCtl: which('pg_ctl') };
  if (fromPath.initdb && fromPath.pgCtl) {
    return { initdb: fromPath.initdb, pgCtl: fromPath.pgCtl };
  }

  // Layout padrão do pacote `postgresql-*` no Debian/Ubuntu — não fica
  // no PATH por padrão porque o sistema pode ter várias versões
  // instaladas lado a lado.
  try {
    const versions = execSync('ls /usr/lib/postgresql 2>/dev/null').toString().trim().split('\n').filter(Boolean);
    for (const v of versions.sort().reverse()) {
      const dir = `/usr/lib/postgresql/${v}/bin`;
      if (existsSync(join(dir, 'initdb')) && existsSync(join(dir, 'pg_ctl'))) {
        return { initdb: join(dir, 'initdb'), pgCtl: join(dir, 'pg_ctl') };
      }
    }
  } catch {
    // sem /usr/lib/postgresql — cai no erro abaixo
  }

  throw new Error(
    'initdb/pg_ctl não encontrados (nem no PATH, nem em /usr/lib/postgresql/*/bin). ' +
      'Testes que dependem de um cluster Postgres efêmero não podem rodar neste ambiente.',
  );
}

/**
 * Cria um comando de shell prefixado com `sudo -u postgres` quando o
 * processo atual roda como root (o Postgres recusa `initdb`/`pg_ctl`
 * como root, por segurança) — em ambientes onde o processo já roda
 * como um usuário comum, os binários são chamados diretamente.
 */
function asPostgresUser(cmd: string[]): string[] {
  return process.getuid?.() === 0 ? ['sudo', '-u', 'postgres', ...cmd] : cmd;
}

export interface EphemeralCluster {
  port: number;
  dataDir: string;
  /** URL de conexão como o usuário administrador (superusuário do cluster efêmero, sempre chamado "postgres"). */
  adminUrl: (database?: string) => string;
  stop: () => void;
}

let nextPort = 55432;

/**
 * Sobe um cluster novo, vazio, num diretório temporário descartável, com
 * autenticação `trust` (aceitável só porque o cluster escuta em
 * `127.0.0.1` numa porta efêmera local, existe só durante o teste, e é
 * destruído ao final — nunca um padrão para ambientes reais).
 */
function run(cmd: string[]): void {
  execFileSync(cmd[0], cmd.slice(1), { stdio: 'pipe' });
}

export function startEphemeralCluster(): EphemeralCluster {
  const bin = resolvePgBinaries();
  const dataDir = mkdtempSync(join(tmpdir(), 'braco-pg-test-'));
  const port = nextPort++;

  // `mkdtempSync` cria o diretório com o processo atual (root, neste
  // ambiente) como dono — `initdb` exige ser dono do diretório de dados
  // (ele mesmo aplica um `chmod 0700`), então precisa pertencer de fato
  // ao usuário `postgres` do sistema, não só ter permissão de entrada.
  if (process.getuid?.() === 0) run(['chown', 'postgres:postgres', dataDir]);

  run(asPostgresUser([bin.initdb, '-D', dataDir, '-U', 'postgres', '--auth=trust']));
  run(asPostgresUser([bin.pgCtl, '-D', dataDir, '-o', `-p ${port} -k /tmp`, '-l', join(dataDir, 'server.log'), 'start']));

  // Pequena espera para o socket ficar pronto — `pg_ctl start` já
  // aguarda o "ready to accept connections", mas uma margem extra evita
  // flakiness em máquinas mais lentas.
  execSync('sleep 1');

  return {
    port,
    dataDir,
    adminUrl: (database = 'postgres') => `postgresql://postgres@127.0.0.1:${port}/${database}`,
    stop: () => {
      try {
        run(asPostgresUser([bin.pgCtl, '-D', dataDir, 'stop']));
      } finally {
        rmSync(dataDir, { recursive: true, force: true });
      }
    },
  };
}
