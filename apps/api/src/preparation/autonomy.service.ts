import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AutonomyLevel } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AUTONOMY_RANK, getAutonomyDefault } from './catalogs/autonomy-catalog';
import { getResponsibilityCatalog } from './catalogs/responsibility-catalog';
import { PreparationReadinessService } from './preparation-readiness.service';
import { UpdateAutonomyDto } from './dto/update-autonomy.dto';

/**
 * US11 — Autonomia. PD7 (RESOLVED): recomendação e teto são propriedades
 * distintas. O backend valida `selected <= ceiling` sempre — nunca só a
 * UI (docs/technical/17-technical-decisions.md TD14).
 */
@Injectable()
export class AutonomyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly readiness: PreparationReadinessService,
  ) {}

  async get(companyId: string, digitalEmployeeId: string) {
    return this.prisma.withTenant(companyId, async (tx) => {
      const employee = await tx.digitalEmployee.findUnique({
        where: { id: digitalEmployeeId },
        include: { employeeType: true },
      });
      if (!employee) throw new NotFoundException('Funcionário não encontrado.');

      const [responsibilities, policies] = await Promise.all([
        tx.employeeResponsibility.findMany({ where: { digitalEmployeeId } }),
        tx.employeeAutonomyPolicy.findMany({ where: { digitalEmployeeId } }),
      ]);

      const catalog = getResponsibilityCatalog(employee.employeeType.key);
      const enabledByKey = new Map(responsibilities.map((r) => [r.key, r.enabled]));
      const policyByKey = new Map(policies.map((p) => [p.responsibilityKey, p]));

      const enabledResponsibilities = catalog.filter(
        (def) => def.essential || enabledByKey.get(def.key),
      );

      return enabledResponsibilities.map((def) => {
        const defaults = getAutonomyDefault(employee.employeeType.key, def.key);
        const policy = policyByKey.get(def.key);
        return {
          responsibilityKey: def.key,
          label: def.label,
          recommended: defaults?.recommended ?? null,
          ceiling: defaults?.ceiling ?? null,
          level: policy?.level ?? null,
          condition: policy?.condition ?? null,
        };
      });
    });
  }

  async update(companyId: string, digitalEmployeeId: string, dto: UpdateAutonomyDto) {
    return this.prisma.withTenant(companyId, async (tx) => {
      const employee = await tx.digitalEmployee.findUnique({
        where: { id: digitalEmployeeId },
        include: { employeeType: true },
      });
      if (!employee) throw new NotFoundException('Funcionário não encontrado.');

      for (const choice of dto.choices) {
        const def = getAutonomyDefault(employee.employeeType.key, choice.responsibilityKey);
        if (!def) {
          throw new BadRequestException(`Responsabilidade desconhecida: ${choice.responsibilityKey}.`);
        }
        // TD14 — o backend rejeita valor acima do teto, sempre, mesmo se
        // a UI tiver deixado passar por algum motivo.
        if (AUTONOMY_RANK[choice.level] > AUTONOMY_RANK[def.ceiling]) {
          throw new BadRequestException(
            `Este nível de autonomia não está disponível para esta responsabilidade.`,
          );
        }
        if (choice.level === AutonomyLevel.PODE_DECIDIR_SOB_REGRAS && !choice.condition?.trim()) {
          throw new BadRequestException('"Pode decidir sob regras" exige uma condição.');
        }

        await tx.employeeAutonomyPolicy.upsert({
          where: {
            digitalEmployeeId_responsibilityKey: {
              digitalEmployeeId,
              responsibilityKey: choice.responsibilityKey,
            },
          },
          create: {
            companyId,
            digitalEmployeeId,
            responsibilityKey: choice.responsibilityKey,
            level: choice.level,
            condition: choice.condition,
          },
          update: { level: choice.level, condition: choice.condition },
        });
      }

      return this.readiness.recomputeStatus(tx, companyId, digitalEmployeeId);
    });
  }
}
