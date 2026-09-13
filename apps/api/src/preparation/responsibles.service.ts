import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ResponsibleKind } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PreparationReadinessService } from './preparation-readiness.service';
import { UpdateResponsiblesDto } from './dto/update-responsibles.dto';

/**
 * US12 — Pessoas e responsáveis. Só usuários ativos da empresa
 * (docs/design/22-work-manual-content-model.md §9).
 */
@Injectable()
export class ResponsiblesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly readiness: PreparationReadinessService,
  ) {}

  async get(companyId: string, digitalEmployeeId: string) {
    return this.prisma.withTenant(companyId, async (tx) => {
      const [members, responsibles] = await Promise.all([
        tx.companyMembership.findMany({
          where: { companyId },
          include: { user: { select: { id: true, name: true, email: true } } },
        }),
        tx.employeeResponsible.findMany({ where: { digitalEmployeeId } }),
      ]);

      const eligibleUsers = members.map((m) => ({
        userId: m.user.id,
        name: m.user.name,
        email: m.user.email,
        role: m.role,
      }));

      const principal = responsibles.find((r) => r.kind === ResponsibleKind.PRINCIPAL);
      const backup = responsibles.find((r) => r.kind === ResponsibleKind.RESERVA);

      return {
        eligibleUsers,
        recommendedUserId: eligibleUsers.length === 1 ? eligibleUsers[0].userId : null,
        principalUserId: principal?.userId ?? null,
        backupUserId: backup?.userId ?? null,
      };
    });
  }

  async update(companyId: string, digitalEmployeeId: string, dto: UpdateResponsiblesDto) {
    return this.prisma.withTenant(companyId, async (tx) => {
      const employee = await tx.digitalEmployee.findUnique({ where: { id: digitalEmployeeId } });
      if (!employee) throw new NotFoundException('Funcionário não encontrado.');

      const membership = await tx.companyMembership.findUnique({
        where: { companyId_userId: { companyId, userId: dto.principalUserId } },
      });
      if (!membership) {
        throw new BadRequestException('O responsável principal precisa ser um usuário ativo da empresa.');
      }
      if (dto.backupUserId) {
        if (dto.backupUserId === dto.principalUserId) {
          throw new BadRequestException('O responsável reserva precisa ser diferente do principal.');
        }
        const backupMembership = await tx.companyMembership.findUnique({
          where: { companyId_userId: { companyId, userId: dto.backupUserId } },
        });
        if (!backupMembership) {
          throw new BadRequestException('O responsável reserva precisa ser um usuário ativo da empresa.');
        }
      }

      await tx.employeeResponsible.upsert({
        where: { digitalEmployeeId_kind: { digitalEmployeeId, kind: ResponsibleKind.PRINCIPAL } },
        create: { companyId, digitalEmployeeId, userId: dto.principalUserId, kind: ResponsibleKind.PRINCIPAL },
        update: { userId: dto.principalUserId },
      });

      if (dto.backupUserId) {
        await tx.employeeResponsible.upsert({
          where: { digitalEmployeeId_kind: { digitalEmployeeId, kind: ResponsibleKind.RESERVA } },
          create: { companyId, digitalEmployeeId, userId: dto.backupUserId, kind: ResponsibleKind.RESERVA },
          update: { userId: dto.backupUserId },
        });
      } else {
        await tx.employeeResponsible.deleteMany({
          where: { digitalEmployeeId, kind: ResponsibleKind.RESERVA },
        });
      }

      return this.readiness.recomputeStatus(tx, companyId, digitalEmployeeId);
    });
  }
}
