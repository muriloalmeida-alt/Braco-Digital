import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api, ApiError, type EmployeeType } from '../api/client';
import { EmployeeTypeCard } from '../components/EmployeeTypeCard';
import { Button } from '../components/Button';
import './CatalogPage.css';

type LoadState = 'loading' | 'loaded' | 'error';

/**
 * US01 — Visualizar funcionários disponíveis.
 * docs/design/flows/01-hiring.md, docs/design/18-catalog-availability-ui-spec.md.
 */
export function CatalogPage() {
  const navigate = useNavigate();
  const [types, setTypes] = useState<EmployeeType[]>([]);
  const [state, setState] = useState<LoadState>('loading');
  const [hiringId, setHiringId] = useState<string | null>(null);
  const [hireError, setHireError] = useState<string | null>(null);

  function load() {
    setState('loading');
    api
      .listEmployeeTypes()
      .then((data) => {
        setTypes(data);
        setState('loaded');
      })
      .catch(() => setState('error'));
  }

  useEffect(load, []);

  async function handleHire(employeeType: EmployeeType) {
    setHireError(null);
    setHiringId(employeeType.id);
    try {
      const idempotencyKey = crypto.randomUUID();
      const employee = await api.hireEmployee(employeeType.id, idempotencyKey);
      navigate(`/equipe/${employee.id}`);
    } catch (err) {
      setHireError(
        err instanceof ApiError
          ? err.message
          : 'Não foi possível concluir a contratação. Tente novamente.',
      );
    } finally {
      setHiringId(null);
    }
  }

  return (
    <div className="braco-catalog-page">
      <h1 className="braco-page-title">Conhecer funcionários</h1>
      <p className="braco-page-subtitle">
        Escolha um funcionário digital para contratar. Os demais estão a caminho.
      </p>

      {hireError && (
        <p role="alert" className="braco-catalog-page__hire-error">
          {hireError}
        </p>
      )}

      {state === 'loading' && <p>Carregando funcionários…</p>}

      {state === 'error' && (
        <div className="braco-catalog-page__error">
          <AlertCircle size={24} aria-hidden="true" className="braco-catalog-page__error-icon" />
          <p>Não foi possível carregar os funcionários.</p>
          <p>Tente novamente. Se o problema continuar, volte mais tarde.</p>
          <Button variant="outlined" onClick={load}>
            Tentar novamente
          </Button>
        </div>
      )}

      {state === 'loaded' && (
        <div className="braco-catalog-page__grid">
          {types.map((t) => (
            <EmployeeTypeCard
              key={t.id}
              employeeType={t}
              onHire={handleHire}
              hiring={hiringId === t.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
