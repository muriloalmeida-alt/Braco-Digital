import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PreparationReadinessService } from './preparation-readiness.service';
import { UpdateCompanyProfileDto } from './dto/update-company-profile.dto';

/**
 * US07 — Empresa. Contexto compartilhado (`Company`), não copiado por
 * funcionário (docs/design/22-work-manual-content-model.md §4/§14).
 */
@Injectable()
export class CompanyProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly readiness: PreparationReadinessService,
  ) {}

  async get(companyId: string) {
    return this.prisma.withTenant(companyId, (tx) => tx.company.findUniqueOrThrow({ where: { id: companyId } }));
  }

  /**
   * Empresa é compartilhada — invalidar um campo obrigatório aqui pode
   * afetar a etapa "Empresa" de *todos* os funcionários da empresa, não
   * só de um. Por isso recomputa (e, se preciso, rebaixa PRONTO →
   * PREPARANDO) para cada `DigitalEmployee` da empresa, na mesma
   * transação da escrita.
   */
  async update(companyId: string, dto: UpdateCompanyProfileDto) {
    return this.prisma.withTenant(companyId, async (tx) => {
      const company = await tx.company.update({
        where: { id: companyId },
        data: { ...dto, businessHours: dto.businessHours as unknown as object, profileUpdatedAt: new Date() },
      });

      const employees = await tx.digitalEmployee.findMany({
        where: { companyId },
        select: { id: true },
      });
      for (const employee of employees) {
        await this.readiness.recomputeStatus(tx, companyId, employee.id);
      }

      return company;
    });
  }
}
