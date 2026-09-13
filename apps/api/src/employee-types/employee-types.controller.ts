import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { EmployeeTypesService } from './employee-types.service';

/**
 * US01 — Visualizar funcionários disponíveis
 * US02 — Visualizar detalhes do funcionário
 *
 * Catálogo de contratação. `availability` (AVAILABLE | COMING_SOON) é
 * Catalog Availability — nunca confundir com Employee Status
 * (docs/design/09-product-patterns.md §1.1 vs §2).
 */
@UseGuards(JwtAuthGuard)
@Controller('employee-types')
export class EmployeeTypesController {
  constructor(private readonly employeeTypesService: EmployeeTypesService) {}

  @Get()
  findAll() {
    return this.employeeTypesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.employeeTypesService.findOne(id);
  }
}
