-- Product Review 01 — Track A: origem da conexão de um recurso
-- (SIMULATED vs REAL). Guarda contra "simulação vira PRONTO em
-- produção" — ver TD19 em docs/technical/17-technical-decisions.md e
-- PreparationReadinessService.computeRecursosStatus.
--
-- (As instruções "DROP TABLE leads"/"DROP TYPE ..." que o `prisma
-- migrate diff` gerou aqui foram removidas de propósito: são artefato
-- do banco de dev compartilhado já ter a migração de Track B aplicada
-- também — não fazem parte desta mudança de Track A.)

-- CreateEnum
CREATE TYPE "IntegrationConnectionMode" AS ENUM ('SIMULATED', 'REAL');

-- AlterTable
ALTER TABLE "integrations" ADD COLUMN "connection_mode" "IntegrationConnectionMode" NOT NULL DEFAULT 'SIMULATED';
