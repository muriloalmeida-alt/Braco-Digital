import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AutonomyController } from './autonomy.controller';
import { AutonomyService } from './autonomy.service';
import { CommunicationController } from './communication.controller';
import { CommunicationService } from './communication.service';
import { CompanyProfileController } from './company-profile.controller';
import { CompanyProfileService } from './company-profile.service';
import { PreparationReadinessService } from './preparation-readiness.service';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { ResourcesController } from './resources.controller';
import { ResourcesService } from './resources.service';
import { ResponsibilitiesController } from './responsibilities.controller';
import { ResponsibilitiesService } from './responsibilities.service';
import { ResponsiblesController } from './responsibles.controller';
import { ResponsiblesService } from './responsibles.service';
import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';
import { RulesController } from './rules.controller';
import { RulesService } from './rules.service';

/**
 * Sprint 02 — Track A: conteúdo do Manual de Trabalho (US07-US17).
 * Um módulo por etapa dentro do mesmo `Module` para manter o roteamento
 * granular sem multiplicar arquivos `*.module.ts` triviais.
 */
@Module({
  imports: [PrismaModule],
  controllers: [
    CompanyProfileController,
    ProductsController,
    ResponsibilitiesController,
    RulesController,
    AutonomyController,
    ResponsiblesController,
    CommunicationController,
    ResourcesController,
    ReviewController,
  ],
  providers: [
    PreparationReadinessService,
    CompanyProfileService,
    ProductsService,
    ResponsibilitiesService,
    RulesService,
    AutonomyService,
    ResponsiblesService,
    CommunicationService,
    ResourcesService,
    ReviewService,
  ],
})
export class PreparationModule {}
