import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, Circle, Lock } from 'lucide-react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api, type DigitalEmployee, type ManualOverview, type StepKey } from '../api/client';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { EmployeeStatusBadge } from '../components/EmployeeStatusBadge';
import { STEP_DEFS, STEP_STATUS_LABEL } from './preparation/steps';
import { EmpresaStep } from './preparation/EmpresaStep';
import { ProdutosStep } from './preparation/ProdutosStep';
import { ResponsabilidadesStep } from './preparation/ResponsabilidadesStep';
import { RegrasStep } from './preparation/RegrasStep';
import { AutonomiaStep } from './preparation/AutonomiaStep';
import { PessoasStep } from './preparation/PessoasStep';
import { ComunicacaoStep } from './preparation/ComunicacaoStep';
import { RecursosStep } from './preparation/RecursosStep';
import { ReviewStep } from './preparation/ReviewStep';
import './preparation/PreparationLayout.css';

/**
 * US06 (Sprint 01) + US07-US17 (Sprint 02) — Preparação do Funcionário.
 * docs/design/23-preparation-experience-spec.md, docs/design/25-sprint-
 * 02-wireframes.md.
 *
 * Padrão de navegação: `?etapa=<key>` na URL. Sem etapa selecionada,
 * mostra o Overview (lista + próximo passo). Com etapa selecionada,
 * mostra o formulário daquela etapa — em Expanded, ao lado da lista
 * (list-detail); em Compact/Medium, substituindo a lista (uma etapa por
 * vez).
 */
