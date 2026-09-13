import { Body, Controller, Get, Param, ParseEnumPipe, Post, UseGuards } from '@nestjs/common';
import { IntegrationType, Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { ConfirmIntegrationDto } from './dto/confirm-integration.dto';
import { ResourcesService } from './resources.service';

/** US14 — Configurar recursos de trabalho. */
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('digital-employees/:employeeId/resources')
export class ResourcesController {
  constructor(private readonly service: ResourcesService) {}

  @Get()
  get(@CurrentUser() user: JwtPayload, @Param('employeeId') employeeId: string) {
    return this.service.get(user.companyId, employeeId);
  }

  @Post(':type/connect')
  @Roles(Role.OWNER, Role.ADMIN)
  connect(
    @CurrentUser() user: JwtPayload,
    @Param('employeeId') employeeId: string,
    @Param('type', new ParseEnumPipe(IntegrationType)) type: IntegrationType,
  ) {
    return this.service.startConnection(user.companyId, employeeId, type);
  }

  /**
   * Ponto de integração do callback de autorização externa. Ver aviso em
   * `resources.service.ts` sobre a ausência de credenciais reais de BSP/
   * Google nesta sprint.
   */
  @Post(':type/confirm')
  @Roles(Role.OWNER, Role.ADMIN)
  confirm(
    @CurrentUser() user: JwtPayload,
    @Param('employeeId') employeeId: string,
    @Param('type', new ParseEnumPipe(IntegrationType)) type: IntegrationType,
    @Body() dto: ConfirmIntegrationDto,
  ) {
    return this.service.confirmConnection(user.companyId, employeeId, type, dto.externalAccountRef);
  }

  @Post(':type/disconnect')
  @Roles(Role.OWNER, Role.ADMIN)
  disconnect(
    @CurrentUser() user: JwtPayload,
    @Param('employeeId') employeeId: string,
    @Param('type', new ParseEnumPipe(IntegrationType)) type: IntegrationType,
  ) {
    return this.service.disconnect(user.companyId, employeeId, type);
  }
}
