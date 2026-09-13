/*
  Warnings:

  - Added the required column `company_id` to the `work_manuals` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "work_manuals" ADD COLUMN     "company_id" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "work_manuals_company_id_idx" ON "work_manuals"("company_id");
