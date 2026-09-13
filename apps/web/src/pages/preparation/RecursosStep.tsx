import { useEffect, useState } from 'react';
import { ApiError } from '../../api/client';
import { preparationApi, type IntegrationType, type ResourceItem } from '../../api/preparation';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';

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

/**
 * US14 — Recursos de trabalho. docs/design/24-work-resources-ui-spec.md.
 *
 * ATENÇÃO: sem credenciais reais de BSP/Google nesta sprint
 * (docs/technical/20-sprint-02-tech-readiness.md §24.2), "Conectar" abre
 * um passo de confirmação manual no lugar do redirect real de OAuth —
 * ver `resources.service.ts` no backend. É o ponto exato onde a
 * integração real entra depois; esta tela não finge que a conexão é
 * real.
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
  const [items, setItems] = useState<ResourceItem[]>([]);
  const [connecting, setConnecting] = useState<IntegrationType | null>(null);
  const [refInput, setRefInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  function load() {
    preparationApi.getResources(employeeId).then(setItems);
  }

  useEffect(load, [employeeId]);

  async function startConnect(type: IntegrationType) {
    setError(null);
    await preparationApi.connectResource(employeeId, type);
    setConnecting(type);
    setRefInput('');
    load();
  }

  async function confirmConnect() {
    if (!connecting) return;
    setError(null);
    try {
      await preparationApi.confirmResource(employeeId, connecting, refInput || `demo-${connecting.toLowerCase()}`);
      setConnecting(null);
      load();
      await onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'A conexão não foi concluída.');
    }
  }

  async function disconnect(type: IntegrationType) {
    if (!window.confirm('Desconectar este recurso?')) return;
    await preparationApi.disconnectResource(employeeId, type);
    load();
    await onSaved();
  }

  return (
    <div>
      {items.map((item) => (
        <Card key={item.type} className="braco-prep__resource-card">
          <div className="braco-prep__resource-card-header">
            <strong>{LABELS[item.type]}</strong>
            <span>{STATUS_LABEL[item.status]}</span>
          </div>

          {item.status === 'NOT_NECESSARY' && <p>Não necessário para as responsabilidades atuais</p>}

          {item.status === 'CONNECTED' && (
            <>
              <p>{item.externalAccountRef}</p>
              {item.connectionMode === 'SIMULATED' && !item.canSimulateConnection && (
                <p className="braco-prep__field-error">
                  Conexão simulada — não conta como verificada neste ambiente.
                </p>
              )}
              <div className="braco-prep__list-item-actions">
                <button type="button" onClick={() => disconnect(item.type)}>
                  Desconectar
                </button>
              </div>
            </>
          )}

          {(item.status === 'NOT_CONFIGURED' || item.status === 'DISCONNECTED' || item.status === 'CONNECTING') &&
            connecting !== item.type &&
            (item.canSimulateConnection ? (
              <Button onClick={() => startConnect(item.type)}>Conectar {LABELS[item.type]}</Button>
            ) : (
              <p>Integração real ainda não disponível neste ambiente.</p>
            ))}

          {connecting === item.type && item.canSimulateConnection && (
            <div className="braco-prep__field">
              <label htmlFor={`ref-${item.type}`}>
                Identificação da conta (simulação — sem credencial de BSP/Google neste ambiente)
              </label>
              <input id={`ref-${item.type}`} type="text" value={refInput} onChange={(e) => setRefInput(e.target.value)} />
              <Button onClick={confirmConnect}>Confirmar conexão</Button>
            </div>
          )}
        </Card>
      ))}

      {error && <p className="braco-prep__field-error">{error}</p>}

      <div className="braco-prep__actions">
        <Button onClick={onContinue}>Ir para revisão</Button>
      </div>
    </div>
  );
}
