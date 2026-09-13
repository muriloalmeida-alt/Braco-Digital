import { IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * US14 — usado para confirmar uma conexão após o retorno da autorização
 * externa (callback OAuth/BSP). Nesta sprint, sem credenciais reais de
 * BSP/Google provisionadas (docs/technical/20-sprint-02-tech-
 * readiness.md §24.2), este endpoint é o ponto de integração onde o
 * callback real vai plugar — ver `resources.controller.ts`.
 */
export class ConfirmIntegrationDto {
  @IsString()
  @MaxLength(200)
  externalAccountRef!: string;
}
