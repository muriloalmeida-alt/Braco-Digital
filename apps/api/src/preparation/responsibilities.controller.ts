import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { UpdateResponsibilitiesDto } from './dto/update-responsibilities.dto';
import { ResponsibilitiesService } from './responsibilities.service';

/** US09 — Definir responsabilidades. */
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('digital-employees/:employeeId/responsibilities')
export class ResponsibilitiesController {
  constructor(private readonly service: ResponsibilitiesService) {}

  @Get()
  get(@CurrentUser() user: JwtPayload, @Param('employeeId') employeeId: string) {
    return this.service.get(user.companyId, employeeId);
  }

  @Patch()
  @Roles(Role.OWNER, Role.ADMIN)
  update(
    @CurrentUser() user: JwtPayload,
    @Param('employeeId') employeeId: string,
    @Body() dto: UpdateResponsibilitiesDto,
  ) {
    return this.service.update(user.companyId, employeeId, dto);
  }
}
