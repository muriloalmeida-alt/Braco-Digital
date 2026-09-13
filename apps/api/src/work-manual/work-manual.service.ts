import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { buildInitialSections } from './work-manual-sections';

@Injectable()
export class WorkManualService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * US06 — Iniciar preparação.
   *
   * Idempotente: chamar duas vezes para o mesmo funcionário não recria o
   * manual, apenas retorna o existente (docs/technical/14-sprint-01-tech-
   * readiness.md §7 — "iniciar preparação duas vezes não deve recriar o
   * manual").
   */
  async startPreparation(companyId: string, digitalEmployeeId: string) {
    return this.prisma.withTenant(companyId, async (tx) => {
      const employee = await tx.digitalEmployee.findUnique({
        where: { id: digitalEmployeeId },
        include: { workManual: true },
      });
      if (!employee) {
        throw new NotFoundException('Funcionário não encontrado.');
      }

      if (employee.workManual) {
        return employee.workManual;
      }

      return tx.workManual.create({
        data: {
          companyId,
          digitalEmployeeId,
          status: 'in_progress',
          sections: buildInitialSections() as unknown as object,
        },
      });
    });
  }

  async findByEmployee(companyId: string, digitalEmployeeId: string) {
    return this.prisma.withTenant(companyId, async (tx) => {
      const employee = await tx.digitalEmployee.findUnique({
        where: { id: digitalEmployeeId },
      });
      if (!employee) {
        throw new NotFoundException('Funcionário não encontrado.');
      }

      const manual = await tx.workManual.findUnique({
        where: { digitalEmployeeId },
      });
      if (!manual) {
        // Estado "não iniciado" — US06 ainda não foi executada para este
        // funcionário. Não é erro, é um estado válido do fluxo.
        return {
          status: 'not_started' as const,
          sections: buildInitialSections(),
        };
      }
      return manual;
    });
  }
}
