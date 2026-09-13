import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { getResponsibilityCatalog } from './catalogs/responsibility-catalog';
import { PreparationReadinessService } from './preparation-readiness.service';
import { UpdateResponsibilitiesDto } from './dto/update-responsibilities.dto';

/**
 * US09 — Responsabilidades. Catálogo fixo em código
 * (`responsibility-catalog.ts`); só a seleção (`enabled`) por funcionário
 * persiste no banco (docs/technical/17-technical-decisions.md TD13).
 */
@Injectable()
export class ResponsibilitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly readiness: PreparationReadinessService,
  ) {}

  /**
   * Garante que as responsabilidades essenciais existam para o
   * funcionário (sempre habilitadas, não removíveis — docs/design/22-
   * work-manual-content-model.md §6). Chamado antes de qualquer leitura/
   * escrita desta etapa; idempotente via `createMany + skipDuplicates`.
   */
  private async seedEssentials(tx: Prisma.TransactionClient, companyId: string, digitalEmployeeId: string, employeeTypeKey: string) {
    const catalog = getResponsibilityCatalog(employeeTypeKey);
    const essentials = catalog.filter((c) => c.essential);
    if (essentials.length === 0) return;
    await tx.employeeResponsibility.createMany({
      data: essentials.map((e) => ({ companyId, digitalEmployeeId, key: e.key, enabled: true })),
      skipDuplicates: true,
    });
  }

  async get(companyId: string, digitalEmployeeId: string) {
    return this.prisma.withTenant(companyId, async (tx) => {
      const employee = await tx.digitalEmployee.findUnique({
        where: { id: digitalEmployeeId },
        include: { employeeType: true },
      });
      if (!employee) throw new NotFoundException('Funcionário não encontrado.');

      await this.seedEssentials(tx, companyId, digitalEmployeeId, employee.employeeType.key);

      const catalog = getResponsibilityCatalog(employee.employeeType.key);
      const rows = await tx.employeeResponsibility.findMany({ where: { digitalEmployeeId } });
      const enabledByKey = new Map(rows.map((r) => [r.key, r.enabled]));

      return catalog.map((def) => ({
        ...def,
        enabled: enabledByKey.get(def.key) ?? def.essential,
      }));
    });
  }

  async update(companyId: string, digitalEmployeeId: string, dto: UpdateResponsibilitiesDto) {
    return this.prisma.withTenant(companyId, async (tx) => {
      const employee = await tx.digitalEmployee.findUnique({
        where: { id: digitalEmployeeId },
        include: { employeeType: true },
      });
      if (!employee) throw new NotFoundException('Funcionário não encontrado.');

      await this.seedEssentials(tx, companyId, digitalEmployeeId, employee.employeeType.key);

      const catalog = getResponsibilityCatalog(employee.employeeType.key);
      const catalogByKey = new Map(catalog.map((c) => [c.key, c]));

      for (const choice of dto.responsibilities) {
        const def = catalogByKey.get(choice.key);
        if (!def) continue; // chave desconhecida — ignorada, não é erro (não altera Produto por conta própria)
        if (def.essential) continue; // essenciais nunca são desabilitáveis

        await tx.employeeResponsibility.upsert({
          where: { digitalEmployeeId_key: { digitalEmployeeId, key: choice.key } },
          create: { companyId, digitalEmployeeId, key: choice.key, enabled: choice.enabled },
          update: { enabled: choice.enabled },
        });
      }

      return this.readiness.recomputeStatus(tx, companyId, digitalEmployeeId);
    });
  }
}
