import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type DigitalEmployee } from '../api/client';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { EmployeeStatusBadge } from '../components/EmployeeStatusBadge';
import './MyTeamPage.css';

type LoadState = 'loading' | 'loaded' | 'error';

/**
 * US53 — Visualizar equipe / US54 — Visualizar status.
 * docs/design/10-information-architecture.md, docs/design/12-status-and-states.md §4.
 *
 * Mostra apenas funcionários já contratados (Employee Status) — nunca o
 * catálogo de contratação (Catalog Availability, US01).
 */
export function MyTeamPage() {
  const [employees, setEmployees] = useState<DigitalEmployee[]>([]);
  const [state, setState] = useState<LoadState>('loading');

  useEffect(() => {
    api
      .listDigitalEmployees()
      .then((data) => {
        setEmployees(data);
        setState('loaded');
      })
      .catch(() => setState('error'));
  }, []);

  return (
    <div className="braco-my-team-page">
      <div className="braco-my-team-page__header">
        <div>
          <h1 className="braco-page-title">Minha Equipe</h1>
          <p className="braco-page-subtitle">Como está sua equipe digital?</p>
        </div>
        <Link to="/equipe/contratar">
          <Button>Contratar funcionário</Button>
        </Link>
      </div>

      {state === 'loading' && <p>Carregando equipe…</p>}
      {state === 'error' && <p>Não foi possível carregar sua equipe. Tente novamente.</p>}

      {state === 'loaded' && employees.length === 0 && (
        <Card className="braco-my-team-page__empty">
          <p>Sua equipe digital ainda está vazia. Contrate seu primeiro funcionário para começar.</p>
          <Link to="/equipe/contratar">
            <Button>Conhecer funcionários</Button>
          </Link>
        </Card>
      )}

      {state === 'loaded' && employees.length > 0 && (
        <div className="braco-my-team-page__grid">
          {employees.map((e) => (
            <Link key={e.id} to={`/equipe/${e.id}`} className="braco-my-team-page__card-link">
              <Card className="braco-my-team-page__card">
                <div className="braco-my-team-page__card-header">
                  <h3>{e.name}</h3>
                  <EmployeeStatusBadge status={e.status} />
                </div>
                <p className="braco-my-team-page__role">{e.employeeType.role}</p>
                {e.nextStep && (
                  <p className="braco-my-team-page__next-step">
                    Próximo passo: <strong>{e.nextStep.label}</strong>
                  </p>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
