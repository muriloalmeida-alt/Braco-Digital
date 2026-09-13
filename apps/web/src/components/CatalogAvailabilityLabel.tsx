import type { EmployeeType } from '../api/client';
import './CatalogAvailabilityLabel.css';

/**
 * Catalog Availability — docs/design/18-catalog-availability-ui-spec.md.
 *
 * Conceito SEPARADO de Employee Status (ver EmployeeStatusBadge.tsx).
 * "Em breve" é informação, não incapacidade da interface: label estático,
 * não interativo, sem semântica de erro/warning/disabled.
 */
export function CatalogAvailabilityLabel({
  availability,
}: {
  availability: EmployeeType['availability'];
}) {
  const isAvailable = availability === 'AVAILABLE';
  return (
    <span
      className={`braco-availability-label ${
        isAvailable ? 'braco-availability-label--available' : 'braco-availability-label--coming-soon'
      }`}
    >
      {isAvailable ? 'Disponível' : 'Em breve'}
    </span>
  );
}
