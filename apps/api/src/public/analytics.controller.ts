import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AnalyticsEventDto } from './dto/analytics-event.dto';
import { AnalyticsService } from './analytics.service';

/** TD17 — Funil de Track B sem PII, relayado pelo servidor. */
@UseGuards(ThrottlerGuard)
@Controller('public/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('events')
  @HttpCode(204)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  track(@Body() dto: AnalyticsEventDto) {
    this.analyticsService.track(dto);
  }
}
