import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { UpdateResponsiblesDto } from './dto/update-responsibles.dto';
import { ResponsiblesService } from './responsibles.service';

/** US12 — Informar equipe e responsáveis. */
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('digital-employees/:employeeId/responsibles')
export class ResponsiblesController {
  constructor(private readonly service: ResponsiblesService) {}

  @Get()
  get(@CurrentUser() user: JwtPayload, @Param('employeeId') employeeId: string) {
    return this.service.get(user.companyId, employeeId);
  }

  @Patch()
  @Roles(Role.OWNER, Role.ADMIN)
  update(
    @CurrentUser() user: JwtPayload,
    @Param('employeeId') employeeId: string,
    @Body() dto: UpdateResponsiblesDto,
  ) {
    return this.service.update(user.companyId, employeeId, dto);
  }
}
