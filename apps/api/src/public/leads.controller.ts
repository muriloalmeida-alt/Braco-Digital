import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { CreateLeadDto } from './dto/create-lead.dto';
import { LeadsService } from './leads.service';

/**
 * US83 — Registrar lead interessado. Não cria User, Company nem
 * contratação (PRD 04 §19) — só persiste o `Lead`.
 */
@UseGuards(ThrottlerGuard)
@Controller('public/leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  /**
   * Product Review 01: a UI (Disabled/Synthetic/Real) nunca infere o
   * modo sozinha — pergunta ao backend, mesmo princípio de autoridade
   * de backend usado em `canSimulateConnection` (Track A/TD19).
   */
  @Get('capture-mode')
  getCaptureMode() {
    return this.leadsService.getCaptureMode();
  }

  @Post()
  @HttpCode(201)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  create(@Body() dto: CreateLeadDto) {
    return this.leadsService.create(dto, 'growth-landing');
  }
}
