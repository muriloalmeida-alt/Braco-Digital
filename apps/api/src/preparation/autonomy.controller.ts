import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { AutonomyService } from './autonomy.service';
import { UpdateAutonomyDto } from './dto/update-autonomy.dto';

/** US11 — Definir autonomia. */
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('digital-employees/:employeeId/autonomy')
export class AutonomyController {
  constructor(private readonly service: AutonomyService) {}

  @Get()
  get(@CurrentUser() user: JwtPayload, @Param('employeeId') employeeId: string) {
    return this.service.get(user.companyId, employeeId);
  }

  @Patch()
  @Roles(Role.OWNER, Role.ADMIN)
  update(@CurrentUser() user: JwtPayload, @Param('employeeId') employeeId: string, @Body() dto: UpdateAutonomyDto) {
    return this.service.update(user.companyId, employeeId, dto);
  }
}
