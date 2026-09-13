import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Catálogo de funcionários (docs/04-employee-catalog.md). Global, não é
 * tenant-scoped — não passa por `withTenant`/RLS.
 */
@Injectable()
export class EmployeeTypesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.employeeType.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findOne(id: string) {
    const employeeType = await this.prisma.employeeType.findUnique({
      where: { id },
    });
    if (!employeeType) {
      throw new NotFoundException('Tipo de funcionário não encontrado.');
    }
    return employeeType;
  }
}
