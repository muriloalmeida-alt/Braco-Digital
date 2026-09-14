-- CreateEnum
CREATE TYPE "GoogleConnectionStatus" AS ENUM ('NOT_CONNECTED', 'CONNECTING', 'CONNECTED', 'DEGRADED', 'DISCONNECTED', 'FAILED');

-- CreateTable
CREATE TABLE "google_connections" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "status" "GoogleConnectionStatus" NOT NULL DEFAULT 'NOT_CONNECTED',
    "google_account_email" TEXT,
    "access_token_encrypted" TEXT,
    "refresh_token_encrypted" TEXT,
    "token_expires_at" TIMESTAMP(3),
    "granted_scopes" TEXT[],
    "calendar_id" TEXT,
    "calendar_summary" TEXT,
    "task_list_id" TEXT,
    "connected_at" TIMESTAMP(3),
    "disconnected_at" TIMESTAMP(3),
    "last_refresh_at" TIMESTAMP(3),
    "failure_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "google_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "google_oauth_attempts" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "initiated_by_user_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "consumed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "google_oauth_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "google_connections_company_id_key" ON "google_connections"("company_id");

-- CreateIndex
CREATE INDEX "google_oauth_attempts_company_id_idx" ON "google_oauth_attempts"("company_id");

-- AddForeignKey
ALTER TABLE "google_connections" ADD CONSTRAINT "google_connections_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "google_oauth_attempts" ADD CONSTRAINT "google_oauth_attempts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "google_oauth_attempts" ADD CONSTRAINT "google_oauth_attempts_initiated_by_user_id_fkey" FOREIGN KEY ("initiated_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- BRAÇO — Row-Level Security para as tabelas do Google (issue #31).
-- Mesmo padrão de docs/technical/04-multi-tenancy.md e da migration
-- `enable_row_level_security`: fail-closed por padrão (sem
-- app.current_company_id setado, nenhuma linha é lida/gravada); FORCE
-- garante que vale até para a role dona das tabelas.
ALTER TABLE "google_connections" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "google_connections" FORCE ROW LEVEL SECURITY;
-- `google_connections` é sempre acessada via `withTenant` com o
-- `companyId` já conhecido (rotas gerenciais autenticadas, ou já
-- resolvido a partir de `GoogleOAuthAttempt` durante o callback) — nunca
-- precisa de uma policy de lookup por identificador externo (diferente
-- do webhook do Zernio, o Google não entrega nada sem `state`
-- correlacionado primeiro). Policy padrão de tenant, sem branch aditivo.
CREATE POLICY tenant_isolation ON "google_connections"
  USING (company_id = current_setting('app.current_company_id', true));

ALTER TABLE "google_oauth_attempts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "google_oauth_attempts" FORCE ROW LEVEL SECURITY;
-- Mesmo padrão aditivo de `zernio_onboarding_attempts`: o callback OAuth
-- (rota pública, sem JWT/tenant) só tem o `state` — o `id` desta própria
-- tentativa, criado por nós antes de redirecionar ao Google e embutido no
-- parâmetro `state` — precisa localizar essa linha antes de saber a que
-- empresa ela pertence, para então continuar sob `withTenant`
-- normalmente. `id` é um UUID não adivinhável, e a policy só libera a
-- linha cujo `id` bate exatamente.
CREATE POLICY tenant_isolation ON "google_oauth_attempts"
  USING (
    company_id = current_setting('app.current_company_id', true)
    OR id = current_setting('app.current_google_lookup_attempt_id', true)
  );
