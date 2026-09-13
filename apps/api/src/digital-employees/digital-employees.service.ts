import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import { CatalogAvailability } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDigitalEmployeeDto } from './dto/create-digital-employee.dto';
import { resolveNextStep } from './next-step';

@Injectable()
export class DigitalEmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  private serialize(employee: {
    id: string;
    name: string | null;
    status: import('@prisma/client').EmployeeStatus;
    hiredAt: Date;
    activatedAt: Date | null;
    employeeType: { id: string; name: string; role: string };
    workManual?: { id: string } | null;
  }) {
    return {
      id: employee.id,
      name: employee.name ?? employee.employeeType.name,
      status: employee.status,
      hiredAt: employee.hiredAt,
      activatedAt: employee.activatedAt,
      employeeType: employee.employeeType,
      workManualStarted: Boolean(employee.workManual),
      nextStep: resolveNextStep(employee.status),
    };
  }

  /**
   * US53/US54/US04 — Minha Equipe: lista os funcionários já contratados
   * pela empresa, com Employee Status. Não confundir com o catálogo de
   * contratação (Catalog Availability) — US01.
   */
  async findAll(companyId: string) {
    const employees = await this.prisma.withTenant(companyId, (tx) =>
      tx.digitalEmployee.findMany({
        include: { employeeType: true, workManual: { select: { id: true } } },
        orderBy: { hiredAt: 'desc' },
      }),
    );
    return employees.map((e) => this.serialize(e));
  }

  async findOne(companyId: string, id: string) {
    const employee = await this.prisma.withTenant(companyId, (tx) =>
      tx.digitalEmployee.findUnique({
        where: { id },
        include: { employeeType: true, workManual: { select: { id: true } } },
      }),
    );
    if (!employee) throw new NotFoundException('Funcionário não encontrado.');
    return this.serialize(employee);
  }

  /**
   * US03 — Contratar funcionário.
   *
   * - Só permite contratar EmployeeType com availability = AVAILABLE
   *   (salvaguarda de backend — a UI já não oferece o CTA para "Em breve",
   *   PD5/docs/technical/14-sprint-01-tech-readiness.md §4).
   * - Idempotente via cabeçalho `Idempotency-Key`: chamadas repetidas com
   *   a mesma chave retornam a mesma resposta em vez de criar duplicata
   *   (duplo clique / retry de rede).
   * - Status inicial é PREPARANDO: o fluxo de contratação evolui
   *   imediatamente para Preparando (docs/design/flows/01-hiring.md —
   *   "Status: Contratado/Preparando"; não há uma ação de produto
   *   separada que mova de Contratado para Preparando).
   */
  async create(companyId: string, dto: CreateDigitalEmployeeDto, idempotencyKey?: string) {
    const requestHash = createHash('sha256').update(JSON.stringify(dto)).digest('hex');

    if (idempotencyKey) {
      const existing = await this.prisma.withTenant(companyId, (tx) =>
        tx.idempotencyKey.findUnique({
          where: { companyId_key: { companyId, key: idempotencyKey } },
        }),
      );
      if (existing) {
        if (existing.requestHash !== requestHash) {
          throw new ConflictException(
            'Idempotency-Key já usada com um corpo de requisição diferente.',
          );
        }
        return existing.responseBody;
      }
    }

    const employeeType = await this.prisma.employeeType.findUnique({
      where: { id: dto.employeeTypeId },
    });
    if (!employeeType) {
      throw new NotFoundException('Tipo de funcionário não encontrado.');
    }
    if (employeeType.availability !== CatalogAvailability.AVAILABLE) {
      throw new ConflictException(
        'Este funcionário ainda não está disponível para contratação.',
      );
    }

    const created = await this.prisma.withTenant(companyId, async (tx) => {
      const employee = await tx.digitalEmployee.create({
        data: {
          companyId,
          employeeTypeId: dto.employeeTypeId,
          status: 'PREPARANDO',
        },
        include: { employeeType: true, workManual: { select: { id: true } } },
      });

      if (idempotencyKey) {
        await tx.idempotencyKey.create({
          data: {
            companyId,
            key: idempotencyKey,
            requestHash,
            statusCode: 201,
            responseBody: this.serialize(employee) as unknown as object,
          },
        });
      }

      return employee;
    });

    return this.serialize(created);
  }
}
