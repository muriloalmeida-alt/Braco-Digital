import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { consumeIntegrationReturnPath } from '../api/integrations';

export interface IntegrationCallbackResult {
  provider: 'zernio' | 'google';
  result: 'success' | 'error';
  reason: string | null;
}

/**
 * Handler central de callback (issue #38 — UI real de Recursos). O
 * backend (`ZernioConnectionController`/`GoogleConnectionController`)
 * processa o retorno do provedor e redireciona para cá com uma
 * querystring de resultado — nunca com token, refresh token ou qualquer
 * dado sensível (ver `docs/technical/21-zernio-whatsapp-integration.md`
 * e `22-google-workspace-integration.md`).
 *
 * Desenhado para sobreviver a hard reload: nada aqui depende de estado
 * React de uma navegação anterior. O *return path* (para onde voltar) foi
 * guardado em `sessionStorage` (same-origin, sem PII) antes do redirect
 * para o provedor — é lido, validado e imediatamente apagado aqui. Os
 * parâmetros de resultado são passados adiante só via `location.state`
 * (nunca ficam na URL depois deste redirecionamento — `navigate(...,
 * {replace: true})` troca a entrada do histórico).
 */
export function IntegrationsCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const provider: IntegrationCallbackResult['provider'] | null = searchParams.has('google')
      ? 'google'
      : searchParams.has('zernio')
        ? 'zernio'
        : null;
    const rawResult = provider ? searchParams.get(provider) : null;
    const result: IntegrationCallbackResult['result'] = rawResult === 'success' ? 'success' : 'error';
    const reason = searchParams.get('reason');

    // Fallback para "/equipe" cobre tanto quem chegou aqui sem nunca ter
    // guardado um return path (acesso direto à rota) quanto uma
    // entrada inválida/não same-origin — nunca segue um destino externo.
    const returnPath = consumeIntegrationReturnPath('/equipe');

    navigate(returnPath, {
      replace: true,
      state: provider ? ({ integrationResult: { provider, result, reason } } satisfies { integrationResult: IntegrationCallbackResult }) : undefined,
    });
  }, [navigate, searchParams]);

  return (
    <div className="braco-integrations-callback">
      <p>Finalizando conexão…</p>
    </div>
  );
}
