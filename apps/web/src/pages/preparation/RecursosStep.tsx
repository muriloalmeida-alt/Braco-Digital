import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../api/auth-context';
import { ApiError } from '../../api/client';
import {
  googleApi,
  rememberIntegrationReturnPath,
  zernioApi,
  type GoogleCalendarOption,
  type GoogleStatusView,
} from '../../api/integrations';
import { preparationApi, type IntegrationType, type ResourceItem } from '../../api/preparation';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import type { IntegrationCallbackResult } from '../IntegrationsCallbackPage';

const LABELS: Record<IntegrationType, string> = {
  WHATSAPP: 'WhatsApp',
  GOOGLE_CALENDAR: 'Google Calendar',
  GOOGLE_TASKS: 'Google Tasks',
};

const STATUS_LABEL: Record<string, string> = {
  NOT_CONFIGURED: 'Não configurado',
  CONNECTING: 'Conectando',
  CONNECTED: 'Conectado',
  NEEDS_ATTENTION: 'Precisa de atenção',
  DISCONNECTED: 'Desconectado',
  NOT_NECESSARY: 'Não necessário',
};

/** Nunca mostrar o código bruto do provedor — só o texto acionável mapeado aqui. */
const ERROR_MESSAGES: Record<string, string> = {
  connection_cancelled: 'A conexão não foi concluída.',
  session_expired: 'A sessão de conexão expirou. Tente novamente.',
  callback_mismatch: 'Não conseguimos confirmar a conexão. Tente novamente.',
  google_error: 'Não conseguimos concluir a conexão com o Google. Tente novamente.',
  whatsapp_error: 'Não conseguimos concluir a conexão com o WhatsApp. Tente novamente.',
};

function errorMessageFor(reason: string | null): string {
  if (!reason) return 'A conexão não foi concluída.';
  return ERROR_MESSAGES[reason] ?? 'A conexão não foi concluída.';
}

/**
 * US14 — Recursos de trabalho (docs/design/24-work-resources-ui-spec.md).
 * UI real: aciona o OAuth de verdade do WhatsApp/Zernio (issue #30) e do
 * Google Calendar/Tasks (issue #31) — não fala mais só com o caminho
 * `SIMULATED` genérico do backend. O caminho simulado continua existindo
 * (TD19: nunca conta como pronto em produção) e aparece aqui só como uma
 * opção secundária, explicitamente rotulada, quando o backend confirma
 * que este ambiente permite (`item.canSimulateConnection` — nunca uma
 * decisão do frontend).
 */
export function RecursosStep({
  employeeId,
  onSaved,
  onContinue,
}: {
  employeeId: string;
  onSaved: () => Promise<void>;
  onContinue: () => Promise<void>;
}) {
  const { role } = useAuth();
  const location = useLocation();
  const canManage = role === 'OWNER' || role === 'ADMIN';

  const [items, setItems] = useState<ResourceItem[]>([]);
  const [googleStatus, setGoogleStatus] = useState<GoogleStatusView | null>(null);
  const [banner] = useState<IntegrationCallbackResult | null>(
    (location.state as { integrationResult?: IntegrationCallbackResult } | null)?.integrationResult ?? null,
  );

  async function load() {
    const [resources, google] = await Promise.all([
      preparationApi.getResources(employeeId),
      // Google pode não estar configurado neste ambiente — status vira
      // `null` nesse caso, nunca um erro que trava a tela inteira.
      googleApi.getStatus().catch(() => null),
    ]);
    setItems(resources);
    setGoogleStatus(google);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId]);

  // Limpa o `location.state` depois de ler — evita reexibir o mesmo
  // banner se o usuário navegar de volta para esta etapa mais tarde.
  useEffect(() => {
    if (banner) window.history.replaceState({}, '');
  }, [banner]);

  return (
    <div>
      {banner && (
        <p className={banner.result === 'success' ? 'braco-prep__resource-banner-success' : 'braco-prep__field-error'}>
          {banner.result === 'success' ? 'Conexão concluída.' : errorMessageFor(banner.reason)}
        </p>
      )}

      {!canManage && (
        <p className="braco-prep__resource-readonly-note">Somente Owner/Admin podem conectar, configurar ou desconectar recursos.</p>
      )}

      {items.map((item) =>
        item.type === 'WHATSAPP' ? (
          <WhatsAppResourceCard
            key={item.type}
            item={item}
            employeeId={employeeId}
            canManage={canManage}
            onChanged={async () => {
              await load();
              await onSaved();
            }}
          />
        ) : (
          <GoogleResourceCard
            key={item.type}
            item={item}
            employeeId={employeeId}
            connection={googleStatus?.connection ?? null}
            canManage={canManage}
            onChanged={async () => {
              await load();
              await onSaved();
            }}
          />
        ),
      )}

      <div className="braco-prep__actions">
        <Button onClick={onContinue}>Ir para revisão</Button>
      </div>
    </div>
  );
}

// --- WhatsApp / Zernio -----------------------------------------------------

