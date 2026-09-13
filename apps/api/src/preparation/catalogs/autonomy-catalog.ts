import { AutonomyLevel } from '@prisma/client';

/**
 * US11 — Autonomia. PD7 (RESOLVED, docs/technical/16-product-decisions-
 * required.md): recomendação inicial e teto máximo são propriedades
 * distintas, mesmo que coincidam para o Braço Atendimento v1. Tabela
 * oficial: docs/design/22-work-manual-content-model.md §8.
 *
 * `RANK` codifica a ordem de permissividade (maior = mais permissivo):
 * PODE_DECIDIR (2) > PODE_DECIDIR_SOB_REGRAS (1) > PRECISA_HUMANO (0).
 * "Gestor pode escolher o teto ou qualquer nível mais conservador" ==
 * `RANK[selected] <= RANK[ceiling]`.
 */
export const AUTONOMY_RANK: Record<AutonomyLevel, number> = {
  PODE_DECIDIR: 2,
  PODE_DECIDIR_SOB_REGRAS: 1,
  PRECISA_HUMANO: 0,
};

export function isWithinCeiling(selected: AutonomyLevel, ceiling: AutonomyLevel): boolean {
  return AUTONOMY_RANK[selected] <= AUTONOMY_RANK[ceiling];
}

export interface AutonomyDefaults {
  responsibilityKey: string;
  recommended: AutonomyLevel;
  ceiling: AutonomyLevel;
}

const { PODE_DECIDIR, PODE_DECIDIR_SOB_REGRAS } = AutonomyLevel;

/** Tabela oficial — docs/design/22-work-manual-content-model.md §8. */
export const ATENDIMENTO_AUTONOMY_DEFAULTS: AutonomyDefaults[] = [
  { responsibilityKey: 'receber_clientes', recommended: PODE_DECIDIR, ceiling: PODE_DECIDIR },
  { responsibilityKey: 'identificar_necessidade', recommended: PODE_DECIDIR, ceiling: PODE_DECIDIR },
  { responsibilityKey: 'encaminhar_humano', recommended: PODE_DECIDIR, ceiling: PODE_DECIDIR },
  { responsibilityKey: 'responder_duvidas', recommended: PODE_DECIDIR, ceiling: PODE_DECIDIR },
  { responsibilityKey: 'explicar_produtos_servicos', recommended: PODE_DECIDIR, ceiling: PODE_DECIDIR },
  { responsibilityKey: 'informar_precos', recommended: PODE_DECIDIR, ceiling: PODE_DECIDIR },
  { responsibilityKey: 'agendar', recommended: PODE_DECIDIR, ceiling: PODE_DECIDIR },
  { responsibilityKey: 'confirmar_agendamento', recommended: PODE_DECIDIR, ceiling: PODE_DECIDIR },
  { responsibilityKey: 'reagendar', recommended: PODE_DECIDIR_SOB_REGRAS, ceiling: PODE_DECIDIR_SOB_REGRAS },
  { responsibilityKey: 'cancelar', recommended: PODE_DECIDIR_SOB_REGRAS, ceiling: PODE_DECIDIR_SOB_REGRAS },
  { responsibilityKey: 'fazer_follow_up', recommended: PODE_DECIDIR_SOB_REGRAS, ceiling: PODE_DECIDIR_SOB_REGRAS },
  { responsibilityKey: 'recuperar_contatos', recommended: PODE_DECIDIR_SOB_REGRAS, ceiling: PODE_DECIDIR_SOB_REGRAS },
  { responsibilityKey: 'enviar_lembretes', recommended: PODE_DECIDIR_SOB_REGRAS, ceiling: PODE_DECIDIR_SOB_REGRAS },
  { responsibilityKey: 'identificar_insatisfacao', recommended: PODE_DECIDIR, ceiling: PODE_DECIDIR },
];

const DEFAULTS_BY_TYPE: Record<string, AutonomyDefaults[]> = {
  atendimento: ATENDIMENTO_AUTONOMY_DEFAULTS,
};

export function getAutonomyDefaults(employeeTypeKey: string): AutonomyDefaults[] {
  return DEFAULTS_BY_TYPE[employeeTypeKey] ?? [];
}

export function getAutonomyDefault(
  employeeTypeKey: string,
  responsibilityKey: string,
): AutonomyDefaults | undefined {
  return getAutonomyDefaults(employeeTypeKey).find((d) => d.responsibilityKey === responsibilityKey);
}
