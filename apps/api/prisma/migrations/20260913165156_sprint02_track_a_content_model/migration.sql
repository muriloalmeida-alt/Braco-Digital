-- CreateEnum
CREATE TYPE "ServiceMode" AS ENUM ('PRESENCIAL', 'ONLINE', 'AMBOS');

-- CreateEnum
CREATE TYPE "ProductServiceKind" AS ENUM ('PRODUTO', 'SERVICO');

-- CreateEnum
CREATE TYPE "PricingMode" AS ENUM ('FIXO', 'A_PARTIR_DE', 'SOB_CONSULTA', 'NAO_INFORMAR');

-- CreateEnum
CREATE TYPE "AutonomyLevel" AS ENUM ('PODE_DECIDIR', 'PODE_DECIDIR_SOB_REGRAS', 'PRECISA_HUMANO');

-- CreateEnum
CREATE TYPE "ResponsibleKind" AS ENUM ('PRINCIPAL', 'RESERVA');

-- CreateEnum
CREATE TYPE "CommunicationTone" AS ENUM ('PROFISSIONAL_PROXIMO', 'ACOLHEDOR', 'DIRETO_OBJETIVO', 'FORMAL');

-- CreateEnum
CREATE TYPE "CommunicationAddressing" AS ENUM ('PRIMEIRO_NOME', 'SENHOR_SENHORA', 'NEUTRO_SEM_NOME');

-- CreateEnum
CREATE TYPE "CommunicationLength" AS ENUM ('CURTAS_OBJETIVAS', 'EQUILIBRADAS', 'DETALHADAS_QUANDO_NECESSARIO');

-- CreateEnum
CREATE TYPE "CommunicationEmojis" AS ENUM ('NAO_USAR', 'USAR_COM_MODERACAO', 'USAR_QUANDO_FIZER_SENTIDO');

-- CreateEnum
CREATE TYPE "IntegrationType" AS ENUM ('WHATSAPP', 'GOOGLE_CALENDAR', 'GOOGLE_TASKS');

-- CreateEnum
CREATE TYPE "IntegrationStatus" AS ENUM ('NOT_CONFIGURED', 'CONNECTING', 'CONNECTED', 'NEEDS_ATTENTION', 'DISCONNECTED');

-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "about" TEXT,
ADD COLUMN     "address" TEXT,
ADD COLUMN     "attendance_name" TEXT,
ADD COLUMN     "business_hours" JSONB,
ADD COLUMN     "general_notes" TEXT,
ADD COLUMN     "profile_updated_at" TIMESTAMP(3),
ADD COLUMN     "service_mode" "ServiceMode",
ADD COLUMN     "social_handle" TEXT,
ADD COLUMN     "website" TEXT;

-- AlterTable
ALTER TABLE "work_manuals" ADD COLUMN     "rules_ack_no_additional" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "products_services" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "ProductServiceKind" NOT NULL,
    "client_description" TEXT NOT NULL,
    "pricing_mode" "PricingMode" NOT NULL,
    "price" DECIMAL(12,2),
    "schedulable" BOOLEAN NOT NULL DEFAULT false,
    "duration_minutes" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_responsibilities" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "digital_employee_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_responsibilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_manual_rules" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "digital_employee_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "applies_when" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_manual_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_autonomy_policies" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "digital_employee_id" TEXT NOT NULL,
    "responsibility_key" TEXT NOT NULL,
    "level" "AutonomyLevel" NOT NULL,
    "condition" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_autonomy_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_responsibles" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "digital_employee_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "kind" "ResponsibleKind" NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_responsibles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_communication_styles" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "digital_employee_id" TEXT NOT NULL,
    "tone" "CommunicationTone",
    "addressing" "CommunicationAddressing",
    "length" "CommunicationLength",
    "emojis" "CommunicationEmojis",
    "preferred_terms" TEXT[],
    "avoid_terms" TEXT[],
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_communication_styles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integrations" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "type" "IntegrationType" NOT NULL,
    "status" "IntegrationStatus" NOT NULL DEFAULT 'NOT_CONFIGURED',
    "external_account_ref" TEXT,
    "credentials_encrypted" TEXT,
    "connected_at" TIMESTAMP(3),
    "last_sync_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "products_services_company_id_idx" ON "products_services"("company_id");

