import { useEffect, useState } from 'react';
import { ApiError } from '../../api/client';
import { preparationApi, type ResponsiblesView } from '../../api/preparation';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';

/** US12 — Pessoas e responsáveis. docs/design/22-work-manual-content-model.md §9. */
export function PessoasStep({
  employeeId,
  onSaved,
  onContinue,
}: {
  employeeId: string;
  onSaved: () => Promise<void>;
  onContinue: () => Promise<void>;
}) {
  const [view, setView] = useState<ResponsiblesView | null>(null);
  const [principalId, setPrincipalId] = useState('');
  const [backupId, setBackupId] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    preparationApi.getResponsibles(employeeId).then((data) => {
      setView(data);
      setPrincipalId(data.principalUserId ?? data.recommendedUserId ?? '');
      setBackupId(data.backupUserId ?? '');
    });
  }, [employeeId]);

  async function save(nextPrincipal: string, nextBackup: string) {
    if (!nextPrincipal) return;
    setError(null);
    try {
      await preparationApi.updateResponsibles(employeeId, nextPrincipal, nextBackup || null);
      await onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível salvar.');
    }
  }

  if (!view) return <p>Carregando…</p>;

  const principal = view.eligibleUsers.find((u) => u.userId === principalId);

  return (
    <div>
      {view.eligibleUsers.length === 0 && <p>Nenhum usuário elegível encontrado nesta empresa.</p>}

      <div className="braco-prep__field">
        <label htmlFor="principal">Responsável principal *</label>
        {view.recommendedUserId && principalId === view.recommendedUserId && (
          <p>Recomendado: {view.eligibleUsers[0]?.name}</p>
        )}
        <select
          id="principal"
          value={principalId}
          onChange={(e) => {
            setPrincipalId(e.target.value);
            save(e.target.value, backupId);
          }}
        >
          <option value="">Selecionar pessoa</option>
          {view.eligibleUsers.map((u) => (
            <option key={u.userId} value={u.userId}>
              {u.name} — {u.role}
            </option>
          ))}
        </select>
        {principal && (
          <Card>
            {principal.name}
            <br />
            <small>
              {principal.role} · {principal.email}
            </small>
          </Card>
        )}
      </div>

      <div className="braco-prep__field">
        <label htmlFor="backup">Responsável reserva</label>
        <select
          id="backup"
          value={backupId}
          onChange={(e) => {
            setBackupId(e.target.value);
            save(principalId, e.target.value);
          }}
        >
          <option value="">Nenhum</option>
          {view.eligibleUsers
            .filter((u) => u.userId !== principalId)
            .map((u) => (
              <option key={u.userId} value={u.userId}>
                {u.name} — {u.role}
              </option>
            ))}
        </select>
      </div>

      {error && <p className="braco-prep__field-error">{error}</p>}

      <div className="braco-prep__actions">
        <Button onClick={onContinue}>Continuar</Button>
      </div>
    </div>
  );
}
