import type { DiagnosticAnswers, NeedKey, TeamSize, VolumeRange } from '../../api/public';

/**
 * Estado do diagnóstico — vive só no cliente até virar Lead (US78,
 * docs/technical/20-sprint-02-tech-readiness.md §8). `sessionStorage`
 * (não `localStorage`): não deve sobreviver ao fechamento da aba.
 */
const STORAGE_KEY = 'braco.growth.diagnostic';

export const EMPTY_ANSWERS: DiagnosticAnswers = {
  segment: '',
  teamSize: null,
  needs: [],
  priority: null,
  volume: null,
};

export function loadDiagnosticAnswers(): DiagnosticAnswers {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY_ANSWERS };
    return { ...EMPTY_ANSWERS, ...JSON.parse(raw) };
  } catch {
    return { ...EMPTY_ANSWERS };
  }
}

export function saveDiagnosticAnswers(answers: DiagnosticAnswers) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
}

export function clearDiagnosticAnswers() {
  sessionStorage.removeItem(STORAGE_KEY);
}

// --- Catálogos de opções (PRD 04 §8/§9/§11) -------------------------------

export const SEGMENT_OPTIONS = [
  'Clínicas e saúde',
  'Serviços profissionais',
  'Varejo e comércio',
  'Alimentação',
  'Educação',
  'Beleza e estética',
  'Outro',
];

export const TEAM_SIZE_OPTIONS: { value: TeamSize; label: string }[] = [
  { value: 'SO_EU', label: 'Só eu' },
  { value: 'DE_2_A_5', label: '2–5 pessoas' },
  { value: 'DE_6_A_20', label: '6–20 pessoas' },
  { value: 'DE_21_A_50', label: '21–50 pessoas' },
  { value: 'MAIS_DE_50', label: 'Mais de 50 pessoas' },
];

export const NEED_OPTIONS: { value: NeedKey; label: string }[] = [
  { value: 'responder_duvidas', label: 'Responder clientes e tirar dúvidas' },
  { value: 'organizar_agendamentos', label: 'Organizar e realizar agendamentos' },
  { value: 'acompanhar_leads', label: 'Acompanhar leads e oportunidades' },
  { value: 'criar_orcamentos', label: 'Criar e acompanhar orçamentos' },
  { value: 'manter_contato_pos_venda', label: 'Manter contato depois da venda' },
  { value: 'cobrar_pagamentos', label: 'Cobrar pagamentos e atrasos' },
  { value: 'follow_up_sumidos', label: 'Fazer follow-up de clientes que sumiram' },
];

export const VOLUME_OPTIONS: { value: VolumeRange; label: string }[] = [
  { value: 'ATE_10', label: 'Até 10' },
  { value: 'DE_11_A_30', label: '11–30' },
  { value: 'DE_31_A_100', label: '31–100' },
  { value: 'MAIS_DE_100', label: 'Mais de 100' },
  { value: 'NAO_SEI_DIZER', label: 'Não sei dizer' },
];

export const EMPLOYEE_TYPE_LABELS: Record<string, { name: string; role: string }> = {
  atendimento: { name: 'Braço Atendimento', role: 'Recepcionista Digital' },
  vendas: { name: 'Braço Vendas', role: 'Vendedor Digital' },
  orcamentos: { name: 'Braço Orçamentos', role: 'Especialista em Orçamentos' },
  'pos-venda': { name: 'Braço Pós-venda', role: 'Especialista em Pós-venda' },
  financeiro: { name: 'Braço Financeiro', role: 'Especialista Financeiro' },
};
