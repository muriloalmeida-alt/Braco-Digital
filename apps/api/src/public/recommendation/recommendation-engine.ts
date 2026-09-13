import { CatalogAvailability } from '@prisma/client';

/**
 * US81 — Gerar equipe recomendada. Motor determinístico e puro (sem I/O,
 * sem LLM, sem `Date.now()`/random) — mesmos `answers` +
 * `availabilityByType` sempre produzem o mesmo `ranking`.
 * docs/design/27-team-diagnostic-model.md.
 *
 * Mesmo espírito de `digital-employees/next-step.ts`: tabela extensível
 * em vez de if/else pontual.
 */

export const RECOMMENDATION_RULE_VERSION = 'v1';

export type NeedKey =
  | 'responder_duvidas'
  | 'organizar_agendamentos'
  | 'acompanhar_leads'
  | 'criar_orcamentos'
  | 'manter_contato_pos_venda'
  | 'cobrar_pagamentos'
  | 'follow_up_sumidos';

export type BracoTypeKey = 'atendimento' | 'vendas' | 'orcamentos' | 'pos-venda' | 'financeiro';

/** Ordem estável do portfólio — docs/design/27-team-diagnostic-model.md §5. */
export const PORTFOLIO_ORDER: BracoTypeKey[] = ['atendimento', 'vendas', 'orcamentos', 'pos-venda', 'financeiro'];

interface ScoreRow {
  typeKey: BracoTypeKey;
  points: number;
}

/** Mapeamento base — docs/design/27-team-diagnostic-model.md §3. */
const NEED_POINTS: Record<NeedKey, ScoreRow[]> = {
  responder_duvidas: [{ typeKey: 'atendimento', points: 3 }],
  organizar_agendamentos: [{ typeKey: 'atendimento', points: 3 }],
  acompanhar_leads: [{ typeKey: 'vendas', points: 3 }],
  criar_orcamentos: [{ typeKey: 'orcamentos', points: 3 }],
  manter_contato_pos_venda: [{ typeKey: 'pos-venda', points: 3 }],
  cobrar_pagamentos: [{ typeKey: 'financeiro', points: 3 }],
  follow_up_sumidos: [
    { typeKey: 'vendas', points: 2 },
    { typeKey: 'atendimento', points: 1 },
  ],
};

/** Peso de prioridade — docs/design/27-team-diagnostic-model.md §4. */
const PRIORITY_BONUS = 2;

/**
 * Fragmentos de motivo por (Braço, necessidade) — combinados em frases
 * completas em `buildReason`. docs/design/27-team-diagnostic-model.md §7.
 */
const REASON_FRAGMENTS: Record<BracoTypeKey, Partial<Record<NeedKey, string>>> = {
  atendimento: {
    responder_duvidas: 'você precisa responder clientes',
    organizar_agendamentos: 'manter os agendamentos em dia',
    follow_up_sumidos: 'reconectar com clientes que sumiram',
  },
  vendas: {
    acompanhar_leads: 'oportunidades precisam de acompanhamento até a decisão',
    follow_up_sumidos: 'clientes que sumiram precisam de um novo contato',
  },
  orcamentos: {
    criar_orcamentos: 'pedidos de orçamento precisam ser preparados e acompanhados',
  },
  'pos-venda': {
    manter_contato_pos_venda: 'o relacionamento precisa continuar depois da venda',
  },
  financeiro: {
    cobrar_pagamentos: 'cobranças e pagamentos em atraso precisam de acompanhamento',
  },
};

export interface RecommendationInput {
  /** Ordem de seleção importa — desempate §5.2. */
  needs: NeedKey[];
  priority: NeedKey;
}

/** Disponibilidade lida em runtime do catálogo — nunca hardcoded aqui (§12). */
export type AvailabilityByType = Partial<Record<BracoTypeKey, CatalogAvailability>>;

export interface RankedBraco {
  typeKey: BracoTypeKey;
  reason: string;
  availability: CatalogAvailability;
}

export interface RecommendationResult {
  ranking: RankedBraco[];
  ruleVersion: string;
}

function buildReason(typeKey: BracoTypeKey, contributingNeeds: NeedKey[], priority: NeedKey): string {
  const ordered = [...contributingNeeds].sort((a, b) => {
    if (a === priority) return -1;
    if (b === priority) return 1;
    return 0;
  });
  const fragments = ordered
    .slice(0, 2)
    .map((need) => REASON_FRAGMENTS[typeKey][need])
    .filter((fragment): fragment is string => Boolean(fragment));
  return `Recomendado porque ${fragments.join(' e ')}.`;
}

/**
 * §5 Ranking: soma pontos, remove zerados, ordena, desempata, corta em 3.
 * §6 Disponibilidade: mesclada depois do ranking, nunca antes — o motor
 * nunca mantém cópia própria de Disponível/Em breve.
 */
export function computeRecommendation(
  input: RecommendationInput,
  availabilityByType: AvailabilityByType,
): RecommendationResult {
  const scores = new Map<BracoTypeKey, number>();
  const contributingNeeds = new Map<BracoTypeKey, NeedKey[]>();
  const firstSeenIndex = new Map<BracoTypeKey, number>();

  input.needs.forEach((need, index) => {
    for (const row of NEED_POINTS[need] ?? []) {
      scores.set(row.typeKey, (scores.get(row.typeKey) ?? 0) + row.points);
      if (!firstSeenIndex.has(row.typeKey)) firstSeenIndex.set(row.typeKey, index);
      const list = contributingNeeds.get(row.typeKey) ?? [];
      if (!list.includes(need)) list.push(need);
      contributingNeeds.set(row.typeKey, list);
    }
  });

  for (const row of NEED_POINTS[input.priority] ?? []) {
    scores.set(row.typeKey, (scores.get(row.typeKey) ?? 0) + PRIORITY_BONUS);
  }

  const priorityTypeKeys = new Set((NEED_POINTS[input.priority] ?? []).map((r) => r.typeKey));

  const ranked = Array.from(scores.entries())
    .filter(([, points]) => points > 0)
    .sort(([typeA, pointsA], [typeB, pointsB]) => {
      if (pointsA !== pointsB) return pointsB - pointsA;
      const aPriority = priorityTypeKeys.has(typeA);
      const bPriority = priorityTypeKeys.has(typeB);
      if (aPriority !== bPriority) return aPriority ? -1 : 1;
      const aSeen = firstSeenIndex.get(typeA) ?? Number.MAX_SAFE_INTEGER;
      const bSeen = firstSeenIndex.get(typeB) ?? Number.MAX_SAFE_INTEGER;
      if (aSeen !== bSeen) return aSeen - bSeen;
      return PORTFOLIO_ORDER.indexOf(typeA) - PORTFOLIO_ORDER.indexOf(typeB);
    })
    .slice(0, 3)
    .map(([typeKey]) => ({
      typeKey,
      reason: buildReason(typeKey, contributingNeeds.get(typeKey) ?? [], input.priority),
      // Fail-closed: tipo fora do catálogo lido em runtime nunca é
      // tratado como disponível por omissão.
      availability: availabilityByType[typeKey] ?? CatalogAvailability.COMING_SOON,
    }));

  return { ranking: ranked, ruleVersion: RECOMMENDATION_RULE_VERSION };
}
