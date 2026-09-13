import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DiagnosticAnswers, LeadCaptureMode } from '../../api/public';
import { publicApi } from '../../api/public';
import { DiagnosticPage } from './DiagnosticPage';
import { EMPTY_ANSWERS, saveDiagnosticAnswers } from './diagnostic-state';

/**
 * Issue #28 — "Diagnóstico: acesso direto/hard reload em ?step=... produz
 * tela em branco". Cada teste monta `DiagnosticPage` do zero (como um
 * hard reload real faria: só o que está em sessionStorage sobrevive,
 * `recommendation`/`ruleVersion` sempre nascem `null` na montagem).
 */

vi.mock('../../api/growth-analytics', () => ({
  trackGrowthEvent: vi.fn(),
}));

vi.mock('../../api/public', () => ({
  publicApi: {
    listEmployeeTypes: vi.fn(),
    getRecommendation: vi.fn(),
    getLeadCaptureMode: vi.fn(),
    createLead: vi.fn(),
  },
}));

const COMPLETE_ANSWERS: DiagnosticAnswers = {
  segment: 'Clínicas e saúde',
  teamSize: 'DE_2_A_5',
  needs: ['responder_duvidas', 'organizar_agendamentos'],
  priority: 'responder_duvidas',
  volume: 'DE_11_A_30',
};

const RECOMMENDATION_RESULT = {
  ranking: [{ typeKey: 'atendimento', reason: 'Você precisa responder clientes.', availability: 'AVAILABLE' as const }],
  ruleVersion: 'v1',
};

function mockCaptureMode(mode: LeadCaptureMode) {
  vi.mocked(publicApi.getLeadCaptureMode).mockResolvedValue({ mode });
}

function renderAt(initialPath: string) {
  const router = createMemoryRouter([{ path: '/monte-sua-equipe', element: <DiagnosticPage /> }], {
    initialEntries: [initialPath],
  });
  render(<RouterProvider router={router} />);
  return router;
}

beforeEach(() => {
  sessionStorage.clear();
  vi.mocked(publicApi.getLeadCaptureMode).mockReset();
  vi.mocked(publicApi.getRecommendation).mockReset();
  mockCaptureMode('DISABLED');
});

afterEach(() => {
  // Sem `test.globals: true` no vitest.config.ts, o auto-cleanup do RTL
  // não se registra sozinho — sem isso, o DOM de um teste sobrevive para
  // o próximo (vários testes montam <DiagnosticPage> no mesmo arquivo).
  cleanup();
  sessionStorage.clear();
});

