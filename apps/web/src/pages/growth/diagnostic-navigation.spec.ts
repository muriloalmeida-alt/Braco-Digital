import { describe, expect, it } from 'vitest';
import type { DiagnosticAnswers } from '../../api/public';
import { EMPTY_ANSWERS } from './diagnostic-state';
import { isDiagnosticComplete, resolveValidDiagnosticStep } from './diagnostic-navigation';

const COMPLETE_ANSWERS: DiagnosticAnswers = {
  segment: 'Clínicas e saúde',
  teamSize: 'DE_2_A_5',
  needs: ['responder_duvidas', 'organizar_agendamentos'],
  priority: 'responder_duvidas',
  volume: 'DE_11_A_30',
};

function withNeeds(needs: DiagnosticAnswers['needs']): DiagnosticAnswers {
  return { ...EMPTY_ANSWERS, needs };
}

describe('resolveValidDiagnosticStep — issue #28', () => {
  it('fluxo normal: 1 e 2 sempre são válidos, mesmo sem nenhuma resposta', () => {
    expect(resolveValidDiagnosticStep('1', EMPTY_ANSWERS)).toBe('1');
    expect(resolveValidDiagnosticStep('2', EMPTY_ANSWERS)).toBe('2');
  });

  it('?step=3 sem necessidades selecionadas → redireciona para 2', () => {
    expect(resolveValidDiagnosticStep('3', EMPTY_ANSWERS)).toBe('2');
  });

  it('?step=3 com necessidades selecionadas → permanece em 3', () => {
    expect(resolveValidDiagnosticStep('3', withNeeds(['responder_duvidas']))).toBe('3');
  });

  it('?step=4 sem prioridade válida → redireciona para o passo anterior necessário (3, se há needs; 2, se não há)', () => {
    expect(resolveValidDiagnosticStep('4', withNeeds(['responder_duvidas']))).toBe('3');
    expect(resolveValidDiagnosticStep('4', EMPTY_ANSWERS)).toBe('2');
  });

  it('?step=4 com prioridade válida (presente e dentre as necessidades) → permanece em 4', () => {
    const answers = withNeeds(['responder_duvidas', 'cobrar_pagamentos']);
    answers.priority = 'responder_duvidas';
    expect(resolveValidDiagnosticStep('4', answers)).toBe('4');
  });

  it('?step=4 com prioridade que não está mais entre as necessidades → tratado como inválido', () => {
    const answers = withNeeds(['responder_duvidas']);
    answers.priority = 'cobrar_pagamentos'; // nunca deveria acontecer via UI, mas defensivo
    expect(resolveValidDiagnosticStep('4', answers)).toBe('3');
  });

  it('?step=resultado com diagnóstico completo → permanece em resultado', () => {
    expect(resolveValidDiagnosticStep('resultado', COMPLETE_ANSWERS)).toBe('resultado');
  });

  it('?step=resultado com diagnóstico incompleto → redireciona para o primeiro passo necessário', () => {
    expect(resolveValidDiagnosticStep('resultado', EMPTY_ANSWERS)).toBe('2');
    expect(resolveValidDiagnosticStep('resultado', withNeeds(['responder_duvidas']))).toBe('3');
    const semVolume = { ...COMPLETE_ANSWERS, volume: null };
    expect(resolveValidDiagnosticStep('resultado', semVolume)).toBe('4');
  });

  it('?step=contato segue a mesma regra de completude de ?step=resultado', () => {
    expect(resolveValidDiagnosticStep('contato', COMPLETE_ANSWERS)).toBe('contato');
    expect(resolveValidDiagnosticStep('contato', EMPTY_ANSWERS)).toBe('2');
  });

  it('?step=contato com segmento/tamanho de equipe ausentes (mesmo com needs/priority/volume ok) → não é completo', () => {
    const semSegmento: DiagnosticAnswers = { ...COMPLETE_ANSWERS, segment: '' };
    expect(isDiagnosticComplete(semSegmento)).toBe(false);
    expect(resolveValidDiagnosticStep('contato', semSegmento)).toBe('4');
  });

  it('URL inválida (?step=abc) → redireciona para o passo 1, nunca tela em branco', () => {
    expect(resolveValidDiagnosticStep('abc', COMPLETE_ANSWERS)).toBe('1');
    expect(resolveValidDiagnosticStep('', COMPLETE_ANSWERS)).toBe('1');
  });

  it('sem sessionStorage / ?step= ausente (null) → resolve para o passo 1', () => {
    expect(resolveValidDiagnosticStep(null, EMPTY_ANSWERS)).toBe('1');
  });
});

describe('isDiagnosticComplete', () => {
  it('é verdadeiro só com as 5 respostas presentes e consistentes', () => {
    expect(isDiagnosticComplete(COMPLETE_ANSWERS)).toBe(true);
    expect(isDiagnosticComplete(EMPTY_ANSWERS)).toBe(false);
    expect(isDiagnosticComplete({ ...COMPLETE_ANSWERS, teamSize: null })).toBe(false);
  });
});
