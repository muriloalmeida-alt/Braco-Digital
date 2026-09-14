import { Body, Controller, Get, Post, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtPayload } from '../../auth/jwt-payload.interface';
import { Role } from '@prisma/client';
import { SelectCalendarDto } from './dto/select-calendar.dto';
import { GoogleConnectionService } from './google-connection.service';

/**
 * Rotas de gestão da conexão Google (issue #31) — company-level, não
 * escopadas por `digitalEmployeeId` (uma conexão OAuth por empresa,
 * decisão de Produto §2). Deliberadamente um controller separado de
 * `resources.controller.ts` (o caminho SIMULADO permanece intocado), mesmo
 * padrão de `integrations/zernio/zernio-connection.controller.ts`.
 */
@Controller('integrations/google')
export class GoogleConnectionController {
  constructor(private readonly service: GoogleConnectionService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  @Post('connect')
  connect(@CurrentUser() user: JwtPayload) {
    return this.service.startOAuth(user.companyId, user.sub);
  }

  /**
   * Callback OAuth — rota pública (o Google chega aqui sem JWT nenhum).
   * Correlação de tenant é 100% via `state` server-side, nunca via
   * parâmetro isolado da query (issue #31 §6).
   */
  @Get('callback')
  async callback(@Query() query: Record<string, string | undefined>, @Res() res: Response) {
    const { redirectTo } = await this.service.handleCallback(query);
    res.redirect(302, redirectTo);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('calendars')
  listCalendars(@CurrentUser() user: JwtPayload) {
    return this.service.listAvailableCalendars(user.companyId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  @Post('calendar/select')
  selectCalendar(@CurrentUser() user: JwtPayload, @Body() dto: SelectCalendarDto) {
    return this.service.selectCalendar(user.companyId, dto.calendarId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  @Post('tasks/setup')
  setupTasks(@CurrentUser() user: JwtPayload) {
    return this.service.setupTasksList(user.companyId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('status')
  status(@CurrentUser() user: JwtPayload) {
    return this.service.getStatus(user.companyId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  @Post('calendar/disconnect')
  disconnectCalendar(@CurrentUser() user: JwtPayload) {
    return this.service.disconnectCalendar(user.companyId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  @Post('tasks/disconnect')
  disconnectTasks(@CurrentUser() user: JwtPayload) {
    return this.service.disconnectTasks(user.companyId);
  }
}
