import { Link } from 'react-router-dom';
import type { EmployeeType } from '../api/client';
import { Button } from './Button';
import { Card } from './Card';
import { CatalogAvailabilityLabel } from './CatalogAvailabilityLabel';
import './EmployeeTypeCard.css';

/**
 * Employee Card do catálogo de contratação (Catalog Availability) —
 * docs/design/18-catalog-availability-ui-spec.md §4/§7/§8.
 *
 * Anatomia: identidade → nome → função → label de disponibilidade →
 * missão → resultado → até 3 responsabilidades → ações.
 */
export function EmployeeTypeCard({
  employeeType,
  onHire,
  hiring,
}: {
  employeeType: EmployeeType;
  onHire?: (employeeType: EmployeeType) => void;
  hiring?: boolean;
}) {
  const isAvailable = employeeType.availability === 'AVAILABLE';

  return (
    <Card className="braco-employee-type-card">
      <div className="braco-employee-type-card__header">
        <span className="braco-employee-type-card__icon" aria-hidden="true">
          {employeeType.name.charAt(employeeType.name.indexOf(' ') + 1) || employeeType.name.charAt(0)}
        </span>
        <div>
          <h3 className="braco-employee-type-card__name">{employeeType.name}</h3>
          <p className="braco-employee-type-card__role">{employeeType.role}</p>
        </div>
        <CatalogAvailabilityLabel availability={employeeType.availability} />
      </div>

      <p className="braco-employee-type-card__mission">{employeeType.mission}</p>

      <div className="braco-employee-type-card__result">
        <span className="braco-employee-type-card__result-label">Resultado</span>
        <p>{employeeType.expectedResult}</p>
      </div>

      <ul className="braco-employee-type-card__responsibilities">
        {employeeType.responsibilities.slice(0, 3).map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>

      <div className="braco-employee-type-card__actions">
        <Link to={`/equipe/contratar/${employeeType.id}`}>
          <Button variant="text">Ver detalhes</Button>
        </Link>
        {isAvailable && onHire && (
          <Button
            variant="filled"
            disabled={hiring}
            onClick={() => onHire(employeeType)}
          >
            {hiring ? 'Contratando…' : 'Contratar funcionário'}
          </Button>
        )}
      </div>
    </Card>
  );
}
