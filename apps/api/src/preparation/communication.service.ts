import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { buildCommunicationPreview } from './catalogs/communication-options';
import { PreparationReadinessService } from './preparation-readiness.service';
import { UpdateCommunicationDto } from './dto/update-communication.dto';

/** US13 — Definir estilo de comunicação. */
@Injectable()
export class CommunicationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly readiness: PreparationReadinessService,
  ) {}

  async get(companyId: string, digitalEmployeeId: string) {
    return this.prisma.withTenant(companyId, async (tx) => {
      const employee = await tx.digitalEmployee.findUnique({
        where: { id: digitalEmployeeId },
        include: { employeeType: true, company: true },
      });
      if (!employee) throw new NotFoundException('Funcionário não encontrado.');

      const style = await tx.employeeCommunicationStyle.findUnique({ where: { digitalEmployeeId } });
      const employeeName = employee.name ?? employee.employeeType.name;
      const companyName = employee.company.attendanceName ?? employee.company.name;

      return {
        tone: style?.tone ?? null,
        addressing: style?.addressing ?? null,
        length: style?.length ?? null,
        emojis: style?.emojis ?? null,
        preferredTerms: style?.preferredTerms ?? [],
        avoidTerms: style?.avoidTerms ?? [],
        preview: buildCommunicationPreview(
          { tone: style?.tone ?? null, addressing: style?.addressing ?? null, emojis: style?.emojis ?? null },
          employeeName,
          companyName,
        ),
      };
    });
  }

  async update(companyId: string, digitalEmployeeId: string, dto: UpdateCommunicationDto) {
    return this.prisma.withTenant(companyId, async (tx) => {
      const employee = await tx.digitalEmployee.findUnique({ where: { id: digitalEmployeeId } });
      if (!employee) throw new NotFoundException('Funcionário não encontrado.');

      await tx.employeeCommunicationStyle.upsert({
        where: { digitalEmployeeId },
        create: {
          companyId,
          digitalEmployeeId,
          tone: dto.tone,
          addressing: dto.addressing,
          length: dto.length,
          emojis: dto.emojis,
          preferredTerms: dto.preferredTerms ?? [],
          avoidTerms: dto.avoidTerms ?? [],
        },
        update: {
          ...(dto.tone !== undefined && { tone: dto.tone }),
          ...(dto.addressing !== undefined && { addressing: dto.addressing }),
          ...(dto.length !== undefined && { length: dto.length }),
          ...(dto.emojis !== undefined && { emojis: dto.emojis }),
          ...(dto.preferredTerms !== undefined && { preferredTerms: dto.preferredTerms }),
          ...(dto.avoidTerms !== undefined && { avoidTerms: dto.avoidTerms }),
        },
      });

      return this.readiness.recomputeStatus(tx, companyId, digitalEmployeeId);
    });
  }
}
