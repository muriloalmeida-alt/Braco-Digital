import { useNavigate } from 'react-router-dom';
import type { EmployeeType } from '../../api/client';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { CatalogAvailabilityLabel } from '../../components/CatalogAvailabilityLabel';
import { getBracoIcon } from './braco-icons';

/**
 * Card de Braço para a landing pública — mesma anatomia de
 * `EmployeeTypeCard` (ícone → nome → função → disponibilidade →
 * missão → até 3 capacidades → ação), mas deliberadamente um
 * componente à parte: `EmployeeTypeCard` linka para `/equipe/contratar/
 * :id` e oferece "Contratar" (rotas autenticadas, `ProtectedRoute`),
 * o que redirecionaria um visitante anônimo para o login — errado
 * neste contexto. Aqui a única ação (quando Disponível) leva ao
 * diagnóstico público (`/monte-sua-equipe`), nunca à contratação direta
 * (docs/design/26-growth-landing-experience.md §8: onboarding público
 * self-service não existe nesta fase).
 */
export function BracoPortfolioCard({ employeeType }: { employeeType: EmployeeType }) {
  const navigate = useNavigate();
  const Icon = getBracoIcon(employeeType.key);
  const isAvailable = employeeType.availability === 'AVAILABLE';

  return (
    <Card className="braco-growth-portfolio-card">
      <div className="braco-growth-portfolio-card__header">
        <span className="braco-growth-portfolio-card__icon" aria-hidden="true">
          <Icon size={22} />
        </span>
        <div className="braco-growth-portfolio-card__heading">
          <h3>{employeeType.name}</h3>
          <p className="braco-growth-portfolio-card__role">{employeeType.role}</p>
        </div>
        <CatalogAvailabilityLabel availability={employeeType.availability} />
      </div>

      <p className="braco-growth-portfolio-card__mission">{employeeType.mission}</p>

      <ul className="braco-growth-portfolio-card__capabilities">
        {employeeType.responsibilities.slice(0, 3).map((responsibility) => (
          <li key={responsibility}>{responsibility}</li>
        ))}
      </ul>

      {isAvailable && (
        <Button
          variant="text"
          className="braco-growth-portfolio-card__action"
          onClick={() => navigate('/monte-sua-equipe')}
        >
          Montar minha equipe com esse Braço
        </Button>
      )}
    </Card>
  );
}
