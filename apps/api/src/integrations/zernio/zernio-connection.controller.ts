import { Controller, Get, Post, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtPayload } from '../../auth/jwt-payload.interface';
import { ZernioConnectionService } from './zernio-connection.service';

/**
 * Conexão real de WhatsApp via Zernio (issue #30, US14). Endpoints
 * autenticados de conexão/status ficam separados de
 * `preparation/resources.controller.ts` de propósito: a conexão Zernio é
 * por EMPRESA (um profile por tenant), não por funcionário digital — ao
 * contrário da rota genérica `digital-employees/:employeeId/resources`,
 * que é só onde a UI hoje mostra o estado (lido de `Integration`, que
 * este módulo mantém em sincronia).
 */
@Controller('integrations/zernio/whatsapp')
export class ZernioConnectionController {
  constructor(private readonly service: ZernioConnectionService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  @Post('connect')
  connect(@CurrentUser() user: JwtPayload) {
    return this.service.startOnboarding(user.companyId, user.sub);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  @Post('refresh')
  refresh(@CurrentUser() user: JwtPayload) {
    return this.service.refreshStatus(user.companyId).then((status) => ({ status }));
  }

  /**
   * Desconexão real, provider-aware (issue de UI real de Recursos): nunca
   * só o `ResourcesService.disconnect` genérico — este endpoint chama o
   * Zernio de verdade (`ZernioConnectionService.disconnectAccount`,
   * `DELETE /accounts/{accountId}`, idempotente).
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  @Post('disconnect')
  disconnect(@CurrentUser() user: JwtPayload) {
    return this.service.disconnectAccount(user.companyId).then((status) => ({ status }));
  }

  /**
   * Callback público do Embedded Signup (issue #30) — chega sem
   * autenticação (é o navegador do usuário voltando do Zernio, não uma
   * chamada da nossa própria SPA). A validação real é a correlação
   * interna (`correlationId`) verificada em `handleCallback`, nunca os
   * parâmetros da query isoladamente.
   */
  @Get('callback')
  async callback(@Query() query: Record<string, string | undefined>, @Res() res: Response) {
    const { redirectTo } = await this.service.handleCallback(query);
    res.redirect(302, redirectTo);
  }
}