export function PreparationOverviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeStep = searchParams.get('etapa') as StepKey | 'revisao' | null;

  const [employee, setEmployee] = useState<DigitalEmployee | null>(null);
  const [overview, setOverview] = useState<ManualOverview | null>(null);
  const [state, setState] = useState<'loading' | 'loaded' | 'error'>('loading');

  const refetchOverview = useCallback(async () => {
    if (!id) return;
    const data = await api.getManualOverview(id);
    setOverview(data);
    return data;
  }, [id]);

  useEffect(() => {
    if (!id) return;
    // Entrar na preparação é a própria ação de "iniciar" (idempotente —
    // chamar de novo não recria nem reseta o manual, US06/Sprint 01).
    api
      .startPreparation(id)
      .then(() => Promise.all([api.getDigitalEmployee(id), refetchOverview()]))
      .then(([emp]) => {
        setEmployee(emp);
        setState('loaded');
      })
      .catch(() => setState('error'));
  }, [id, refetchOverview]);

  function goToStep(step: StepKey | 'revisao' | null) {
    if (step) setSearchParams({ etapa: step });
    else setSearchParams({});
  }

  /** Chamado por cada etapa após autosave — mantém a navegação/progresso vivos. */
  async function handleStepSaved() {
    await refetchOverview();
  }

  /** "Continuar" — nunca confia em estado local; sempre revalida no backend. */
  async function handleContinue(step: StepKey) {
    const fresh = await refetchOverview();
    if (!fresh) return;
    if (fresh.steps[step] === 'complete') {
      const currentIndex = STEP_DEFS.findIndex((s) => s.key === step);
      const next = STEP_DEFS[currentIndex + 1];
      goToStep(next ? next.key : 'revisao');
    }
    // Se ainda não está completa, permanece na etapa — o próprio
    // formulário já mostra os erros de validação junto aos campos.
  }

  if (state === 'loading') return <p>Carregando…</p>;
  if (state === 'error' || !employee || !overview || !id) {
    return <p>Não foi possível carregar a preparação deste funcionário.</p>;
  }

  if (activeStep && activeStep !== 'revisao') {
    const stepDef = STEP_DEFS.find((s) => s.key === activeStep);
    if (!stepDef) return <p>Etapa desconhecida.</p>;
    return (
      <div className="braco-prep">
        <div className="braco-prep__body">
          <StepNav overview={overview} activeStep={activeStep} onSelect={goToStep} withDetail />
          <StepDetail
            employeeId={id}
            employeeName={employee.name}
            step={activeStep}
            onBack={() => goToStep(null)}
            onSaved={handleStepSaved}
            onContinue={() => handleContinue(activeStep)}
          />
        </div>
      </div>
    );
  }

  if (activeStep === 'revisao') {
    return (
      <div className="braco-prep">
        <Link to={`/equipe/${id}`} className="braco-prep__back">
          <ArrowLeft size={16} aria-hidden="true" /> {employee.name}
        </Link>
        <ReviewStep
          employeeId={id}
          employeeName={employee.name}
          overview={overview}
          onEditStep={(step) => goToStep(step)}
          onRefresh={refetchOverview}
          onCompleted={() => navigate(`/equipe/${id}`)}
        />
      </div>
    );
  }

  const nextPending = STEP_DEFS.find((s) => overview.steps[s.key] !== 'complete');

  return (
    <div className="braco-prep">
      <Link to={`/equipe/${id}`} className="braco-prep__back">
        <ArrowLeft size={16} aria-hidden="true" /> Funcionário
      </Link>

      <div className="braco-prep__header">
        <div>
          <h1 className="braco-page-title">Preparar {employee.name}</h1>
          <EmployeeStatusBadge status={overview.employeeStatus} />
          <p className="braco-prep__progress">
            <strong className="braco-numeric">{overview.completedCount}</strong> de{' '}
            <strong className="braco-numeric">{overview.totalSteps}</strong> etapas completas
          </p>
        </div>
      </div>

      <div className="braco-prep__body">
        <StepNav overview={overview} activeStep={null} onSelect={goToStep} />

        <div>
          {nextPending ? (
            <Card className="braco-prep__next-card">
              <h2>Próximo item recomendado</h2>
              <p>{STEP_DEFS.find((s) => s.key === nextPending.key)?.label}</p>
              <Button onClick={() => goToStep(nextPending.key)}>Continuar preparação</Button>
            </Card>
          ) : (
            <Card className="braco-prep__next-card">
              <h2>Seu Manual está pronto para revisão</h2>
              <Button onClick={() => goToStep('revisao')}>Revisar Manual</Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function StepNav({
  overview,
  activeStep,
  onSelect,
  withDetail,
}: {
  overview: ManualOverview;
  activeStep: StepKey | null;
  onSelect: (step: StepKey | 'revisao') => void;
  withDetail?: boolean;
}) {
  return (
    <nav className={`braco-prep__nav ${withDetail ? 'braco-prep__nav--with-detail' : ''}`} aria-label="Etapas da preparação">
      {STEP_DEFS.map((s) => {
        const status = overview.steps[s.key];
        return (
          <button
            key={s.key}
            type="button"
            className={`braco-prep__nav-item ${activeStep === s.key ? 'is-active' : ''}`}
            onClick={() => onSelect(s.key)}
            style={{ textAlign: 'left', cursor: 'pointer' }}
          >
            <span>{s.label}</span>
            <span className={`braco-prep__nav-status ${status === 'complete' ? 'braco-prep__nav-status--complete' : ''}`}>
              {status === 'complete' ? (
                <CheckCircle2 size={16} aria-hidden="true" />
              ) : (
                <Circle size={16} aria-hidden="true" />
              )}
              {STEP_STATUS_LABEL[status]}
            </span>
          </button>
        );
      })}
      <button
        type="button"
        className="braco-prep__nav-item braco-prep__nav-item--review"
        onClick={() => onSelect('revisao')}
      >
        <span>Revisão</span>
        <span className="braco-prep__nav-status">
          {overview.review === 'bloqueada' && <Lock size={16} aria-hidden="true" />}
          {overview.review === 'bloqueada' && 'Bloqueada'}
          {overview.review === 'disponivel' && 'Disponível'}
          {overview.review === 'concluida' && 'Concluída'}
        </span>
      </button>
    </nav>
  );
}

function StepDetail({
  employeeId,
  employeeName,
  step,
  onBack,
  onSaved,
  onContinue,
}: {
  employeeId: string;
  employeeName: string;
  step: StepKey;
  onBack: () => void;
  onSaved: () => Promise<void>;
  onContinue: () => Promise<void>;
}) {
  const stepDef = STEP_DEFS.find((s) => s.key === step)!;
  return (
    <div>
      <Link to="#" onClick={(e) => { e.preventDefault(); onBack(); }} className="braco-prep__back">
        <ArrowLeft size={16} aria-hidden="true" /> Etapas da preparação
      </Link>
      <div className="braco-prep__step-header">
        <h1 className="braco-page-title">{stepDef.label}</h1>
      </div>
      {step === 'empresa' && <EmpresaStep onSaved={onSaved} onContinue={onContinue} />}
      {step === 'produtos_servicos' && <ProdutosStep onSaved={onSaved} onContinue={onContinue} />}
      {step === 'responsabilidades' && (
        <ResponsabilidadesStep employeeId={employeeId} onSaved={onSaved} onContinue={onContinue} />
      )}
      {step === 'regras_limites' && <RegrasStep employeeId={employeeId} onSaved={onSaved} onContinue={onContinue} />}
      {step === 'autonomia' && <AutonomiaStep employeeId={employeeId} onSaved={onSaved} onContinue={onContinue} />}
      {step === 'pessoas_responsaveis' && (
        <PessoasStep employeeId={employeeId} onSaved={onSaved} onContinue={onContinue} />
      )}
      {step === 'comunicacao' && (
        <ComunicacaoStep employeeId={employeeId} employeeName={employeeName} onSaved={onSaved} onContinue={onContinue} />
      )}
      {step === 'recursos_trabalho' && (
        <RecursosStep employeeId={employeeId} onSaved={onSaved} onContinue={onContinue} />
      )}
    </div>
  );
}
