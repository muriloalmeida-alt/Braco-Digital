import { useEffect, useState } from 'react';
import { preparationApi, type ResponsibilityItem } from '../../api/preparation';
import { AutosaveIndicator } from '../../components/AutosaveIndicator';
import { Button } from '../../components/Button';
import { useAutosave } from '../../hooks/useAutosave';

/** US09 — Responsabilidades. docs/design/22-work-manual-content-model.md §6. */
export function ResponsabilidadesStep({
  employeeId,
  onSaved,
  onContinue,
}: {
  employeeId: string;
  onSaved: () => Promise<void>;
  onContinue: () => Promise<void>;
}) {
  const [items, setItems] = useState<ResponsibilityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const { status, error, trigger, retry } = useAutosave(async (value: ResponsibilityItem[]) => {
    await preparationApi.updateResponsibilities(
      employeeId,
      value.filter((v) => !v.essential).map((v) => ({ key: v.key, enabled: v.enabled })),
    );
    await onSaved();
  });

  useEffect(() => {
    preparationApi.getResponsibilities(employeeId).then((data) => {
      setItems(data);
      setLoading(false);
    });
  }, [employeeId]);

  function toggle(key: string, enabled: boolean) {
    const next = items.map((i) => (i.key === key ? { ...i, enabled } : i));
    setItems(next);
    trigger(next);
  }

  if (loading) return <p>Carregando…</p>;

  const essentials = items.filter((i) => i.essential);
  const configurable = items.filter((i) => !i.essential);

  return (
    <div>
      <h2>Essenciais</h2>
      <ul>
        {essentials.map((i) => (
          <li key={i.key}>
            ✓ {i.label} <em>— Obrigatória</em>
          </li>
        ))}
      </ul>

      <h2>Configuráveis</h2>
      <div className="braco-prep__checkbox-group">
        {configurable.map((i) => (
          <label key={i.key} className="braco-prep__checkbox-option">
            <input type="checkbox" checked={i.enabled} onChange={(e) => toggle(i.key, e.target.checked)} />
            {i.label}
            {i.requiresCalendar && <em> → exige Calendar</em>}
            {i.requiresTasks && <em> → exige Tasks</em>}
          </label>
        ))}
      </div>

      <AutosaveIndicator status={status} error={error} onRetry={retry} />

      <div className="braco-prep__actions">
        <Button onClick={onContinue}>Continuar</Button>
      </div>
    </div>
  );
}
