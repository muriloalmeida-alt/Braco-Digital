import { EmployeeStatus } from '@prisma/client';

export interface NextStep {
  label: string;
  action: string;
}

/**
 * US05 — Identificar próximo passo.
 *
 * Mapeamento status → próximo passo, implementado como tabela extensível
 * (não if/else pontual) porque só os dois primeiros status têm CTA
 * definida nesta sprint — os demais (Pronto, Trabalhando, Pausado, Precisa
 * de atenção, Desativado) ganham CTA a partir da Sprint 03 (Ativação) em
 * diante, sem exigir reescrever esta lógica.
 * Ver docs/technical/14-sprint-01-tech-readiness.md §6.
 */
const NEXT_STEP_MAP: Record<EmployeeStatus, NextStep | null> = {
  CONTRATADO: { label: 'Preparar funcionário', action: 'start_preparation' },
  PREPARANDO: { label: 'Preparar funcionário', action: 'start_preparation' },
  PRONTO: null,
  TRABALHANDO: null,
  PAUSADO: null,
  PRECISA_DE_ATENCAO: null,
  DESATIVADO: null,
};

export function resolveNextStep(status: EmployeeStatus): NextStep | null {
  return NEXT_STEP_MAP[status] ?? null;
}
