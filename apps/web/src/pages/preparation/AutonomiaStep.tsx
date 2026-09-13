import { useEffect, useState } from 'react';
import { ApiError } from '../../api/client';
import { preparationApi, type AutonomyItem, type AutonomyLevel } from '../../api/preparation';
import { AutosaveIndicator } from '../../components/AutosaveIndicator';
import { Button } from '../../components/Button';
import { useAutosave } from '../../hooks/useAutosave';

const LEVEL_LABEL: Record<AutonomyLevel, string> = {
  PODE_DECIDIR: '🟢 Pode decidir',
  PODE_DECIDIR_SOB_REGRAS: '🟡 Pode decidir sob regras',
  PRECISA_HUMANO: '🔴 Precisa de humano',
};

const RANK: Record<AutonomyLevel, number> = {
  PODE_DECIDIR: 2,
  PODE_DECIDIR_SOB_REGRAS: 1,
  PRECISA_HUMANO: 0,
};

const LEVELS: AutonomyLevel[] = ['PODE_DECIDIR', 'PODE_DECIDIR_SOB_REGRAS', 'PRECISA_HUMANO'];

/**
 * US11 — Autonomia. PD7 (RESOLVED): recomendação e teto são propriedades
 * distintas — docs/design/22-work-manual-content-model.md §8. O backend
 * (TD14) é quem de fato barra um valor acima do teto; esta UI só evita
 * que o gestor tente selecionar algo que sabemos de antemão que será
 * rejeitado.
 */
export function AutonomiaStep({
  employeeId,
  onSaved,
  onContinue,
}: {
  employeeId: string;
  onSaved: () => Promise<void>;
  onContinue: () => Promise<void>;
}) {
  const [items, setItems] = useState<AutonomyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);

  const { status, error, trigger, retry } = useAutosave(async (value: AutonomyItem[]) => {
    setServerError(null);
    try {
      await preparationApi.updateAutonomy(
        employeeId,
        value
          .filter((i) => i.level)
          .map((i) => ({ responsibilityKey: i.responsibilityKey, level: i.level as AutonomyLevel, condition: i.condition ?? undefined })),
      );
      await onSaved();
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : 'Não foi possível salvar.');
      throw err;
    }
  });

  useEffect(() => {
    preparationApi.getAutonomy(employeeId).then((data) => {
      setItems(data);
      setLoading(false);
    });
  }, [employeeId]);

  function setLevel(key: string, level: AutonomyLevel) {
    const next = items.map((i) => (i.responsibilityKey === key ? { ...i, level } : i));
    setItems(next);
    trigger(next);
  }

  function setCondition(key: string, condition: string) {
    const next = items.map((i) => (i.responsibilityKey === key ? { ...i, condition } : i));
    setItems(next);
    trigger(next);
  }

  if (loading) return <p>Carregando…</p>;

  return (
    <div>
      {items.map((item) => (
        <div key={item.responsibilityKey} className="braco-prep__field" style={{ borderBottom: '1px solid var(--md-sys-color-outline-variant)', paddingBottom: 12 }}>
          <strong>{item.label}</strong>
          {item.recommended && <p>Recomendado: {LEVEL_LABEL[item.recommended]}</p>}
          <div className="braco-prep__radio-group" role="radiogroup" aria-label={`Autonomia — ${item.label}`}>
            {LEVELS.map((level) => {
              const disabled = item.ceiling ? RANK[level] > RANK[item.ceiling] : false;
              return (
                <div key={level}>
                  <label className="braco-prep__radio-option" style={disabled ? { opacity: 0.5 } : undefined}>
                    <input
                      type="radio"
                      name={`autonomy-${item.responsibilityKey}`}
                      checked={item.level === level}
                      disabled={disabled}
                      onChange={() => setLevel(item.responsibilityKey, level)}
                    />
                    {LEVEL_LABEL[level]}
                  </label>
                  {disabled && (
                    <p className="braco-prep__field-error">
                      Este nível de autonomia não está disponível para esta responsabilidade.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          {item.level === 'PODE_DECIDIR_SOB_REGRAS' && (
            <div className="braco-prep__field">
              <label htmlFor={`cond-${item.responsibilityKey}`}>Condição *</label>
              <input
                id={`cond-${item.responsibilityKey}`}
                type="text"
                value={item.condition ?? ''}
                onChange={(e) => setCondition(item.responsibilityKey, e.target.value)}
              />
            </div>
          )}
        </div>
      ))}

      {serverError && <p className="braco-prep__field-error">{serverError}</p>}
      <AutosaveIndicator status={status} error={error} onRetry={retry} />

      <div className="braco-prep__actions">
        <Button onClick={onContinue}>Continuar</Button>
      </div>
    </div>
  );
}
