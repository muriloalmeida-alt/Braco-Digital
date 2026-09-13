import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { AcknowledgeNoAdditionalRulesDto } from './dto/acknowledge-no-additional-rules.dto';
import { UpsertRuleDto } from './dto/rule.dto';
import { RulesService } from './rules.service';

/** US10 — Definir regras e limites. */
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('digital-employees/:employeeId/rules')
export class RulesController {
  constructor(private readonly service: RulesService) {}

  @Get()
  get(@CurrentUser() user: JwtPayload, @Param('employeeId') employeeId: string) {
    return this.service.get(user.companyId, employeeId);
  }

  @Patch('acknowledgement')
  @Roles(Role.OWNER, Role.ADMIN)
  acknowledge(
    @CurrentUser() user: JwtPayload,
    @Param('employeeId') employeeId: string,
    @Body() dto: AcknowledgeNoAdditionalRulesDto,
  ) {
    return this.service.setAcknowledgedNoAdditional(user.companyId, employeeId, dto.acknowledgedNoAdditional);
  }

  @Post()
  @Roles(Role.OWNER, Role.ADMIN)
  create(@CurrentUser() user: JwtPayload, @Param('employeeId') employeeId: string, @Body() dto: UpsertRuleDto) {
    return this.service.create(user.companyId, employeeId, dto);
  }

  @Patch(':id')
  @Roles(Role.OWNER, Role.ADMIN)
  update(
    @CurrentUser() user: JwtPayload,
    @Param('employeeId') employeeId: string,
    @Param('id') id: string,
    @Body() dto: UpsertRuleDto,
  ) {
    return this.service.update(user.companyId, employeeId, id, dto);
  }

  @Delete(':id')
  @Roles(Role.OWNER, Role.ADMIN)
  remove(@CurrentUser() user: JwtPayload, @Param('employeeId') employeeId: string, @Param('id') id: string) {
    return this.service.remove(user.companyId, employeeId, id);
  }
}
