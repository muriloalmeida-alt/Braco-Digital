import { Type } from 'class-transformer';
import { IsEmail, IsIn, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { DiagnosticAnswersDto } from './diagnostic-answers.dto';

const TEAM_SIZES = ['SO_EU', 'DE_2_A_5', 'DE_6_A_20', 'DE_21_A_50', 'MAIS_DE_50'] as const;
const VOLUMES = ['ATE_10', 'DE_11_A_30', 'DE_31_A_100', 'MAIS_DE_100', 'NAO_SEI_DIZER'] as const;

/**
 * US83 — Registrar lead interessado.
 *
 * Não recebe `ranking`/`ruleVersion` do cliente: o backend recalcula a
 * recomendação a partir de `answers` no momento do envio — nunca confia
 * num ranking vindo do corpo da requisição (mesmo princípio de
 * autoridade de backend usado em Track A, §10 do tech readiness).
 */
export class CreateLeadDto {
  @IsString()
  @MaxLength(200)
  name!: string;

  @IsString()
  @MaxLength(200)
  companyName!: string;

  @IsString()
  @MaxLength(30)
  whatsapp!: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(200)
  email?: string;

  @IsString()
  @MaxLength(100)
  segment!: string;

  @IsIn(TEAM_SIZES)
  teamSize!: (typeof TEAM_SIZES)[number];

  @IsIn(VOLUMES)
  volume!: (typeof VOLUMES)[number];

  @ValidateNested()
  @Type(() => DiagnosticAnswersDto)
  answers!: DiagnosticAnswersDto;

  /** Correlaciona com o funil de analytics (TD17) — nunca ligado a PII lá. */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sessionId?: string;
}

export { TEAM_SIZES, VOLUMES };
