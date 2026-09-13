/**
 * Estrutura de seções do Manual de Trabalho — docs/design/flows/02-preparation.md.
 *
 * US06 (Sprint 01) só precisa exibir esta estrutura com estado inicial
 * "not_started". O preenchimento de conteúdo de cada seção é US07-US15
 * (Sprint 02) e não é modelado ainda — nenhuma dessas seções tem schema
 * próprio nesta fase.
 */
export interface WorkManualSection {
  key: string;
  label: string;
  status: 'not_started' | 'in_progress' | 'complete';
}

export const WORK_MANUAL_SECTION_DEFINITIONS: Array<{ key: string; label: string }> = [
  { key: 'empresa', label: 'Empresa' },
  { key: 'produtos_servicos', label: 'Produtos e serviços' },
  { key: 'responsabilidades', label: 'Responsabilidades' },
  { key: 'regras_limites', label: 'Regras e limites' },
  { key: 'autonomia', label: 'Autonomia' },
  { key: 'pessoas_responsaveis', label: 'Pessoas e responsáveis' },
  { key: 'comunicacao', label: 'Comunicação' },
  { key: 'recursos_trabalho', label: 'Recursos de trabalho' },
  { key: 'revisao', label: 'Revisão' },
];

export function buildInitialSections(): WorkManualSection[] {
  return WORK_MANUAL_SECTION_DEFINITIONS.map((s) => ({
    key: s.key,
    label: s.label,
    status: 'not_started',
  }));
}
