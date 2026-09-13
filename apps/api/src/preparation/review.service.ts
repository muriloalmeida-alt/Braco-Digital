import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { EmployeeStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PreparationReadinessService } from './preparation-readiness.service';

/**
 * US15/US16/US17 — Revisão, incompletude e status. `PreparationReadinessService`
 * é a única autoridade — este serviço só expõe a view e a ação de
 * conclusão (docs/design/22-work-manual-content-model.md §12).
 */
@Injectable()
export class ReviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly readiness: PreparationReadinessService,
  ) {}

  /** Overview/Review — US16 ("X de 8", pendências) e tela de Revisão (US15). */
  async getOverview(companyId: string, digitalEmployeeId: string) {
    return this.prisma.withTenant(companyId, (tx) => this.readiness.computeView(tx, companyId, digitalEmployeeId));
  }

  /**
   * US15 — Concluir preparação. Revalida TODAS as invariantes no
   * backend antes de mudar o status — nunca confia no "8 de 8" que o
   * frontend possa estar mostrando (pode estar desatualizado numa aba
   * antiga). Nunca ativa (`TRABALHANDO`) — só `PRONTO`.
   */
  async complete(companyId: string, digitalEmployeeId: string) {
    return this.prisma.withTenant(companyId, async (tx) => {
      const employee = await tx.digitalEmployee.findUnique({ where: { id: digitalEmployeeId } });
      if (!employee) throw new NotFoundException('Funcionário não encontrado.');

      const view = await this.readiness.computeView(tx, companyId, digitalEmployeeId);
      if (view.completedCount < view.totalSteps) {
        throw new ConflictException({
          message: 'O Manual de Trabalho ainda não está completo.',
          pendingSteps: view.pendingSteps,
        });
      }

      const updated = await tx.digitalEmployee.update({
        where: { id: digitalEmployeeId },
        data: { status: EmployeeStatus.PRONTO },
      });

      return { ...view, employeeStatus: updated.status, review: 'concluida' as const };
    });
  }
}