describe('DiagnosticPage — hard reload (issue #28)', () => {
  it('1. fluxo normal: ?step=3 com necessidades salvas permanece no passo 3', async () => {
    saveDiagnosticAnswers({ ...EMPTY_ANSWERS, needs: ['responder_duvidas'] });
    renderAt('/monte-sua-equipe?step=3');
    expect(
      await screen.findByText('Se você pudesse resolver uma dessas coisas primeiro, qual seria?'),
    ).toBeTruthy();
  });

  it('2. hard reload em ?step=3 sem necessidades redireciona para o passo 2', async () => {
    saveDiagnosticAnswers(EMPTY_ANSWERS);
    renderAt('/monte-sua-equipe?step=3');
    expect(await screen.findByText('O que está ficando para depois?')).toBeTruthy();
  });

  it('3. hard reload em ?step=4 com prioridade válida permanece no passo 4', async () => {
    saveDiagnosticAnswers({
      ...EMPTY_ANSWERS,
      needs: ['responder_duvidas', 'cobrar_pagamentos'],
      priority: 'responder_duvidas',
    });
    renderAt('/monte-sua-equipe?step=4');
    expect(await screen.findByText('Quantos contatos ou demandas desse tipo chegam em um dia normal?')).toBeTruthy();
  });

  it('4. hard reload em ?step=4 sem prioridade redireciona para o passo anterior necessário (3)', async () => {
    saveDiagnosticAnswers({ ...EMPTY_ANSWERS, needs: ['responder_duvidas'] });
    renderAt('/monte-sua-equipe?step=4');
    expect(
      await screen.findByText('Se você pudesse resolver uma dessas coisas primeiro, qual seria?'),
    ).toBeTruthy();
  });

  it('5. hard reload em ?step=resultado com diagnóstico completo recalcula a recomendação via backend', async () => {
    saveDiagnosticAnswers(COMPLETE_ANSWERS);
    vi.mocked(publicApi.getRecommendation).mockResolvedValue(RECOMMENDATION_RESULT);

    renderAt('/monte-sua-equipe?step=resultado');

    // Nunca tela em branco: a interstitial de carregamento aparece antes do resultado.
    expect(await screen.findByText('Carregando sua recomendação…')).toBeTruthy();
    expect(await screen.findByText('Sua equipe recomendada')).toBeTruthy();
    expect(publicApi.getRecommendation).toHaveBeenCalledWith(COMPLETE_ANSWERS.needs, COMPLETE_ANSWERS.priority);
    expect(publicApi.getRecommendation).toHaveBeenCalledTimes(1);
  });

  it('6. hard reload em ?step=resultado com diagnóstico incompleto redireciona sem chamar o backend', async () => {
    saveDiagnosticAnswers(EMPTY_ANSWERS);
    renderAt('/monte-sua-equipe?step=resultado');
    expect(await screen.findByText('O que está ficando para depois?')).toBeTruthy();
    expect(publicApi.getRecommendation).not.toHaveBeenCalled();
  });

  it('7. hard reload em ?step=contato com captureMode DISABLED redireciona para resultado sem exibir o formulário', async () => {
    saveDiagnosticAnswers(COMPLETE_ANSWERS);
    mockCaptureMode('DISABLED');
    vi.mocked(publicApi.getRecommendation).mockResolvedValue(RECOMMENDATION_RESULT);

    renderAt('/monte-sua-equipe?step=contato');

    // Em nenhum momento o campo de nome do formulário deve aparecer.
    expect(screen.queryByLabelText('Nome *')).toBeNull();
    expect(await screen.findByText('Sua equipe recomendada')).toBeTruthy();
    expect(screen.queryByLabelText('Nome *')).toBeNull();
  });

  it('8. hard reload em ?step=contato com SYNTHETIC exibe o formulário com o banner de teste', async () => {
    saveDiagnosticAnswers(COMPLETE_ANSWERS);
    mockCaptureMode('SYNTHETIC');
    vi.mocked(publicApi.getRecommendation).mockResolvedValue(RECOMMENDATION_RESULT);

    renderAt('/monte-sua-equipe?step=contato');

    expect(await screen.findByLabelText('Nome *')).toBeTruthy();
    expect(screen.getByText('Ambiente de teste — use apenas dados fictícios.')).toBeTruthy();
  });

  it('9. URL com step inválido (?step=abc) redireciona para o passo 1, nunca tela em branco', async () => {
    saveDiagnosticAnswers(COMPLETE_ANSWERS);
    renderAt('/monte-sua-equipe?step=abc');
    expect(await screen.findByText('Conte um pouco sobre sua empresa')).toBeTruthy();
  });

  it('10. acesso sem sessionStorage (nenhuma resposta salva) redireciona graciosamente, sem crash', async () => {
    // sessionStorage já está limpo pelo beforeEach — nem loadDiagnosticAnswers grava nada.
    renderAt('/monte-sua-equipe?step=resultado');
    expect(await screen.findByText('O que está ficando para depois?')).toBeTruthy();
    expect(publicApi.getRecommendation).not.toHaveBeenCalled();
  });

  it('11. falha de rede ao reconstruir a recomendação exibe estado recuperável, não tela em branco', async () => {
    saveDiagnosticAnswers(COMPLETE_ANSWERS);
    vi.mocked(publicApi.getRecommendation).mockRejectedValueOnce(new Error('network'));

    renderAt('/monte-sua-equipe?step=resultado');

    const retryButton = await screen.findByRole('button', { name: 'Tentar novamente' });
    expect(screen.getByText('Não foi possível recuperar seu diagnóstico')).toBeTruthy();

    vi.mocked(publicApi.getRecommendation).mockResolvedValueOnce(RECOMMENDATION_RESULT);
    retryButton.click();

    expect(await screen.findByText('Sua equipe recomendada')).toBeTruthy();
    expect(publicApi.getRecommendation).toHaveBeenCalledTimes(2);
  });

  it('12. back/forward após recuperação não recria loop de navegação nem refaz a chamada ao backend', async () => {
    saveDiagnosticAnswers(COMPLETE_ANSWERS);
    vi.mocked(publicApi.getRecommendation).mockResolvedValue(RECOMMENDATION_RESULT);

    const router = createMemoryRouter([{ path: '/monte-sua-equipe', element: <DiagnosticPage /> }], {
      initialEntries: ['/monte-sua-equipe?step=4', '/monte-sua-equipe?step=resultado'],
      initialIndex: 1,
    });
    render(<RouterProvider router={router} />);

    expect(await screen.findByText('Sua equipe recomendada')).toBeTruthy();
    expect(publicApi.getRecommendation).toHaveBeenCalledTimes(1);

    router.navigate(-1);
    expect(await screen.findByText('Quantos contatos ou demandas desse tipo chegam em um dia normal?')).toBeTruthy();

    router.navigate(1);
    expect(await screen.findByText('Sua equipe recomendada')).toBeTruthy();
    // `recommendation` continuou em memória — nenhuma nova chamada de rede.
    expect(publicApi.getRecommendation).toHaveBeenCalledTimes(1);
  });

  it('preserva o fluxo normal 1 → 2 → 3 → 4 sem nenhum redirect inesperado', async () => {
    renderAt('/monte-sua-equipe');
    expect(await screen.findByText('Conte um pouco sobre sua empresa')).toBeTruthy();
  });

  it('espera que a validação use replace, sem fazer chamada de recomendação em passos anteriores a 4', async () => {
    renderAt('/monte-sua-equipe?step=1');
    await waitFor(() => expect(publicApi.getLeadCaptureMode).toHaveBeenCalled());
    expect(publicApi.getRecommendation).not.toHaveBeenCalled();
  });
});
