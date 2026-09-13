import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { ReviewService } from './review.service';

/** US15 — Revisar Manual de Trabalho / US16 — Identificar preparação incompleta. */
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('digital-employees/:employeeId/work-manual')
export class ReviewController {
  constructor(private readonly service: ReviewService) {}

  @Get('overview')
  overview(@CurrentUser() user: JwtPayload, @Param('employeeId') employeeId: string) {
    return this.service.getOverview(user.companyId, employeeId);
  }

  @Post('complete')
  @Roles(Role.OWNER, Role.ADMIN)
  complete(@CurrentUser() user: JwtPayload, @Param('employeeId') employeeId: string) {
    return this.service.complete(user.companyId, employeeId);
  }
}
