import { request, type EmployeeType } from './client';

// --- Diagnóstico (US79/80/81) -------------------------------------------

export type NeedKey =
  | 'responder_duvidas'
  | 'organizar_agendamentos'
  | 'acompanhar_leads'
  | 'criar_orcamentos'
  | 'manter_contato_pos_venda'
  | 'cobrar_pagamentos'
  | 'follow_up_sumidos';

export type TeamSize = 'SO_EU' | 'DE_2_A_5' | 'DE_6_A_20' | 'DE_21_A_50' | 'MAIS_DE_50';
export type VolumeRange = 'ATE_10' | 'DE_11_A_30' | 'DE_31_A_100' | 'MAIS_DE_100' | 'NAO_SEI_DIZER';

export interface DiagnosticAnswers {
  segment: string;
  teamSize: TeamSize | null;
  needs: NeedKey[];
  priority: NeedKey | null;
  volume: VolumeRange | null;
}

export interface RankedBraco {
  typeKey: string;
  reason: string;
  availability: 'AVAILABLE' | 'COMING_SOON';
}

export interface RecommendationResult {
  ranking: RankedBraco[];
  ruleVersion: string;
}

export interface CreateLeadInput {
  name: string;
  companyName: string;
  whatsapp: string;
  email?: string;
  segment: string;
  teamSize: TeamSize;
  volume: VolumeRange;
  answers: { needs: NeedKey[]; priority: NeedKey };
  sessionId?: string;
}

/**
 * Product Review 01 — três modos de captação de lead (substituindo o
 * booleano anterior, que não era fail-closed). A UI nunca infere o modo
 * sozinha: sempre pergunta a `GET /public/leads/capture-mode`, mesmo
 * princípio de autoridade de backend usado em `canSimulateConnection`
 * (Track A).
 */
export type LeadCaptureMode = 'DISABLED' | 'SYNTHETIC' | 'REAL';

export const publicApi = {
  listEmployeeTypes: () => request<EmployeeType[]>('/public/employee-types'),

  getRecommendation: (needs: NeedKey[], priority: NeedKey) =>
    request<RecommendationResult>('/public/diagnostics/recommendation', {
      method: 'POST',
      body: JSON.stringify({ needs, priority }),
    }),

  getLeadCaptureMode: () => request<{ mode: LeadCaptureMode }>('/public/leads/capture-mode'),

  createLead: (input: CreateLeadInput) =>
    request<{ id: string; ranking: RankedBraco[]; ruleVersion: string; isSynthetic: boolean }>('/public/leads', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
};