function WhatsAppResourceCard({
  item,
  employeeId,
  canManage,
  onChanged,
}: {
  item: ResourceItem;
  employeeId: string;
  canManage: boolean;
  onChanged: () => Promise<void>;
}) {
  const [busy, setBusy] = useState<'connect' | 'disconnect' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [simulating, setSimulating] = useState(false);

  async function connectReal() {
    setError(null);
    setBusy('connect');
    try {
      const { authUrl } = await zernioApi.connect();
      rememberIntegrationReturnPath();
      window.location.href = authUrl;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não conseguimos iniciar a conexão com o WhatsApp.');
      setBusy(null);
    }
  }

  async function disconnectReal() {
    if (!window.confirm('Desconectar o WhatsApp? A preparação pode ficar incompleta se este recurso for obrigatório.')) return;
    setError(null);
    setBusy('disconnect');
    try {
      await zernioApi.disconnect();
      await onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não conseguimos desconectar o WhatsApp agora.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card className="braco-prep__resource-card">
      <div className="braco-prep__resource-card-header">
        <strong>{LABELS.WHATSAPP}</strong>
        <span>{STATUS_LABEL[item.status]}</span>
      </div>

      {item.status === 'NOT_NECESSARY' && <p>Não necessário para as responsabilidades atuais</p>}

      {item.status === 'CONNECTED' && (
        <>
          <p>{item.externalAccountRef}</p>
          {canManage && (
            <div className="braco-prep__list-item-actions">
              <button type="button" onClick={disconnectReal} disabled={busy !== null}>
                Desconectar
              </button>
            </div>
          )}
        </>
      )}

      {item.status === 'NEEDS_ATTENTION' && (
        <p className="braco-prep__field-error">
          Não conseguimos confirmar a conexão com o provedor. Reconecte para continuar usando este recurso.
        </p>
      )}

      {(item.status === 'NOT_CONFIGURED' || item.status === 'DISCONNECTED' || item.status === 'NEEDS_ATTENTION') && canManage && (
        <>
          <p>Conecte o WhatsApp usado pela empresa para que este funcionário possa atender clientes.</p>
          <Button onClick={connectReal} disabled={busy !== null}>
            {busy === 'connect' ? 'Redirecionando…' : 'Conectar WhatsApp'}
          </Button>

          {item.canSimulateConnection && !simulating && (
            <button type="button" className="braco-prep__resource-simulate-link" onClick={() => setSimulating(true)}>
              ou simular (apenas dev)
            </button>
          )}
          {item.canSimulateConnection && simulating && (
            <SimulatedConnectForm
              type="WHATSAPP"
              employeeId={employeeId}
              onDone={onChanged}
              onCancel={() => setSimulating(false)}
            />
          )}
        </>
      )}

      {error && <p className="braco-prep__field-error">{error}</p>}
    </Card>
  );
}

// --- Google (Calendar + Tasks) ---------------------------------------------

function GoogleResourceCard({
  item,
  employeeId,
  connection,
  canManage,
  onChanged,
}: {
  item: ResourceItem;
  employeeId: string;
  connection: GoogleStatusView['connection'];
  canManage: boolean;
  onChanged: () => Promise<void>;
}) {
  const isCalendar = item.type === 'GOOGLE_CALENDAR';
  const [busy, setBusy] = useState<'connect' | 'calendars' | 'select' | 'setup' | 'disconnect' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [calendars, setCalendars] = useState<GoogleCalendarOption[] | null>(null);
  const [simulating, setSimulating] = useState(false);

  const sharedConnectionReady = connection?.status === 'CONNECTED';
  const needsConnectOrReconnect = item.status === 'NOT_CONFIGURED' || item.status === 'DISCONNECTED' || item.status === 'NEEDS_ATTENTION';

  // "Se OAuth Google já existir, não pedir novo consentimento
  // desnecessariamente" — quando a autorização compartilhada já está
  // pronta e falta só selecionar o calendário, carrega a lista sozinho
  // (GET, sem efeito colateral) em vez de esperar um clique extra.
  useEffect(() => {
    if (isCalendar && needsConnectOrReconnect && sharedConnectionReady && calendars === null && busy === null && canManage) {
      setBusy('calendars');
      googleApi
        .listCalendars()
        .then(setCalendars)
        .catch((err) => setError(err instanceof ApiError ? err.message : 'Não conseguimos listar os calendários.'))
        .finally(() => setBusy(null));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCalendar, needsConnectOrReconnect, sharedConnectionReady, calendars, canManage]);

  async function connectGoogle() {
    setError(null);
    setBusy('connect');
    try {
      const { authorizationUrl } = await googleApi.connect();
      rememberIntegrationReturnPath();
      window.location.href = authorizationUrl;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não conseguimos iniciar a conexão com o Google.');
      setBusy(null);
    }
  }

  async function selectCalendar(calendarId: string) {
    setError(null);
    setBusy('select');
    try {
      await googleApi.selectCalendar(calendarId);
      await onChanged();
      setCalendars(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não conseguimos acessar este recurso com a conta conectada.');
    } finally {
      setBusy(null);
    }
  }

  async function setupTasks() {
    setError(null);
    setBusy('setup');
    try {
      await googleApi.setupTasks();
      await onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não conseguimos configurar as tarefas agora.');
    } finally {
      setBusy(null);
    }
  }

  async function disconnect() {
    if (!window.confirm(`Desconectar ${LABELS[item.type]}? A preparação pode ficar incompleta se este recurso for obrigatório.`)) return;
    setError(null);
    setBusy('disconnect');
    try {
      if (isCalendar) await googleApi.disconnectCalendar();
      else await googleApi.disconnectTasks();
      await onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não conseguimos desconectar agora.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card className="braco-prep__resource-card">
      <div className="braco-prep__resource-card-header">
        <strong>{LABELS[item.type]}</strong>
        <span>{STATUS_LABEL[item.status]}</span>
      </div>

      {item.status === 'NOT_NECESSARY' && <p>Não necessário para as responsabilidades atuais</p>}

      {item.status === 'CONNECTED' && (
        <>
          <p>{item.externalAccountRef}</p>
          {canManage && (
            <div className="braco-prep__list-item-actions">
              <button type="button" onClick={disconnect} disabled={busy !== null}>
                Desconectar
              </button>
            </div>
          )}
        </>
      )}

      {item.status === 'NEEDS_ATTENTION' && (
        <p className="braco-prep__field-error">Precisa de atenção — reconecte para continuar usando este recurso.</p>
      )}

      {needsConnectOrReconnect && canManage && (
        <>
          <p>
            {isCalendar
              ? 'Seu Braço precisa de uma agenda para oferecer e gerenciar horários.'
              : 'Seu Braço usa tarefas para acompanhar pendências e próximos contatos.'}
          </p>

          {!sharedConnectionReady && (
            <Button onClick={connectGoogle} disabled={busy !== null}>
              {busy === 'connect' ? 'Redirecionando…' : 'Conectar Google'}
            </Button>
          )}

          {sharedConnectionReady && isCalendar && busy === 'calendars' && <p>Carregando calendários…</p>}
          {sharedConnectionReady && isCalendar && calendars && calendars.length === 0 && (
            <p className="braco-prep__field-error">Nenhum calendário disponível nesta conta Google.</p>
          )}
          {sharedConnectionReady && isCalendar && calendars && calendars.length > 0 && (
            <ul className="braco-prep__list">
              {calendars.map((cal) => (
                <li key={cal.id} className="braco-prep__list-item">
                  <span>
                    {cal.summary} {!cal.canWrite && '(somente leitura — sem permissão suficiente)'}
                  </span>
                  <div className="braco-prep__list-item-actions">
                    <button type="button" disabled={!cal.canWrite || busy !== null} onClick={() => selectCalendar(cal.id)}>
                      {busy === 'select' ? 'Selecionando…' : 'Selecionar'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {sharedConnectionReady && !isCalendar && (
            <Button onClick={setupTasks} disabled={busy !== null}>
              {busy === 'setup' ? 'Configurando tarefas…' : 'Configurar tarefas'}
            </Button>
          )}

          {item.canSimulateConnection && !simulating && (
            <button type="button" className="braco-prep__resource-simulate-link" onClick={() => setSimulating(true)}>
              ou simular (apenas dev)
            </button>
          )}
          {item.canSimulateConnection && simulating && (
            <SimulatedConnectForm type={item.type} employeeId={employeeId} onDone={onChanged} onCancel={() => setSimulating(false)} />
          )}
        </>
      )}

      {error && <p className="braco-prep__field-error">{error}</p>}
    </Card>
  );
}

// --- Simulação (dev/test apenas — TD19: nunca conta em produção) -----------

/**
 * Mesmo caminho `SIMULATED` genérico de antes (`ResourcesService.
 * confirmConnection`), agora só acessível como opção secundária
 * explicitamente rotulada — nunca a ação primária — e só quando o
 * backend confirma que este ambiente permite (`canSimulateConnection`).
 */
function SimulatedConnectForm({
  type,
  employeeId,
  onDone,
  onCancel,
}: {
  type: IntegrationType;
  employeeId: string;
  onDone: () => Promise<void>;
  onCancel: () => void;
}) {
  const [refInput, setRefInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setError(null);
    try {
      await preparationApi.confirmResource(employeeId, type, refInput || `demo-${type.toLowerCase()}`);
      await onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'A conexão não foi concluída.');
    }
  }

  return (
    <div className="braco-prep__field">
      <label htmlFor={`sim-ref-${type}`}>Identificação da conta (simulação — sem credencial real neste ambiente)</label>
      <input id={`sim-ref-${type}`} type="text" value={refInput} onChange={(e) => setRefInput(e.target.value)} />
      <div className="braco-prep__list-item-actions">
        <Button onClick={confirm}>Confirmar conexão</Button>
        <button type="button" onClick={onCancel}>
          Cancelar
        </button>
      </div>
      {error && <p className="braco-prep__field-error">{error}</p>}
    </div>
  );
}

