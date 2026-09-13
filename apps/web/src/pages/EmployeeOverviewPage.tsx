import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, type DigitalEmployee } from '../api/client';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { EmployeeStatusBadge } from '../components/EmployeeStatusBadge';
import './EmployeeOverviewPage.css';

/**
 * US04 — Visualizar funcionário contratado / US05 — Identificar próximo passo.
 * docs/design/flows/01-hiring.md.
 */
export function EmployeeOverviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<DigitalEmployee | null>(null);
  const [state, setState] = useState<'loading' | 'loaded' | 'error'>('loading');

  useEffect(() => {
    if (!id) return;
    api
      .getDigitalEmployee(id)
      .then((data) => {
        setEmployee(data);
        setState('loaded');
      })
      .catch(() => setState('error'));
  }, [id]);

  function handleNextStep() {
    if (!employee?.nextStep) return;
    if (employee.nextStep.action === 'start_preparation') {
      navigate(`/equipe/${employee.id}/preparar`);
    }
  }

  if (state === 'loading') return <p>Carregando…</p>;
  if (state === 'error' || !employee) return <p>Não foi possível carregar este funcionário.</p>;

  return (
    <div className="braco-employee-overview">
      <Link to="/equipe" className="braco-employee-overview__back">
        ← Minha Equipe
      </Link>

      <Card className="braco-employee-overview__card">
        <div className="braco-employee-overview__header">
          <div>
            <h1 className="braco-page-title">{employee.name}</h1>
            <p className="braco-page-subtitle">{employee.employeeType.role}</p>
          </div>
          <EmployeeStatusBadge status={employee.status} />
        </div>

        <p className="braco-employee-overview__hired-at">
          Contratado em {new Date(employee.hiredAt).toLocaleDateString('pt-BR')}
        </p>

        {employee.nextStep && (
          <div className="braco-employee-overview__next-step">
            <span>Próximo passo</span>
            <Button onClick={handleNextStep}>{employee.nextStep.label}</Button>
          </div>
        )}
      </Card>
    </div>
  );
}
