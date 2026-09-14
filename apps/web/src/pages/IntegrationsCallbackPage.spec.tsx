import { cleanup, render, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { rememberIntegrationReturnPath } from '../api/integrations';
import { IntegrationsCallbackPage } from './IntegrationsCallbackPage';

/**
 * UI real de Recursos — handler central de callback. "Funciona com hard
 * reload": cada teste monta a página do zero, como um hard reload real
 * faria — só o que está em `sessionStorage` sobrevive; nada aqui depende
 * de estado React de uma navegação anterior.
 */
function renderAt(initialPath: string) {
  const router = createMemoryRouter(
    [
      { path: '/integrations/callback', element: <IntegrationsCallbackPage /> },
      { path: '*', element: null },
    ],
    { initialEntries: [initialPath] },
  );
  render(<RouterProvider router={router} />);
  return { router };
}

beforeEach(() => sessionStorage.clear());
afterEach(() => {
  cleanup();
  sessionStorage.clear();
});

describe('IntegrationsCallbackPage', () => {
  it('sucesso: volta para o return path guardado antes do redirect, com o resultado em location.state', async () => {
    rememberIntegrationReturnPath('/equipe/e1/preparar?etapa=recursos_trabalho');
    const { router } = renderAt('/integrations/callback?google=success');

    await waitFor(() => expect(router.state.location.pathname).toBe('/equipe/e1/preparar'));
    expect(router.state.location.search).toBe('?etapa=recursos_trabalho');
    expect(router.state.location.state).toEqual({ integrationResult: { provider: 'google', result: 'success', reason: null } });
  });

  it('erro: preserva o motivo em location.state, nunca na URL de destino', async () => {
    rememberIntegrationReturnPath('/equipe/e1/preparar?etapa=recursos_trabalho');
    const { router } = renderAt('/integrations/callback?zernio=error&reason=connection_cancelled');

    await waitFor(() => expect(router.state.location.pathname).toBe('/equipe/e1/preparar'));
    expect(router.state.location.search).not.toContain('reason');
    expect(router.state.location.state).toEqual({
      integrationResult: { provider: 'zernio', result: 'error', reason: 'connection_cancelled' },
    });
  });

  it('sem return path guardado (acesso direto), cai no fallback /equipe', async () => {
    const { router } = renderAt('/integrations/callback?google=success');
    await waitFor(() => expect(router.state.location.pathname).toBe('/equipe'));
  });

  it('consome o return path — sobrevive a um hard reload da própria página de callback', async () => {
    rememberIntegrationReturnPath('/equipe/e1/preparar?etapa=recursos_trabalho');
    // Simula o hard reload: desmonta e monta de novo a mesma rota, como o
    // navegador faria ao recarregar fisicamente a página de callback.
    const first = renderAt('/integrations/callback?google=success');
    await waitFor(() => expect(first.router.state.location.pathname).toBe('/equipe/e1/preparar'));
    cleanup();

    // Uma segunda "chegada" ao callback (ex.: usuário voltou/atualizou)
    // não tem mais return path guardado — cai no fallback, nunca reusa o
    // caminho da vez anterior nem trava.
    const second = renderAt('/integrations/callback?google=success');
    await waitFor(() => expect(second.router.state.location.pathname).toBe('/equipe'));
  });
});
