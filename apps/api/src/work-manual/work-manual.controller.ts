import { Controller, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { WorkManualService } from './work-manual.service';

/**
 * US06 — Iniciar preparação.
 *
 * Escopo confirmado: só entrar na preparação e ver a estrutura de seções
 * vazias. Preenchimento de conteúdo é US07-US15 (Sprint 02) — não
 * implementado aqui.
 */
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('digital-employees/:employeeId/work-manual')
export class WorkManualController {
  constructor(private readonly workManualService: WorkManualService) {}

  @Get()
  findOne(@CurrentUser() user: JwtPayload, @Param('employeeId') employeeId: string) {
    return this.workManualService.findByEmployee(user.companyId, employeeId);
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @Roles(Role.OWNER, Role.ADMIN)
  start(@CurrentUser() user: JwtPayload, @Param('employeeId') employeeId: string) {
    return this.workManualService.startPreparation(user.companyId, employeeId);
  }
}
