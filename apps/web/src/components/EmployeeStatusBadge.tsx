import type { EmployeeStatus } from '../api/client';
import './EmployeeStatusBadge.css';

/**
 * Employee Status — docs/design/09-product-patterns.md §2,
 * docs/design/12-status-and-states.md.
 *
 * Conceito SEPARADO de Catalog Availability (ver
 * CatalogAvailabilityLabel.tsx). Só existe para um funcionário já
 * contratado (Minha Equipe), nunca no catálogo de contratação.
 */
const LABELS: Record<EmployeeStatus, string> = {
  CONTRATADO: 'Contratado',
  PREPARANDO: 'Preparando',
  PRONTO: 'Pronto',
  TRABALHANDO: 'Trabalhando',
  PAUSADO: 'Pausado',
  PRECISA_DE_ATENCAO: 'Precisa de atenção',
  DESATIVADO: 'Desativado',
};

const TONE: Record<EmployeeStatus, 'neutral' | 'success' | 'attention'> = {
  CONTRATADO: 'neutral',
  PREPARANDO: 'neutral',
  PRONTO: 'success',
  TRABALHANDO: 'success',
  PAUSADO: 'neutral',
  PRECISA_DE_ATENCAO: 'attention',
  DESATIVADO: 'neutral',
};

export function EmployeeStatusBadge({ status }: { status: EmployeeStatus }) {
  // Status nunca depende só de cor (docs/design/12-status-and-states.md §2)
  // — por isso o texto completo está sempre presente, cor é só reforço.
  return <span className={`braco-status-badge braco-status-badge--${TONE[status]}`}>{LABELS[status]}</span>;
}
