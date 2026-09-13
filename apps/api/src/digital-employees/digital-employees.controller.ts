import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { CreateDigitalEmployeeDto } from './dto/create-digital-employee.dto';
import { DigitalEmployeesService } from './digital-employees.service';

/**
 * US03 — Contratar funcionário
 * US04 — Visualizar funcionário contratado
 * US05 — Identificar próximo passo (embutido na resposta como `nextStep`)
 * US53 — Visualizar equipe
 * US54 — Visualizar status (embutido como `status`)
 */
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('digital-employees')
export class DigitalEmployeesController {
  constructor(private readonly digitalEmployeesService: DigitalEmployeesService) {}

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.digitalEmployeesService.findAll(user.companyId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.digitalEmployeesService.findOne(user.companyId, id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.OWNER, Role.ADMIN)
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateDigitalEmployeeDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.digitalEmployeesService.create(user.companyId, dto, idempotencyKey);
  }
}
