-- CreateEnum
CREATE TYPE "TeamSizeRange" AS ENUM ('SO_EU', 'DE_2_A_5', 'DE_6_A_20', 'DE_21_A_50', 'MAIS_DE_50');

-- CreateEnum
CREATE TYPE "DiagnosticVolumeRange" AS ENUM ('ATE_10', 'DE_11_A_30', 'DE_31_A_100', 'MAIS_DE_100', 'NAO_SEI_DIZER');

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "email" TEXT,
    "segment" TEXT NOT NULL,
    "team_size" "TeamSizeRange" NOT NULL,
    "needs" TEXT[],
    "priority" TEXT NOT NULL,
    "volume" "DiagnosticVolumeRange" NOT NULL,
    "ranking" JSONB NOT NULL,
    "rule_version" TEXT NOT NULL,
    "is_synthetic" BOOLEAN NOT NULL DEFAULT true,
    "source" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- BRAÇO — Terceiro modo de acesso a dados: PÚBLICO (TD15,
-- docs/technical/20-sprint-02-tech-readiness.md §16).
--
-- Track B é o primeiro fluxo público e sem autenticação com escrita de
-- dados. Em vez de confiar só na validação da camada de aplicação, a
-- conexão usada pelo caminho público roda sob uma role de banco dedicada
-- (`braco_public`), com o menor privilégio estritamente necessário:
-- SELECT em "employee_types" (catálogo público) e INSERT em "leads" —
-- nenhuma outra tabela é alcançável por essa role, nem em teoria. Mesmo
-- um bug de autorização na camada de aplicação não abriria acesso a
-- dado de tenant, porque a checagem de privilégio do Postgres acontece
-- antes de qualquer policy de RLS.
--
-- `braco_public` é NOLOGIN — nunca autentica sozinha pela rede. Ela só é
-- alcançada via `SET LOCAL ROLE braco_public` dentro de uma transação já
-- aberta pela role de aplicação (`PrismaService.withPublicAccess`, ver
-- prisma.service.ts), que precisa ser membro dela para isso funcionar.
--
-- IMPORTANTE — CREATE ROLE e GRANT de membership NÃO estão nesta
-- migração de propósito: a role que roda as migrações do Prisma
-- (`braco` em dev, o usuário de app do Postgres gerenciado em
-- staging/produção) normalmente não tem o atributo CREATEROLE — e não
-- deveria precisar ter, por princípio de menor privilégio. Criar a role
-- e conceder membership é um passo único de bootstrap de infraestrutura,
-- executado uma vez por ambiente por um superusuário/administrador do
-- Postgres, em `prisma/bootstrap/public-role.sql`. Esta migração só faz
-- a parte que o dono das tabelas (`braco`) já tem permissão de fazer
-- sozinho: conceder privilégios em objetos que ele possui a uma role
-- que já precisa existir previamente.
GRANT USAGE ON SCHEMA public TO braco_public;
GRANT SELECT ON "employee_types" TO braco_public;
GRANT INSERT ON "leads" TO braco_public;

-- ENABLE (sem FORCE) ROW LEVEL SECURITY em "leads" com uma única policy
-- de INSERT, restrita à role "braco_public": mesmo que uma GRANT futura
-- conceda SELECT/UPDATE/DELETE a essa role por engano, nenhuma linha
-- seria retornada ou alterada, porque não existe policy nenhuma para
-- esses comandos. Deliberadamente sem FORCE — ao contrário das tabelas
-- de tenant (`enable_row_level_security`), aqui o risco a mitigar é
-- "braco_public lendo/escrevendo fora de leads", não "a role de
-- aplicação (dona da tabela) ignorando isolamento" — a própria role de
-- aplicação continua com acesso irrestrito a "leads" para uso
-- administrativo/testes, como já é o padrão do Postgres para o dono de
-- uma tabela sem FORCE.
ALTER TABLE "leads" ENABLE ROW LEVEL SECURITY;
CREATE POLICY leads_public_insert_only ON "leads"
  FOR INSERT TO braco_public
  WITH CHECK (true);
