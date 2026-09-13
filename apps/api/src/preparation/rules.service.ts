import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SYSTEM_LIMITS } from './catalogs/system-limits';
import { PreparationReadinessService } from './preparation-readiness.service';
import { UpsertRuleDto } from './dto/rule.dto';

/**
 * US10 — Regras e limites. System Limits são fixos em código, nunca uma
 * linha de banco (docs/design/22-work-manual-content-model.md §7).
 */
@Injectable()
export class RulesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly readiness: PreparationReadinessService,
  ) {}

  async get(companyId: string, digitalEmployeeId: string) {
    return this.prisma.withTenant(companyId, async (tx) => {
      const manual = await tx.workManual.findUnique({ where: { digitalEmployeeId } });
      const rules = await tx.workManualRule.findMany({
        where: { digitalEmployeeId },
        orderBy: { createdAt: 'asc' },
      });
      return {
        systemLimits: SYSTEM_LIMITS,
        rules,
        acknowledgedNoAdditional: manual?.rulesAcknowledgedNoAdditional ?? false,
      };
    });
  }

  async setAcknowledgedNoAdditional(companyId: string, digitalEmployeeId: string, value: boolean) {
    return this.prisma.withTenant(companyId, async (tx) => {
      const manual = await tx.workManual.findUnique({ where: { digitalEmployeeId } });
      if (!manual) throw new NotFoundException('Preparação ainda não foi iniciada (US06).');
      await tx.workManual.update({
        where: { digitalEmployeeId },
        data: { rulesAcknowledgedNoAdditional: value },
      });
      return this.readiness.recomputeStatus(tx, companyId, digitalEmployeeId);
    });
  }

  async create(companyId: string, digitalEmployeeId: string, dto: UpsertRuleDto) {
    return this.prisma.withTenant(companyId, async (tx) => {
      await tx.workManualRule.create({
        data: { companyId, digitalEmployeeId, text: dto.text, appliesWhen: dto.appliesWhen },
      });
      // Cadastrar uma regra válida também resolve a etapa — mesmo sem
      // marcar "Não tenho regras adicionais" explicitamente (docs §7:
      // "escolher Não tenho regras adicionais OU cadastrar ao menos uma
      // regra válida").
      return this.readiness.recomputeStatus(tx, companyId, digitalEmployeeId);
    });
  }

  async update(companyId: string, digitalEmployeeId: string, id: string, dto: UpsertRuleDto) {
    return this.prisma.withTenant(companyId, async (tx) => {
      const existing = await tx.workManualRule.findUnique({ where: { id } });
      if (!existing) throw new NotFoundException('Regra não encontrada.');
      await tx.workManualRule.update({
        where: { id },
        data: { text: dto.text, appliesWhen: dto.appliesWhen },
      });
      return this.readiness.recomputeStatus(tx, companyId, digitalEmployeeId);
    });
  }

  async remove(companyId: string, digitalEmployeeId: string, id: string) {
    return this.prisma.withTenant(companyId, async (tx) => {
      const existing = await tx.workManualRule.findUnique({ where: { id } });
      if (!existing) throw new NotFoundException('Regra não encontrada.');
      await tx.workManualRule.delete({ where: { id } });
      return this.readiness.recomputeStatus(tx, companyId, digitalEmployeeId);
    });
  }
}
