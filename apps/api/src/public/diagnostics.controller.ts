import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { DiagnosticAnswersDto } from './dto/diagnostic-answers.dto';
import { DiagnosticsService } from './diagnostics.service';

/**
 * US81 — Gerar equipe recomendada. Não persiste nada (§5 tech
 * readiness) — a sessão de diagnóstico vive só no cliente até virar Lead.
 */
@UseGuards(ThrottlerGuard)
@Controller('public/diagnostics')
export class DiagnosticsController {
  constructor(private readonly diagnosticsService: DiagnosticsService) {}

  @Post('recommendation')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  recommend(@Body() dto: DiagnosticAnswersDto) {
    return this.diagnosticsService.recommend(dto);
  }
}
