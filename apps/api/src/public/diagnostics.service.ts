import { BadRequestException, Injectable } from '@nestjs/common';
import { EmployeeTypesService } from '../employee-types/employee-types.service';
import {
  AvailabilityByType,
  BracoTypeKey,
  computeRecommendation,
  RecommendationResult,
} from './recommendation/recommendation-engine';
import { DiagnosticAnswersDto } from './dto/diagnostic-answers.dto';

/**
 * US81 — Gerar equipe recomendada. Orquestra: lê disponibilidade oficial
 * do catálogo (nunca duplicada, §12) e chama o motor puro determinístico.
 */
@Injectable()
export class DiagnosticsService {
  constructor(private readonly employeeTypesService: EmployeeTypesService) {}

  async recommend(answers: DiagnosticAnswersDto): Promise<RecommendationResult> {
    // US80: "Exatamente uma prioridade principal", escolhida "somente
    // entre necessidades previamente selecionadas" — o backend não confia
    // que o cliente respeitou essa regra.
    if (!answers.needs.includes(answers.priority)) {
      throw new BadRequestException('A prioridade precisa ser uma das necessidades selecionadas.');
    }

    const types = await this.employeeTypesService.findAll();
    const availabilityByType: AvailabilityByType = {};
    for (const type of types) {
      availabilityByType[type.key as BracoTypeKey] = type.availability;
    }

    return computeRecommendation({ needs: answers.needs, priority: answers.priority }, availabilityByType);
  }
}
