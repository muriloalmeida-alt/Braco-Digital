import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, ApiError, type EmployeeType } from '../api/client';
import { Button } from '../components/Button';
import { CatalogAvailabilityLabel } from '../components/CatalogAvailabilityLabel';
import './EmployeeTypeDetailPage.css';

type LoadState = 'loading' | 'loaded' | 'not_found' | 'error';

/**
 * US02 — Visualizar detalhes do funcionário.
 * docs/design/flows/01-hiring.md, docs/design/18-catalog-availability-ui-spec.md §9-10.
 */
export function EmployeeTypeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [employeeType, setEmployeeType] = useState<EmployeeType | null>(null);
  const [state, setState] = useState<LoadState>('loading');
  const [hiring, setHiring] = useState(false);
  const [hireError, setHireError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setState('loading');
    api
      .getEmployeeType(id)
      .then((data) => {
        setEmployeeType(data);
        setState('loaded');
      })
      .catch((err) => setState(err instanceof ApiError && err.status === 404 ? 'not_found' : 'error'));
  }, [id]);

  async function handleHire() {
    if (!employeeType) return;
    setHireError(null);
    setHiring(true);
    try {
      const employee = await api.hireEmployee(employeeType.id, crypto.randomUUID());
      navigate(`/equipe/${employee.id}`);
    } catch (err) {
      setHireError(err instanceof ApiError ? err.message : 'Não foi possível concluir a contratação.');
    } finally {
      setHiring(false);
    }
  }

  if (state === 'loading') return <p>Carregando…</p>;
  if (state === 'not_found') return <p>Funcionário não encontrado.</p>;
  if (state === 'error' || !employeeType) return <p>Não foi possível carregar este funcionário.</p>;

  const isAvailable = employeeType.availability === 'AVAILABLE';

  return (
    <div className="braco-employee-detail">
      <Link to="/equipe/contratar" className="braco-employee-detail__back">
        <ArrowLeft size={16} aria-hidden="true" /> Voltar para catálogo
      </Link>

      <div className="braco-employee-detail__header">
        <div>
          <h1 className="braco-page-title">{employeeType.name}</h1>
          <p className="braco-page-subtitle">{employeeType.role}</p>
        </div>
        <CatalogAvailabilityLabel availability={employeeType.availability} />
      </div>

      <section>
        <h2>Missão</h2>
        <p>{employeeType.mission}</p>
      </section>

      <section>
        <h2>Resultado esperado</h2>
        <p>{employeeType.expectedResult}</p>
      </section>

      <section>
        <h2>O que faz</h2>
        <ul>
          {employeeType.responsibilities.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </section>

      {!isAvailable && (
        <div className="braco-employee-detail__coming-soon">
          Este funcionário ainda não está disponível para contratação.
        </div>
      )}

      {hireError && (
        <p role="alert" className="braco-employee-detail__error">
          {hireError}
        </p>
      )}

      <div className="braco-employee-detail__actions">
        {isAvailable ? (
          <Button onClick={handleHire} disabled={hiring}>
            {hiring ? 'Contratando…' : 'Contratar funcionário'}
          </Button>
        ) : (
          <Link to="/equipe/contratar">
            <Button variant="outlined">Voltar para catálogo</Button>
          </Link>
        )}
      </div>
    </div>
  );
}
