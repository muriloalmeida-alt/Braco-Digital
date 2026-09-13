import type { StepKey } from '../../api/client';

export interface StepDef {
  key: StepKey;
  label: string;
}

/** Ordem oficial — docs/design/22-work-manual-content-model.md §2. */
export const STEP_DEFS: StepDef[] = [
  { key: 'empresa', label: 'Empresa' },
  { key: 'produtos_servicos', label: 'Produtos e serviços' },
  { key: 'responsabilidades', label: 'Responsabilidades' },
  { key: 'regras_limites', label: 'Regras e limites' },
  { key: 'autonomia', label: 'Autonomia' },
  { key: 'pessoas_responsaveis', label: 'Pessoas e responsáveis' },
  { key: 'comunicacao', label: 'Comunicação' },
  { key: 'recursos_trabalho', label: 'Recursos de trabalho' },
];

export const STEP_STATUS_LABEL: Record<string, string> = {
  not_started: 'Não iniciada',
  in_progress: 'Em andamento',
  complete: 'Completa',
};
