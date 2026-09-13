-- CreateEnum
CREATE TYPE "ZernioConnectionStatus" AS ENUM ('NOT_CONNECTED', 'CONNECTING', 'CONNECTED', 'DEGRADED', 'DISCONNECTED', 'FAILED');

-- CreateEnum
CREATE TYPE "ZernioMessageDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "ZernioMessageStatus" AS ENUM ('RECEIVED', 'SENT', 'DELIVERED', 'READ', 'FAILED');

-- CreateTable
CREATE TABLE "zernio_connections" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "profile_id" TEXT,
    "account_id" TEXT,
    "phone_number" TEXT,
    "display_name" TEXT,
    "status" "ZernioConnectionStatus" NOT NULL DEFAULT 'NOT_CONNECTED',
    "provider_status" TEXT,
    "quality_rating" TEXT,
    "name_status" TEXT,
    "waba_verification_status" TEXT,
    "last_health_check_at" TIMESTAMP(3),
    "last_webhook_at" TIMESTAMP(3),
    "connected_at" TIMESTAMP(3),
    "disconnected_at" TIMESTAMP(3),
    "failure_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "zernio_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zernio_onboarding_attempts" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "initiated_by_user_id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "consumed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "zernio_onboarding_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zernio_webhook_events" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "company_id" TEXT,
    "payload" JSONB NOT NULL,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),
    "processing_error" TEXT,

    CONSTRAINT "zernio_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zernio_messages" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "direction" "ZernioMessageDirection" NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "platform_message_id" TEXT NOT NULL,
    "text" TEXT,
    "status" "ZernioMessageStatus" NOT NULL,
    "sender_identity" TEXT,
    "standby" BOOLEAN NOT NULL DEFAULT false,
    "idempotency_key" TEXT,
    "failure_reason" TEXT,
    "sent_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "zernio_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "zernio_connections_company_id_key" ON "zernio_connections"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "zernio_connections_profile_id_key" ON "zernio_connections"("profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "zernio_connections_account_id_key" ON "zernio_connections"("account_id");

-- CreateIndex
CREATE INDEX "zernio_onboarding_attempts_company_id_idx" ON "zernio_onboarding_attempts"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "zernio_webhook_events_event_id_key" ON "zernio_webhook_events"("event_id");

-- CreateIndex
CREATE INDEX "zernio_webhook_events_company_id_idx" ON "zernio_webhook_events"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "zernio_messages_platform_message_id_key" ON "zernio_messages"("platform_message_id");

-- CreateIndex
CREATE INDEX "zernio_messages_company_id_conversation_id_idx" ON "zernio_messages"("company_id", "conversation_id");

-- AddForeignKey
ALTER TABLE "zernio_connections" ADD CONSTRAINT "zernio_connections_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zernio_onboarding_attempts" ADD CONSTRAINT "zernio_onboarding_attempts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zernio_onboarding_attempts" ADD CONSTRAINT "zernio_onboarding_attempts_initiated_by_user_id_fkey" FOREIGN KEY ("initiated_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zernio_webhook_events" ADD CONSTRAINT "zernio_webhook_events_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zernio_messages" ADD CONSTRAINT "zernio_messages_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- BRAÇO — Row-Level Security para as tabelas do Zernio (issue #30).
-- Mesmo padrão de docs/technical/04-multi-tenancy.md e da migration
-- `enable_row_level_security`: fail-closed por padrão (sem
-- app.current_company_id setado, nenhuma linha é lida/gravada); FORCE
-- garante que vale até para a role dona das tabelas.
ALTER TABLE "zernio_connections" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "zernio_connections" FORCE ROW LEVEL SECURITY;
-- Policy aditiva (mesmo padrão de `company_memberships_self_lookup`):
-- o webhook do Zernio chega sem tenant conhecido — só um `accountId`.
-- `app.current_zernio_lookup_account_id` é setado por
-- `PrismaService.withZernioAccountLookup` só para essa consulta pontual
-- de "qual empresa é dona deste accountId", nunca para leitura/escrita
-- de qualquer outra coisa. Não é um bypass geral: a policy só libera a
-- linha cujo account_id bate exatamente com o valor setado.
CREATE POLICY tenant_isolation ON "zernio_connections"
  USING (
    company_id = current_setting('app.current_company_id', true)
    OR account_id = current_setting('app.current_zernio_lookup_account_id', true)
  );

ALTER TABLE "zernio_onboarding_attempts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "zernio_onboarding_attempts" FORCE ROW LEVEL SECURITY;
-- Mesmo padrão aditivo de zernio_connections acima: o callback (rota
-- pública, sem JWT/tenant) só tem o `id` da própria tentativa (o
-- `correlationId` que nós geramos e embutimos no redirect_url antes de
-- mandar o usuário para o Zernio) — precisa localizar essa linha antes
-- de saber a que empresa ela pertence, para então continuar sob
-- `withTenant` normalmente. `id` é um UUID não adivinhável, e a policy
-- só libera a linha cujo `id` bate exatamente.
CREATE POLICY tenant_isolation ON "zernio_onboarding_attempts"
  USING (
    company_id = current_setting('app.current_company_id', true)
    OR id = current_setting('app.current_zernio_lookup_attempt_id', true)
  );

ALTER TABLE "zernio_webhook_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "zernio_webhook_events" FORCE ROW LEVEL SECURITY;
-- `company_id` é nulo para eventos órfãos (accountId desconhecido no
-- momento do recebimento) — gravados/lidos SEM `withTenant` (nenhum
-- tenant é conhecido ainda), então a policy precisa liberar
-- explicitamente `company_id IS NULL`, ou a própria inserção do evento
-- órfão seria rejeitada pelo RLS (WITH CHECK usa a mesma expressão).
-- Isso não vaza dado entre tenants: uma linha órfã não pertence a
-- nenhuma empresa por definição, não a uma empresa específica que outra
-- sessão pudesse estar tentando ler.
CREATE POLICY tenant_isolation ON "zernio_webhook_events"
  USING (
    company_id = current_setting('app.current_company_id', true)
    OR company_id IS NULL
  );

ALTER TABLE "zernio_messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "zernio_messages" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "zernio_messages"
  USING (company_id = current_setting('app.current_company_id', true));

-- Marcador de plataforma (sem company_id, sem RLS — mesmo padrão de
-- `employee_types`, catálogo global): a assinatura de webhook do Zernio é
-- uma por conta Zernio inteira, não por empresa cliente.
CREATE TABLE "zernio_webhook_registrations" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "url" TEXT NOT NULL,
    "events_hash" TEXT NOT NULL,
    "registered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "zernio_webhook_registrations_pkey" PRIMARY KEY ("id")
);
