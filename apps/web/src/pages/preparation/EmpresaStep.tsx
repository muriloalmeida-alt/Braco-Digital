import { useEffect, useState } from 'react';
import {
  preparationApi,
  type BusinessHourPeriod,
  type CompanyProfile,
  type ServiceMode,
} from '../../api/preparation';
import { AutosaveIndicator } from '../../components/AutosaveIndicator';
import { Button } from '../../components/Button';
import { useAutosave } from '../../hooks/useAutosave';

type FormState = {
  attendanceName: string;
  about: string;
  serviceMode: ServiceMode | '';
  address: string;
  businessHours: BusinessHourPeriod[];
  website: string;
  socialHandle: string;
  generalNotes: string;
};

const EMPTY: FormState = {
  attendanceName: '',
  about: '',
  serviceMode: '',
  address: '',
  businessHours: [],
  website: '',
  socialHandle: '',
  generalNotes: '',
};

/** US07 — Empresa. Contexto compartilhado — docs/design/22-work-manual-content-model.md §4. */
export function EmpresaStep({ onSaved, onContinue }: { onSaved: () => Promise<void>; onContinue: () => Promise<void> }) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { status, error, trigger, flush, retry } = useAutosave(async (value: FormState) => {
    await preparationApi.updateCompanyProfile({
      attendanceName: value.attendanceName || undefined,
      about: value.about || undefined,
      serviceMode: value.serviceMode || undefined,
      address: value.address || undefined,
      businessHours: value.businessHours.length ? value.businessHours : undefined,
      website: value.website || undefined,
      socialHandle: value.socialHandle || undefined,
      generalNotes: value.generalNotes || undefined,
    });
    await onSaved();
  });

  useEffect(() => {
    preparationApi.getCompanyProfile().then((p: CompanyProfile) => {
      setForm({
        attendanceName: p.attendanceName ?? '',
        about: p.about ?? '',
        serviceMode: p.serviceMode ?? '',
        address: p.address ?? '',
        businessHours: p.businessHours ?? [],
        website: p.website ?? '',
        socialHandle: p.socialHandle ?? '',
        generalNotes: p.generalNotes ?? '',
      });
      setLoading(false);
    });
  }, []);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    const next = { ...form, [key]: value };
    setForm(next);
    trigger(next);
  }

  function addPeriod() {
    update('businessHours', [...form.businessHours, { day: 'seg-sex', from: '08:00', to: '18:00' }]);
  }

  function removePeriod(index: number) {
    update(
      'businessHours',
      form.businessHours.filter((_, i) => i !== index),
    );
  }

  function updatePeriod(index: number, patch: Partial<BusinessHourPeriod>) {
    update(
      'businessHours',
      form.businessHours.map((p, i) => (i === index ? { ...p, ...patch } : p)),
    );
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.attendanceName.trim()) e.attendanceName = 'Informe o nome usado no atendimento.';
    if (!form.about.trim()) e.about = 'Conte brevemente o que a empresa faz.';
    if (!form.serviceMode) e.serviceMode = 'Selecione a forma de atendimento.';
    if ((form.serviceMode === 'PRESENCIAL' || form.serviceMode === 'AMBOS') && !form.address.trim()) {
      e.address = 'Endereço é obrigatório para atendimento presencial.';
    }
    if (form.businessHours.length === 0) e.businessHours = 'Informe ao menos um período de atendimento.';
    setErrors(e);
    const firstKey = Object.keys(e)[0];
    if (firstKey) {
      document.getElementById(firstKey)?.focus();
      return false;
    }
    return true;
  }

  async function handleContinue() {
    flush(form);
    if (!validate()) return;
    await onContinue();
  }

  if (loading) return <p>Carregando…</p>;

  return (
    <div>
      <p className="braco-prep__shared-banner">Estas informações podem ser usadas por todos os seus Braços.</p>

      <div className="braco-prep__field">
        <label htmlFor="attendanceName">Nome para atendimento *</label>
        <input
          id="attendanceName"
          type="text"
          value={form.attendanceName}
          onChange={(e) => update('attendanceName', e.target.value)}
          onBlur={() => flush(form)}
        />
        {errors.attendanceName && <p className="braco-prep__field-error">{errors.attendanceName}</p>}
      </div>

      <div className="braco-prep__field">
        <label htmlFor="about">Sobre a empresa *</label>
        <textarea id="about" rows={3} value={form.about} onChange={(e) => update('about', e.target.value)} onBlur={() => flush(form)} />
        {errors.about && <p className="braco-prep__field-error">{errors.about}</p>}
      </div>

      <div className="braco-prep__field">
        <span>Forma de atendimento *</span>
        <div className="braco-prep__radio-group" role="radiogroup" aria-label="Forma de atendimento">
          {(['PRESENCIAL', 'ONLINE', 'AMBOS'] as const).map((mode) => (
            <label key={mode} className="braco-prep__radio-option">
              <input
                type="radio"
                name="serviceMode"
                checked={form.serviceMode === mode}
                onChange={() => update('serviceMode', mode)}
              />
              {mode === 'PRESENCIAL' ? 'Presencial' : mode === 'ONLINE' ? 'Online' : 'Ambos'}
            </label>
          ))}
        </div>
        {errors.serviceMode && <p className="braco-prep__field-error">{errors.serviceMode}</p>}
      </div>

      {(form.serviceMode === 'PRESENCIAL' || form.serviceMode === 'AMBOS') && (
        <div className="braco-prep__field">
          <label htmlFor="address">Endereço principal *</label>
          <input id="address" type="text" value={form.address} onChange={(e) => update('address', e.target.value)} onBlur={() => flush(form)} />
          {errors.address && <p className="braco-prep__field-error">{errors.address}</p>}
        </div>
      )}

      <div className="braco-prep__field">
        <span>Horários de atendimento *</span>
        {form.businessHours.map((p, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
            <input type="text" value={p.day} onChange={(e) => updatePeriod(i, { day: e.target.value })} onBlur={() => flush(form)} style={{ flex: 1 }} />
            <input type="text" value={p.from} onChange={(e) => updatePeriod(i, { from: e.target.value })} onBlur={() => flush(form)} style={{ width: 80 }} />
            <span>às</span>
            <input type="text" value={p.to} onChange={(e) => updatePeriod(i, { to: e.target.value })} onBlur={() => flush(form)} style={{ width: 80 }} />
            <button type="button" onClick={() => removePeriod(i)} aria-label="Remover período">
              ×
            </button>
          </div>
        ))}
        <Button variant="text" onClick={addPeriod}>
          + Adicionar período
        </Button>
        {errors.businessHours && <p className="braco-prep__field-error">{errors.businessHours}</p>}
      </div>

      <div className="braco-prep__field">
        <label htmlFor="website">Site</label>
        <input id="website" type="text" value={form.website} onChange={(e) => update('website', e.target.value)} onBlur={() => flush(form)} />
      </div>

      <div className="braco-prep__field">
        <label htmlFor="socialHandle">Instagram/rede principal</label>
        <input id="socialHandle" type="text" value={form.socialHandle} onChange={(e) => update('socialHandle', e.target.value)} onBlur={() => flush(form)} />
      </div>

      <div className="braco-prep__field">
        <label htmlFor="generalNotes">Observações gerais</label>
        <textarea id="generalNotes" rows={2} value={form.generalNotes} onChange={(e) => update('generalNotes', e.target.value)} onBlur={() => flush(form)} />
      </div>

      <AutosaveIndicator status={status} error={error} onRetry={retry} />

      <div className="braco-prep__actions">
        <Button onClick={handleContinue}>Continuar</Button>
      </div>
    </div>
  );
}

