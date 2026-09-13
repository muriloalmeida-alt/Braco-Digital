import { Shield } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ApiError } from '../../api/client';
import { preparationApi, type RulesView } from '../../api/preparation';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';

/** US10 — Regras e limites. docs/design/22-work-manual-content-model.md §7. */
export function RegrasStep({
  employeeId,
  onSaved,
  onContinue,
}: {
  employeeId: string;
  onSaved: () => Promise<void>;
  onContinue: () => Promise<void>;
}) {
  const [view, setView] = useState<RulesView | null>(null);
  // `null` = ainda não decidido. Nunca pré-marcar "Não tenho regras
  // adicionais" antes de o backend confirmar o reconhecimento: um rádio
  // nativo já marcado não dispara onChange ao ser clicado de novo, então
  // pré-selecionar "none" impediria o PATCH de reconhecimento de
  // acontecer e travaria a etapa como incompleta silenciosamente.
  const [choice, setChoice] = useState<'none' | 'has' | null>(null);
  const [draftText, setDraftText] = useState('');
  const [draftAppliesWhen, setDraftAppliesWhen] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  function load() {
    preparationApi.getRules(employeeId).then((data) => {
      setView(data);
      setChoice(data.rules.length > 0 ? 'has' : data.acknowledgedNoAdditional ? 'none' : null);
    });
  }

  useEffect(load, [employeeId]);

  async function selectChoice(value: 'none' | 'has') {
    setChoice(value);
    if (value === 'none') {
      await preparationApi.acknowledgeNoAdditionalRules(employeeId, true);
      load();
      await onSaved();
    }
  }

  async function addRule() {
    setFormError(null);
    if (!draftText.trim()) {
      setFormError('Informe o texto da regra.');
      return;
    }
    try {
      await preparationApi.createRule(employeeId, { text: draftText, appliesWhen: draftAppliesWhen || undefined });
      setDraftText('');
      setDraftAppliesWhen('');
      load();
      await onSaved();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Não foi possível salvar a regra.');
    }
  }

  async function removeRule(id: string) {
    if (!window.confirm('Excluir esta regra?')) return;
    await preparationApi.deleteRule(employeeId, id);
    load();
    await onSaved();
  }

  if (!view) return <p>Carregando…</p>;

  return (
    <div>
      <h2>Regras do BRAÇO</h2>
      {view.systemLimits.map((limit) => (
        <div key={limit.key} className="braco-prep__system-limit">
          <Shield size={18} aria-hidden="true" />
          <div>
            {limit.label}
            <br />
            <small>Regra do BRAÇO · não pode ser desativada</small>
          </div>
        </div>
      ))}
      <p>Estes limites protegem sua empresa e seus clientes e não podem ser desativados.</p>

      <h2>Regras da empresa</h2>
      <div className="braco-prep__radio-group" role="radiogroup" aria-label="Regras adicionais">
        <label className="braco-prep__radio-option">
          <input type="radio" checked={choice === 'none'} onChange={() => selectChoice('none')} />
          Não tenho regras adicionais
        </label>
        <label className="braco-prep__radio-option">
          <input type="radio" checked={choice === 'has'} onChange={() => setChoice('has')} />
          Quero adicionar regras
        </label>
      </div>

      {choice === 'has' && (
        <>
          {view.rules.map((rule) => (
            <Card key={rule.id} className="braco-prep__list-item">
              <div>
                <strong>{rule.text}</strong>
                {rule.appliesWhen && <p>{rule.appliesWhen}</p>}
              </div>
              <div className="braco-prep__list-item-actions">
                <button type="button" onClick={() => removeRule(rule.id)}>
                  Excluir
                </button>
              </div>
            </Card>
          ))}

          <div className="braco-prep__field">
            <label htmlFor="rule-text">Regra *</label>
            <input id="rule-text" type="text" value={draftText} onChange={(e) => setDraftText(e.target.value)} />
          </div>
          <div className="braco-prep__field">
            <label htmlFor="rule-when">Quando se aplica</label>
            <input id="rule-when" type="text" value={draftAppliesWhen} onChange={(e) => setDraftAppliesWhen(e.target.value)} />
          </div>
          {formError && <p className="braco-prep__field-error">{formError}</p>}
          <Button variant="outlined" onClick={addRule}>
            + Adicionar regra
          </Button>
        </>
      )}

      <div className="braco-prep__actions">
        <Button onClick={onContinue}>Continuar</Button>
      </div>
    </div>
  );
}
