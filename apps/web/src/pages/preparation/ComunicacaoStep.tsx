import { useEffect, useState } from 'react';
import {
  preparationApi,
  type CommunicationAddressing,
  type CommunicationEmojis,
  type CommunicationLength,
  type CommunicationStyle,
  type CommunicationTone,
} from '../../api/preparation';
import { AutosaveIndicator } from '../../components/AutosaveIndicator';
import { Button } from '../../components/Button';
import { useAutosave } from '../../hooks/useAutosave';

const TONE_OPTIONS: { value: CommunicationTone; label: string }[] = [
  { value: 'PROFISSIONAL_PROXIMO', label: 'Profissional e próximo' },
  { value: 'ACOLHEDOR', label: 'Acolhedor' },
  { value: 'DIRETO_OBJETIVO', label: 'Direto e objetivo' },
  { value: 'FORMAL', label: 'Formal' },
];
const ADDRESSING_OPTIONS: { value: CommunicationAddressing; label: string }[] = [
  { value: 'PRIMEIRO_NOME', label: 'Primeiro nome' },
  { value: 'SENHOR_SENHORA', label: 'Senhor/Senhora' },
  { value: 'NEUTRO_SEM_NOME', label: 'Neutro sem nome' },
];
const LENGTH_OPTIONS: { value: CommunicationLength; label: string }[] = [
  { value: 'CURTAS_OBJETIVAS', label: 'Curtas e objetivas' },
  { value: 'EQUILIBRADAS', label: 'Equilibradas' },
  { value: 'DETALHADAS_QUANDO_NECESSARIO', label: 'Detalhadas quando necessário' },
];
const EMOJI_OPTIONS: { value: CommunicationEmojis; label: string }[] = [
  { value: 'NAO_USAR', label: 'Não usar' },
  { value: 'USAR_COM_MODERACAO', label: 'Usar com moderação' },
  { value: 'USAR_QUANDO_FIZER_SENTIDO', label: 'Usar quando fizer sentido' },
];

/** US13 — Estilo de comunicação. docs/design/22-work-manual-content-model.md §10. */
export function ComunicacaoStep({
  employeeId,
  onSaved,
  onContinue,
}: {
  employeeId: string;
  employeeName: string;
  onSaved: () => Promise<void>;
  onContinue: () => Promise<void>;
}) {
  const [style, setStyle] = useState<CommunicationStyle | null>(null);

  const { status, error, trigger, retry } = useAutosave(async (value: CommunicationStyle) => {
    await preparationApi.updateCommunicationStyle(employeeId, {
      tone: value.tone ?? undefined,
      addressing: value.addressing ?? undefined,
      length: value.length ?? undefined,
      emojis: value.emojis ?? undefined,
      preferredTerms: value.preferredTerms,
      avoidTerms: value.avoidTerms,
    });
    const fresh = await preparationApi.getCommunicationStyle(employeeId);
    setStyle(fresh);
    await onSaved();
  });

  useEffect(() => {
    preparationApi.getCommunicationStyle(employeeId).then(setStyle);
  }, [employeeId]);

  function update<K extends keyof CommunicationStyle>(key: K, value: CommunicationStyle[K]) {
    if (!style) return;
    const next = { ...style, [key]: value };
    setStyle(next);
    trigger(next);
  }

  if (!style) return <p>Carregando…</p>;

  return (
    <div>
      <p className="braco-prep__shared-banner">O funcionário nunca finge ser humano.</p>

      <fieldset className="braco-prep__field">
        <legend>Tom *</legend>
        <div className="braco-prep__radio-group">
          {TONE_OPTIONS.map((o) => (
            <label key={o.value} className="braco-prep__radio-option">
              <input type="radio" checked={style.tone === o.value} onChange={() => update('tone', o.value)} />
              {o.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="braco-prep__field">
        <legend>Forma de tratamento *</legend>
        <div className="braco-prep__radio-group">
          {ADDRESSING_OPTIONS.map((o) => (
            <label key={o.value} className="braco-prep__radio-option">
              <input type="radio" checked={style.addressing === o.value} onChange={() => update('addressing', o.value)} />
              {o.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="braco-prep__field">
        <legend>Tamanho *</legend>
        <div className="braco-prep__radio-group">
          {LENGTH_OPTIONS.map((o) => (
            <label key={o.value} className="braco-prep__radio-option">
              <input type="radio" checked={style.length === o.value} onChange={() => update('length', o.value)} />
              {o.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="braco-prep__field">
        <legend>Emojis *</legend>
        <div className="braco-prep__radio-group">
          {EMOJI_OPTIONS.map((o) => (
            <label key={o.value} className="braco-prep__radio-option">
              <input type="radio" checked={style.emojis === o.value} onChange={() => update('emojis', o.value)} />
              {o.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="braco-prep__preview">
        <strong>Exemplo de como seu Braço vai conversar</strong>
        <p>{style.preview}</p>
      </div>

      <AutosaveIndicator status={status} error={error} onRetry={retry} />

      <div className="braco-prep__actions">
        <Button onClick={onContinue}>Continuar</Button>
      </div>
    </div>
  );
}
