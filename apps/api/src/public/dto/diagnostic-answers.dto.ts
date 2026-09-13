import { ArrayMaxSize, ArrayMinSize, ArrayUnique, IsIn, IsString } from 'class-validator';
import { NeedKey } from '../recommendation/recommendation-engine';

/** US79/US80/US81 — respostas do diagnóstico público. Sem PII. */
const NEED_KEYS: NeedKey[] = [
  'responder_duvidas',
  'organizar_agendamentos',
  'acompanhar_leads',
  'criar_orcamentos',
  'manter_contato_pos_venda',
  'cobrar_pagamentos',
  'follow_up_sumidos',
];

export class DiagnosticAnswersDto {
  @IsString({ each: true })
  @ArrayMinSize(1) // US79: "Não é possível avançar sem pelo menos uma necessidade."
  @ArrayMaxSize(NEED_KEYS.length)
  @ArrayUnique()
  @IsIn(NEED_KEYS, { each: true })
  needs!: NeedKey[];

  @IsIn(NEED_KEYS) // US80: "Exatamente uma prioridade principal é escolhida."
  priority!: NeedKey;
}
