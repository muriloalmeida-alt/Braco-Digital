import { useState } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { ApiError, api, type ManualOverview, type StepKey } from '../../api/client';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { STEP_DEFS } from './steps';

/** US15/US16 — Revisão. docs/design/22-work-manual-content-model.md §12. */
export function ReviewStep({
  employeeId,
  employeeName,
  overview,
  onEditStep,
  onRefresh,
  onCompleted,
}: {
  employeeId: string;
  employeeName: string;
  overview: ManualOverview;
  onEditStep: (step: StepKey) => void;
  onRefresh: () => Promise<ManualOverview | undefined>;
  onCompleted: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (overview.review === 'concluida' || success) {
    return (
      <Card>
        <CheckCircle2 size={28} aria-hidden="true" style={{ color: 'var(--md-ext-color-success)' }} />
        <h1 className="braco-page-title">Preparação concluída</h1>
        <p>{employeeName} está Pronto para a próxima etapa.</p>
        <div className="braco-prep__actions">
          <Button onClick={onCompleted}>Voltar para o funcionário</Button>
        </div>
      </Card>
    );
  }

  async function handleComplete() {
    setError(null);
    try {
      await api.completePreparation(employeeId);
      setSuccess(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        await onRefresh();
        setError('Algumas etapas ainda estão pendentes — verifique a lista abaixo.');
      } else {
        setError(err instanceof ApiError ? err.message : 'Não foi possível concluir a preparação.');
      }
      setConfirming(false);
    }
  }

  return (
    <div>
      <h1 className="braco-page-title">Revisar Manual de Trabalho</h1>
      <p className="braco-prep__progress">
        {overview.completedCount} de {overview.totalSteps} etapas completas
      </p>

      {STEP_DEFS.map((s) => {
        const stepStatus = overview.steps[s.key];
        const isComplete = stepStatus === 'complete';
        return (
          <div key={s.key} className="braco-prep__review-item">
            <span>
              {isComplete ? '✓' : '!'} {s.label}
              {!isComplete && (
                <span className="braco-prep__pending-reason">
                  {' '}
                  — <AlertCircle size={14} aria-hidden="true" style={{ verticalAlign: 'middle' }} /> etapa incompleta
                </span>
              )}
            </span>
            <Button variant={isComplete ? 'text' : 'outlined'} onClick={() => onEditStep(s.key)}>
              {isComplete ? 'Revisar' : 'Corrigir'}
            </Button>
          </div>
        );
      })}

      {error && <p className="braco-prep__field-error">{error}</p>}

      {!confirming ? (
        <div className="braco-prep__actions">
          <Button onClick={() => setConfirming(true)} disabled={overview.review !== 'disponivel'}>
            Concluir preparação
          </Button>
        </div>
      ) : (
        <Card style={{ marginTop: 16 }}>
          <p>
            <strong>Concluir preparação de {employeeName}?</strong>
          </p>
          <p>
            O Manual de Trabalho está completo. {employeeName} ficará <strong>Pronto para ativação</strong>, mas
            ainda não começará a trabalhar.
          </p>
          <div className="braco-prep__actions">
            <Button variant="outlined" onClick={() => setConfirming(false)}>
              Voltar e revisar
            </Button>
            <Button onClick={handleComplete}>Concluir preparação</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