-- CreateIndex
CREATE INDEX "employee_responsibilities_company_id_idx" ON "employee_responsibilities"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "employee_responsibilities_digital_employee_id_key_key" ON "employee_responsibilities"("digital_employee_id", "key");

-- CreateIndex
CREATE INDEX "work_manual_rules_company_id_idx" ON "work_manual_rules"("company_id");

-- CreateIndex
CREATE INDEX "work_manual_rules_digital_employee_id_idx" ON "work_manual_rules"("digital_employee_id");

-- CreateIndex
CREATE INDEX "employee_autonomy_policies_company_id_idx" ON "employee_autonomy_policies"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "employee_autonomy_policies_digital_employee_id_responsibili_key" ON "employee_autonomy_policies"("digital_employee_id", "responsibility_key");

-- CreateIndex
CREATE INDEX "employee_responsibles_company_id_idx" ON "employee_responsibles"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "employee_responsibles_digital_employee_id_kind_key" ON "employee_responsibles"("digital_employee_id", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "employee_communication_styles_digital_employee_id_key" ON "employee_communication_styles"("digital_employee_id");

-- CreateIndex
CREATE INDEX "employee_communication_styles_company_id_idx" ON "employee_communication_styles"("company_id");

-- CreateIndex
CREATE INDEX "integrations_company_id_idx" ON "integrations"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "integrations_company_id_type_key" ON "integrations"("company_id", "type");

-- AddForeignKey
ALTER TABLE "products_services" ADD CONSTRAINT "products_services_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_responsibilities" ADD CONSTRAINT "employee_responsibilities_digital_employee_id_fkey" FOREIGN KEY ("digital_employee_id") REFERENCES "digital_employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_manual_rules" ADD CONSTRAINT "work_manual_rules_digital_employee_id_fkey" FOREIGN KEY ("digital_employee_id") REFERENCES "digital_employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_autonomy_policies" ADD CONSTRAINT "employee_autonomy_policies_digital_employee_id_fkey" FOREIGN KEY ("digital_employee_id") REFERENCES "digital_employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_responsibles" ADD CONSTRAINT "employee_responsibles_digital_employee_id_fkey" FOREIGN KEY ("digital_employee_id") REFERENCES "digital_employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_responsibles" ADD CONSTRAINT "employee_responsibles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_communication_styles" ADD CONSTRAINT "employee_communication_styles_digital_employee_id_fkey" FOREIGN KEY ("digital_employee_id") REFERENCES "digital_employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Row-Level Security — mesmo padrão de docs/technical/04-multi-tenancy.md
-- e da migration enable_row_level_security da Sprint 01. Todas as tabelas
-- novas desta migration são tenant-scoped (carregam company_id).

ALTER TABLE "products_services" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "products_services" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "products_services"
  USING (company_id = current_setting('app.current_company_id', true));

ALTER TABLE "employee_responsibilities" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "employee_responsibilities" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "employee_responsibilities"
  USING (company_id = current_setting('app.current_company_id', true));

ALTER TABLE "work_manual_rules" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "work_manual_rules" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "work_manual_rules"
  USING (company_id = current_setting('app.current_company_id', true));

ALTER TABLE "employee_autonomy_policies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "employee_autonomy_policies" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "employee_autonomy_policies"
  USING (company_id = current_setting('app.current_company_id', true));

ALTER TABLE "employee_responsibles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "employee_responsibles" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "employee_responsibles"
  USING (company_id = current_setting('app.current_company_id', true));

ALTER TABLE "employee_communication_styles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "employee_communication_styles" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "employee_communication_styles"
  USING (company_id = current_setting('app.current_company_id', true));

ALTER TABLE "integrations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "integrations" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "integrations"
  USING (company_id = current_setting('app.current_company_id', true));
