import { Controller, Get, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { EmployeeTypesService } from '../employee-types/employee-types.service';

/**
 * US77 — Portfólio da landing pública.
 *
 * Reusa `EmployeeTypesService` (mesmo serviço do catálogo autenticado) —
 * nunca duplica a leitura de Catalog Availability (TD12/§12 tech
 * readiness). Sem `@UseGuards`: rota pública de propósito, dado já é
 * catálogo público (nome, missão, disponibilidade) sem identificador de
 * tenant.
 */
@UseGuards(ThrottlerGuard)
@Controller('public/employee-types')
export class EmployeeTypesPublicController {
  constructor(private readonly employeeTypesService: EmployeeTypesService) {}

  @Get()
  findAll() {
    return this.employeeTypesService.findAll();
  }
}
