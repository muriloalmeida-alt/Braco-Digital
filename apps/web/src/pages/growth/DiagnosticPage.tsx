import { useEffect, useRef, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { ApiError } from '../../api/client';
import { trackGrowthEvent } from '../../api/growth-analytics';
import {
  publicApi,
  type DiagnosticAnswers,
  type LeadCaptureMode,
  type NeedKey,
  type RankedBraco,
  type TeamSize,
  type VolumeRange,
} from '../../api/public';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { CatalogAvailabilityLabel } from '../../components/CatalogAvailabilityLabel';
import {
  EMPLOYEE_TYPE_LABELS,
  NEED_OPTIONS,
  SEGMENT_OPTIONS,
  TEAM_SIZE_OPTIONS,
  VOLUME_OPTIONS,
  clearDiagnosticAnswers,
  loadDiagnosticAnswers,
  saveDiagnosticAnswers,
} from './diagnostic-state';
import { resolveValidDiagnosticStep, type DiagnosticStep } from './diagnostic-navigation';
import { PublicShell } from './PublicShell';
import './growth.css';

type Step = DiagnosticStep | 'sucesso';
const TOTAL_STEPS = 4;
/** Recuperação de `recommendation`/`ruleVersion` após hard reload em
 * `resultado`/`contato` (issue #28) — o backend continua a única
 * autoridade; nunca tratamos um valor recuperado do cliente como fonte
 * de verdade nem inventamos um passo intermediário só para escondê-la. */
type RecoveryStatus = 'idle' | 'loading' | 'error';

/**
 * US78-83 — "Monte sua equipe". Passo atual refletido em `?step=` (back/
 * forward nativos do navegador); respostas acumuladas em sessionStorage.
 * docs/technical/20-sprint-02-tech-readiness.md §8.
 *
 * Issue #28: nenhuma navegação acontece durante a renderização. Passos
 * inválidos/incompletos (incluindo `?step=` ausente/desconhecido) usam
 * `<Navigate replace>` a partir de `resolveValidDiagnosticStep` (pura,
 * `diagnostic-navigation.ts`); `recommendation`/`ruleVersion` — que só
 * vivem em memória, não em sessionStorage — são recuperados via
 * `useEffect` quando um hard reload os perde mas as respostas persistidas
 * ainda são suficientes para regenerá-los pelo backend.
 */
export function DiagnosticPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawStep = searchParams.get('step');
  const [answers, setAnswers] = useState<DiagnosticAnswers>(() => loadDiagnosticAnswers());
  const [recommendation, setRecommendation] = useState<RankedBraco[] | null>(null);
  const [ruleVersion, setRuleVersion] = useState<string | null>(null);
  const [recommendationError, setRecommendationError] = useState<string | null>(null);
  const [recovery, setRecovery] = useState<RecoveryStatus>('idle');
  const [leadName, setLeadName] = useState('');
  const [leadWasSynthetic, setLeadWasSynthetic] = useState(false);
  // Product Review 01 — a UI nunca infere o modo de captação sozinha,
  // sempre pergunta ao backend (mesmo princípio de `canSimulateConnection`
  // do Track A). `null` = "ainda não sabemos" — issue #28: em hard reload
  // direto em `?step=contato`, tratar "ainda não sabemos" como se já
  // fosse DISABLED redirecionaria para `resultado` antes mesmo da
  // checagem responder, e o resultado ficaria preso lá mesmo que o modo
  // real seja SYNTHETIC/REAL (a URL já teria mudado). Fail-closed aqui
  // significa nunca mostrar o formulário enquanto não soubermos — não
  // decidir (redirecionar) por adivinhação. Falha na checagem resolve
  // para 'DISABLED' de verdade (decisão final, não mais "não sei").
  const [captureMode, setCaptureMode] = useState<LeadCaptureMode | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // `rawStep === null` (URL sem ?step=) é o ponto de entrada normal e
  // sempre resolve para '1' sem precisar de redirect (ver abaixo). Um
  // `?step=` explícito mas inválido/incompleto é o caso que a issue #28
  // cobre: resolvido aqui, sem navegar durante o render.
  const resolvedStep: Step = rawStep === 'sucesso' ? 'sucesso' : resolveValidDiagnosticStep(rawStep, answers);

  useEffect(() => saveDiagnosticAnswers(answers), [answers]);

  useEffect(() => {
    let cancelled = false;
    publicApi
      .getLeadCaptureMode()
      .then((res) => {
        if (!cancelled) setCaptureMode(res.mode);
      })
      .catch(() => {
        // Fail-closed: se a checagem falhar, a decisão final (não mais
        // "não sei") é DISABLED.
        if (!cancelled) setCaptureMode('DISABLED');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    document.title = 'Monte sua equipe — BRAÇO';
    headingRef.current?.focus();
  }, [resolvedStep, recovery]);

  useEffect(() => {
    if (resolvedStep === '1' && !sessionStorage.getItem('braco.growth.startFired')) {
      trackGrowthEvent('diagnostic_start');
      sessionStorage.setItem('braco.growth.startFired', '1');
    }
  }, [resolvedStep]);

  function goToStep(next: Step) {
    setSearchParams({ step: next });
  }

  function completeStep(current: Exclude<Step, 'resultado' | 'contato' | 'sucesso'>, next: Step) {
    trackGrowthEvent('diagnostic_step_complete', { step: current });
    goToStep(next);
  }

  /**
   * Issue #28 — chamada pelo fim normal do passo 4 (`finishDiagnostic`) e
   * pela recuperação em hard reload de `resultado`/`contato`
   * (`recommendation`/`ruleVersion` só vivem em memória). Nos dois casos o
   * backend é a única autoridade — nunca aceitamos um ranking vindo do
   * cliente, e um valor recuperado não é tratado diferente de um recém-
   * calculado.
   */
  async function recoverRecommendation() {
    setRecovery('loading');
    try {
      const result = await publicApi.getRecommendation(answers.needs, answers.priority as NeedKey);
      setRecommendation(result.ranking);
      setRuleVersion(result.ruleVersion);
      setRecovery('idle');
    } catch {
      setRecovery('error');
    }
  }

  useEffect(() => {
    if ((resolvedStep === 'resultado' || resolvedStep === 'contato') && recommendation === null && recovery === 'idle') {
      recoverRecommendation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recoverRecommendation lê `answers` atual via closure; recriar a cada render é intencional, não deve disparar o efeito de novo.
  }, [resolvedStep, recommendation, recovery]);

  async function finishDiagnostic() {
    trackGrowthEvent('diagnostic_step_complete', { step: '4' });
    trackGrowthEvent('diagnostic_complete');
    setRecommendationError(null);
    try {
      const result = await publicApi.getRecommendation(answers.needs, answers.priority as NeedKey);
      setRecommendation(result.ranking);
      setRuleVersion(result.ruleVersion);
      trackGrowthEvent('recommendation_view', {
        availableCount: result.ranking.filter((r) => r.availability === 'AVAILABLE').length,
        typeKeys: result.ranking.map((r) => r.typeKey),
      });
      goToStep('resultado');
    } catch {
      setRecommendationError('Não foi possível gerar sua recomendação agora. Tente novamente.');
    }
  }

  // Issue #28 — nenhum redirect acontece durante o render a partir daqui:
  // `resolvedStep` já foi calculado de forma síncrona e pura (topo do
  // componente) a partir das respostas persistidas. Se a URL pede um
  // passo diferente do que é válido agora, `<Navigate replace>` troca a
  // URL sem empilhar histórico e sem nunca deixar `#root` vazio.
  if (rawStep !== null && rawStep !== resolvedStep) {
    return <Navigate to={{ pathname: '/monte-sua-equipe', search: `?step=${resolvedStep}` }} replace />;
  }

  // Segunda dimensão do guard de `contato` (Product Review 01): não é
  // sobre completude de respostas, é sobre o modo de captação. Resolvida
  // antes de tentar recuperar `recommendation` — evita uma chamada de
  // rede para uma tela da qual estamos saindo, e nunca deixa o formulário
  // "piscar" em DISABLED enquanto os dados são recuperados.
  if (resolvedStep === 'contato' && captureMode === 'DISABLED') {
    return <Navigate to={{ pathname: '/monte-sua-equipe', search: '?step=resultado' }} replace />;
  }

  if (resolvedStep === '1') {
    return (
      <DiagnosticShell step={1} headingRef={headingRef} title="Conte um pouco sobre sua empresa">
        <Step1
          answers={answers}
          onChange={setAnswers}
          onContinue={() => completeStep('1', '2')}
        />
      </DiagnosticShell>
    );
  }

  if (resolvedStep === '2') {
    return (
      <DiagnosticShell step={2} headingRef={headingRef} title="O que está ficando para depois?">
        <Step2
          answers={answers}
          onChange={setAnswers}
          onBack={() => goToStep('1')}
          onContinue={() => completeStep('2', '3')}
        />
      </DiagnosticShell>
    );
  }

  if (resolvedStep === '3') {
    return (
      <DiagnosticShell step={3} headingRef={headingRef} title="Se você pudesse resolver uma dessas coisas primeiro, qual seria?">
        <Step3
          answers={answers}
          onChange={setAnswers}
          onBack={() => goToStep('2')}
          onContinue={() => completeStep('3', '4')}
        />
      </DiagnosticShell>
    );
  }

  if (resolvedStep === '4') {
    return (
      <DiagnosticShell step={4} headingRef={headingRef} title="Quantos contatos ou demandas desse tipo chegam em um dia normal?">
        <Step4
          answers={answers}
          onChange={setAnswers}
          onBack={() => goToStep('3')}
          onContinue={finishDiagnostic}
          error={recommendationError}
        />
      </DiagnosticShell>
    );
  }

  if (resolvedStep === 'resultado' || resolvedStep === 'contato') {
    // `resolvedStep` já garante que as respostas estão completas o
    // suficiente (`isDiagnosticComplete`) — falta (a) `recommendation`
    // em memória (hard reload só preserva `answers`, via sessionStorage;
    // `recoverRecommendation` a repõe chamando o backend de novo, nunca
    // inventando um ranking no cliente) e, só para `contato`, (b) saber
    // com certeza o `captureMode` antes de decidir entre mostrar o
    // formulário ou redirecionar — ver comentário no estado acima.
    const waitingForCaptureMode = resolvedStep === 'contato' && captureMode === null;

    if (recovery === 'error') {
      return (
        <PublicShell>
          <div className="braco-diagnostic">
            <h1 ref={headingRef} tabIndex={-1} className="braco-diagnostic__title">
              Não foi possível recuperar seu diagnóstico
            </h1>
            <p>Isso pode acontecer por uma falha de conexão. Suas respostas continuam salvas — você pode tentar de novo.</p>
            <div className="braco-diagnostic__actions" style={{ justifyContent: 'flex-start' }}>
              <Button onClick={recoverRecommendation}>Tentar novamente</Button>
            </div>
          </div>
        </PublicShell>
      );
    }
    if (recommendation === null || recovery === 'loading' || waitingForCaptureMode) {
      return (
        <PublicShell>
          <div className="braco-diagnostic">
            <h1 ref={headingRef} tabIndex={-1} className="braco-diagnostic__title">
              Carregando sua recomendação…
            </h1>
            <p>Só um instante enquanto recuperamos o resultado do seu diagnóstico.</p>
          </div>
        </PublicShell>
      );
    }
  }

  if (resolvedStep === 'resultado') {
    return (
      <PublicShell>
        <div className="braco-diagnostic">
          <h1 ref={headingRef} tabIndex={-1} className="braco-diagnostic__title">
            Sua equipe recomendada
          </h1>
          <ResultView
            ranking={recommendation as RankedBraco[]}
            captureMode={captureMode}
            onContinue={() => goToStep('contato')}
          />
        </div>
      </PublicShell>
    );
  }

  if (resolvedStep === 'contato') {
    // captureMode === 'DISABLED' já foi tratado (redirect) antes deste
    // bloco — chegar aqui garante SYNTHETIC ou REAL.
    return (
      <PublicShell>
        <div className="braco-diagnostic">
          <h1 ref={headingRef} tabIndex={-1} className="braco-diagnostic__title">
            Quer receber seu diagnóstico e conversar sobre sua equipe?
          </h1>
          <LeadForm
            answers={answers}
            ranking={recommendation as RankedBraco[]}
            captureMode={captureMode as LeadCaptureMode}
            onSuccess={(name, isSynthetic) => {
              setLeadName(name);
              setLeadWasSynthetic(isSynthetic);
              clearDiagnosticAnswers();
              goToStep('sucesso');
            }}
          />
        </div>
      </PublicShell>
    );
  }

  // sucesso
  return (
    <PublicShell>
      <div className="braco-diagnostic">
        <Card>
          <CheckCircle2 size={28} aria-hidden="true" style={{ color: 'var(--md-ext-color-success)' }} />
          <h1 ref={headingRef} tabIndex={-1} className="braco-diagnostic__title">
            {leadWasSynthetic ? 'Diagnóstico de teste registrado.' : 'Diagnóstico recebido'}
          </h1>
          <p>Obrigado, {leadName || 'você'}.</p>
          {leadWasSynthetic ? (
            <p>Este é um registro de ambiente de teste — nenhum contato comercial real será feito a partir dele.</p>
          ) : (
            <p>Sua equipe recomendada foi registrada. A equipe BRAÇO pode entrar em contato pelos dados informados.</p>
          )}
          <div className="braco-diagnostic__actions" style={{ justifyContent: 'flex-start' }}>
            <Button onClick={() => (window.location.href = '/')}>Voltar para o site</Button>
          </div>
        </Card>
      </div>
    </PublicShell>
  );
}

function DiagnosticShell({
  step,
  title,
  headingRef,
  children,
}: {
  step: number;
  title: string;
  headingRef: React.RefObject<HTMLHeadingElement>;
  children: React.ReactNode;
}) {
  return (
    <PublicShell>
      <div className="braco-diagnostic">
        <p className="braco-diagnostic__progress-label">
          Passo {step} de {TOTAL_STEPS}
        </p>
        <div className="braco-diagnostic__progress-bar">
          <div className="braco-diagnostic__progress-fill" style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
        </div>
        <h1 ref={headingRef} tabIndex={-1} className="braco-diagnostic__title">
          {title}
        </h1>
        {children}
      </div>
    </PublicShell>
  );
}

function Step1({
  answers,
  onChange,
  onContinue,
}: {
  answers: DiagnosticAnswers;
  onChange: (a: DiagnosticAnswers) => void;
  onContinue: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  function handleContinue() {
    if (!answers.segment || !answers.teamSize) {
      setError('Preencha segmento e tamanho da equipe para continuar.');
      return;
    }
    onContinue();
  }
  return (
    <div>
      <div className="braco-diagnostic__field">
        <label htmlFor="segment">Segmento *</label>
        <select id="segment" value={answers.segment} onChange={(e) => onChange({ ...answers, segment: e.target.value })}>
          <option value="">Selecione</option>
          {SEGMENT_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div className="braco-diagnostic__field">
        <label htmlFor="teamSize">Tamanho da equipe *</label>
        <select
          id="teamSize"
          value={answers.teamSize ?? ''}
          onChange={(e) => onChange({ ...answers, teamSize: e.target.value as TeamSize })}
        >
          <option value="">Selecione</option>
          {TEAM_SIZE_OPTIONS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="braco-diagnostic__field-error">{error}</p>}
      <div className="braco-diagnostic__actions" style={{ justifyContent: 'flex-end' }}>
        <Button onClick={handleContinue}>Continuar</Button>
      </div>
    </div>
  );
}

function Step2({
  answers,
  onChange,
  onBack,
  onContinue,
}: {
  answers: DiagnosticAnswers;
  onChange: (a: DiagnosticAnswers) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  function toggle(need: NeedKey) {
    const has = answers.needs.includes(need);
    const nextNeeds = has ? answers.needs.filter((n) => n !== need) : [...answers.needs, need];
    // Se a prioridade escolhida deixou de estar selecionada, ela é limpa.
    const nextPriority = answers.priority && nextNeeds.includes(answers.priority) ? answers.priority : null;
    onChange({ ...answers, needs: nextNeeds, priority: nextPriority });
  }
  function handleContinue() {
    if (answers.needs.length === 0) {
      setError('Selecione ao menos uma necessidade para continuar.');
      return;
    }
    onContinue();
  }
  return (
    <div>
      <p>Selecione tudo que fizer sentido.</p>
      <div className="braco-diagnostic__options" role="group" aria-label="Necessidades">
        {NEED_OPTIONS.map((option) => (
          <label key={option.value} className="braco-diagnostic__option">
            <input
              type="checkbox"
              checked={answers.needs.includes(option.value)}
              onChange={() => toggle(option.value)}
            />
            {option.label}
          </label>
        ))}
      </div>
      {error && <p className="braco-diagnostic__field-error">{error}</p>}
      <div className="braco-diagnostic__actions">
        <Button variant="outlined" onClick={onBack}>
          Voltar
        </Button>
        <Button onClick={handleContinue}>Continuar</Button>
      </div>
    </div>
  );
}

function Step3({
  answers,
  onChange,
  onBack,
  onContinue,
}: {
  answers: DiagnosticAnswers;
  onChange: (a: DiagnosticAnswers) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const options = NEED_OPTIONS.filter((o) => answers.needs.includes(o.value));
  function handleContinue() {
    if (!answers.priority) {
      setError('Escolha a prioridade principal para continuar.');
      return;
    }
    onContinue();
  }
  return (
    <div>
      <div className="braco-diagnostic__options" role="radiogroup" aria-label="Prioridade principal">
        {options.map((option) => (
          <label key={option.value} className="braco-diagnostic__option">
            <input
              type="radio"
              name="priority"
              checked={answers.priority === option.value}
              onChange={() => onChange({ ...answers, priority: option.value })}
            />
            {option.label}
          </label>
        ))}
      </div>
      {error && <p className="braco-diagnostic__field-error">{error}</p>}
      <div className="braco-diagnostic__actions">
        <Button variant="outlined" onClick={onBack}>
          Voltar
        </Button>
        <Button onClick={handleContinue}>Continuar</Button>
      </div>
    </div>
  );
}

function Step4({
  answers,
  onChange,
  onBack,
  onContinue,
  error,
}: {
  answers: DiagnosticAnswers;
  onChange: (a: DiagnosticAnswers) => void;
  onBack: () => void;
  onContinue: () => void;
  error: string | null;
}) {
  const [validationError, setValidationError] = useState<string | null>(null);
  function handleContinue() {
    if (!answers.volume) {
      setValidationError('Selecione uma opção para continuar.');
      return;
    }
    setValidationError(null);
    onContinue();
  }
  return (
    <div>
      <div className="braco-diagnostic__options" role="radiogroup" aria-label="Volume aproximado">
        {VOLUME_OPTIONS.map((option) => (
          <label key={option.value} className="braco-diagnostic__option">
            <input
              type="radio"
              name="volume"
              checked={answers.volume === option.value}
              onChange={() => onChange({ ...answers, volume: option.value as VolumeRange })}
            />
            {option.label}
          </label>
        ))}
      </div>
      {(validationError || error) && <p className="braco-diagnostic__field-error">{validationError || error}</p>}
      <div className="braco-diagnostic__actions">
        <Button variant="outlined" onClick={onBack}>
          Voltar
        </Button>
        <Button onClick={handleContinue}>Ver minha equipe</Button>
      </div>
    </div>
  );
}

function ResultView({
  ranking,
  captureMode,
  onContinue,
}: {
  ranking: RankedBraco[];
  captureMode: LeadCaptureMode | null;
  onContinue: () => void;
}) {
  const hasAvailable = ranking.some((r) => r.availability === 'AVAILABLE');
  const firstIsAvailable = ranking[0]?.availability === 'AVAILABLE';
  // Product Review 01: em produção sem captação liberada (PD6 fechado),
  // o resultado do diagnóstico continua funcionando, mas o CTA nunca leva
  // a um formulário de captação, nem promete contato posterior. `null`
  // ("ainda não sabemos o modo", issue #28) recebe o mesmo tratamento de
  // `DISABLED` aqui — nunca oferecer o CTA de captura antes de ter
  // certeza; assim que o modo real chegar, o próximo render já reflete.
  const captureDisabled = captureMode !== 'SYNTHETIC' && captureMode !== 'REAL';

  return (
    <div>
      <p>Com base no que você contou, estes são os Braços que mais podem ajudar.</p>
      {ranking.map((item, index) => {
        const info = EMPLOYEE_TYPE_LABELS[item.typeKey] ?? { name: item.typeKey, role: '' };
        const isAvailable = item.availability === 'AVAILABLE';
        return (
          <Card key={item.typeKey} className="braco-diagnostic__result-card">
            <div className="braco-diagnostic__result-card-header">
              <div>
                <h3 style={{ margin: 0 }}>{info.name}</h3>
                <p style={{ margin: 0, color: 'var(--md-sys-color-on-surface-variant)' }}>{info.role}</p>
              </div>
              <CatalogAvailabilityLabel availability={item.availability} />
            </div>
            {isAvailable && index === 0 && firstIsAvailable && (
              <span className="braco-diagnostic__badge">Comece por aqui</span>
            )}
            <p>{item.reason}</p>
          </Card>
        );
      })}

      {hasAvailable && (
        <p>
          <strong>Sua equipe ideal pode ter mais de um Braço. Você pode começar com 1.</strong>
        </p>
      )}
      {!hasAvailable && <p>Esses Braços ainda não estão disponíveis para contratação.</p>}

      {captureDisabled && <p>Captação de contato não está disponível neste ambiente.</p>}

      <div className="braco-diagnostic__actions" style={{ justifyContent: 'flex-end' }}>
        {captureDisabled ? (
          <Button onClick={() => (window.location.href = '/')}>Voltar para o site</Button>
        ) : (
          <Button onClick={onContinue}>{hasAvailable ? 'Quero montar minha equipe' : 'Receber meu diagnóstico'}</Button>
        )}
      </div>
    </div>
  );
}

function LeadForm({
  answers,
  ranking,
  captureMode,
  onSuccess,
}: {
  answers: DiagnosticAnswers;
  ranking: RankedBraco[];
  captureMode: LeadCaptureMode;
  onSuccess: (name: string, isSynthetic: boolean) => void;
}) {
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const hasAvailable = ranking.some((r) => r.availability === 'AVAILABLE');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !companyName.trim() || !whatsapp.trim()) {
      setError('Nome, empresa e WhatsApp são obrigatórios.');
      return;
    }
    setSubmitting(true);
    setError(null);
    trackGrowthEvent('lead_submit');
    try {
      const res = await publicApi.createLead({
        name,
        companyName,
        whatsapp,
        email: email || undefined,
        segment: answers.segment,
        teamSize: answers.teamSize as NonNullable<DiagnosticAnswers['teamSize']>,
        volume: answers.volume as NonNullable<DiagnosticAnswers['volume']>,
        answers: { needs: answers.needs, priority: answers.priority as NeedKey },
      });
      trackGrowthEvent('lead_submit_success', { leadId: res.id });
      onSuccess(name, res.isSynthetic);
    } catch (err) {
      trackGrowthEvent('lead_submit_error', { reason: err instanceof ApiError ? `http_${err.status}` : 'network' });
      setError('Não foi possível enviar seus dados. Seu diagnóstico continua nesta tela.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {captureMode === 'SYNTHETIC' && (
        <p className="braco-diagnostic__test-banner" role="note">
          Ambiente de teste — use apenas dados fictícios.
        </p>
      )}
      <div className="braco-diagnostic__field">
        <label htmlFor="lead-name">Nome *</label>
        <input id="lead-name" type="text" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="braco-diagnostic__field">
        <label htmlFor="lead-company">Empresa *</label>
        <input id="lead-company" type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
      </div>
      <div className="braco-diagnostic__field">
        <label htmlFor="lead-whatsapp">WhatsApp *</label>
        <input id="lead-whatsapp" type="text" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
      </div>
      <div className="braco-diagnostic__field">
        <label htmlFor="lead-email">E-mail</label>
        <input id="lead-email" type="text" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      {/*
       * Product Review 01: esta frase (usada hoje tanto em SYNTHETIC
       * quanto em REAL) NÃO é aviso jurídico aprovado e NÃO deve ser
       * tratada como solução final de PD6. Em SYNTHETIC ela é reforçada
       * pelo banner de ambiente de teste acima e pela linguagem
       * operacional abaixo. Em REAL — que só é ativado após liberação
       * formal de PD6 — o aviso/copy/link legal definitivos são de
       * Produto/Design após Jurídico; nada aqui deve ser publicado como
       * essa decisão.
       */}
      <p style={{ fontSize: 'var(--md-sys-typescale-body-medium-size)', color: 'var(--md-sys-color-on-surface-variant)' }}>
        {captureMode === 'SYNTHETIC'
          ? 'Ambiente de teste: os dados enviados aqui não geram contato comercial real e são usados apenas para validar o funcionamento do diagnóstico.'
          : 'Usamos seus dados só para conversar sobre a equipe recomendada. Nenhum contrato é firmado neste formulário.'}
      </p>
      {error && <p className="braco-diagnostic__field-error">{error}</p>}
      <div className="braco-diagnostic__actions" style={{ justifyContent: 'flex-end' }}>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Enviando…' : hasAvailable ? 'Quero montar minha equipe' : 'Receber meu diagnóstico'}
        </Button>
      </div>
    </form>
  );
}
