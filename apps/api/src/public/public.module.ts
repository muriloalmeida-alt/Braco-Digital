import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { EmployeeTypesModule } from '../employee-types/employee-types.module';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { DiagnosticsController } from './diagnostics.controller';
import { DiagnosticsService } from './diagnostics.service';
import { EmployeeTypesPublicController } from './employee-types-public.controller';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';

/**
 * Track B — módulo público (Growth / "Monte sua equipe").
 * docs/technical/20-sprint-02-tech-readiness.md §7: módulo isolado, sem
 * import de guards autenticados — impossível herdar um bug de
 * autorização de outro módulo porque não há autorização nenhuma aqui
 * para herdar. Rate limiting por IP nas 3 rotas de escrita/leitura
 * pública (valores conservadores, ajustáveis por `@Throttle` em cada
 * controller).
 *
 * `ThrottlerGuard` é aplicado só nos controllers deste módulo (via
 * `@UseGuards` em cada um), nunca como `APP_GUARD` global — isso
 * manteria o resto da aplicação (Track A, auth) sujeito ao mesmo limite
 * de taxa sem necessidade, arriscando falsos 429 em fluxos autenticados
 * que já têm sua própria proteção (JwtAuthGuard).
 */
@Module({
  imports: [ThrottlerModule.forRoot([{ ttl: 60_000, limit: 20 }]), EmployeeTypesModule],
  controllers: [EmployeeTypesPublicController, DiagnosticsController, LeadsController, AnalyticsController],
  providers: [DiagnosticsService, LeadsService, AnalyticsService],
})
export class PublicModule {}
