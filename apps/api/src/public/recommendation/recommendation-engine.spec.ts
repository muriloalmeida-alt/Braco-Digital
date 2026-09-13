import { CatalogAvailability } from '@prisma/client';
import { computeRecommendation, RECOMMENDATION_RULE_VERSION } from './recommendation-engine';

describe('computeRecommendation', () => {
  it('combina até duas necessidades no motivo, priorizando a necessidade principal (§7 exemplo do doc)', () => {
    const result = computeRecommendation(
      { needs: ['responder_duvidas', 'organizar_agendamentos'], priority: 'responder_duvidas' },
      {},
    );
    expect(result.ranking[0].typeKey).toBe('atendimento');
    expect(result.ranking[0].reason).toBe(
      'Recomendado porque você precisa responder clientes e manter os agendamentos em dia.',
    );
  });

  it('aplica o bônus de +2 pontos da prioridade (§4)', () => {
    const withoutPriorityBoost = computeRecommendation(
      { needs: ['acompanhar_leads', 'cobrar_pagamentos'], priority: 'acompanhar_leads' },
      {},
    );
    // vendas = 3 (necessidade) + 2 (prioridade) = 5; financeiro = 3
    expect(withoutPriorityBoost.ranking[0]).toMatchObject({ typeKey: 'vendas' });
    expect(withoutPriorityBoost.ranking[1]).toMatchObject({ typeKey: 'financeiro' });
  });

  it('remove Braços com score zero', () => {
    const result = computeRecommendation({ needs: ['acompanhar_leads'], priority: 'acompanhar_leads' }, {});
    expect(result.ranking).toHaveLength(1);
    expect(result.ranking[0].typeKey).toBe('vendas');
  });

  it('desempate: em empate de pontos, o Braço ligado à prioridade vem primeiro (§5.2.1)', () => {
    const result = computeRecommendation(
      { needs: ['acompanhar_leads', 'criar_orcamentos', 'cobrar_pagamentos'], priority: 'criar_orcamentos' },
      {},
    );
    // vendas=3, orcamentos=3+2=5, financeiro=3 → orçamentos primeiro pela prioridade
    expect(result.ranking[0].typeKey).toBe('orcamentos');
  });

  it('desempate: sem prioridade ligada, vence a ordem de seleção das necessidades (§5.2.2)', () => {
    // Prioridade real (responder_duvidas, presente em needs) fica isolada
    // em 1º por score (5). orcamentos e vendas empatam em 3, nenhum
    // ligado à prioridade — orcamentos foi selecionado antes de vendas,
    // deve vir primeiro mesmo a ordem do portfólio (§5.2.3) dizendo o
    // contrário (vendas < orcamentos nessa ordem).
    const result = computeRecommendation(
      { needs: ['responder_duvidas', 'criar_orcamentos', 'acompanhar_leads'], priority: 'responder_duvidas' },
      {},
    );
    expect(result.ranking.map((r) => r.typeKey)).toEqual(['atendimento', 'orcamentos', 'vendas']);
  });

  it('desempate: sem prioridade nem ordem de seleção divergente, vence a ordem estável do portfólio (§5.2.3)', () => {
    const result = computeRecommendation(
      { needs: ['responder_duvidas', 'acompanhar_leads', 'cobrar_pagamentos'], priority: 'responder_duvidas' },
      {},
    );
    // vendas e financeiro empatados em 3, selecionados na mesma ordem do
    // portfólio (vendas antes de financeiro) — portfólio decide igual.
    expect(result.ranking.map((r) => r.typeKey)).toEqual(['atendimento', 'vendas', 'financeiro']);
  });

  it('nunca retorna mais de 3 Braços (§5.3)', () => {
    const result = computeRecommendation(
      {
        needs: [
          'responder_duvidas',
          'acompanhar_leads',
          'criar_orcamentos',
          'manter_contato_pos_venda',
          'cobrar_pagamentos',
        ],
        priority: 'responder_duvidas',
      },
      {},
    );
    expect(result.ranking).toHaveLength(3);
    expect(result.ranking[0].typeKey).toBe('atendimento');
  });

  it('mescla disponibilidade lida em runtime, nunca mantém cópia própria (§6)', () => {
    const result = computeRecommendation(
      { needs: ['responder_duvidas', 'acompanhar_leads'], priority: 'responder_duvidas' },
      { atendimento: CatalogAvailability.AVAILABLE, vendas: CatalogAvailability.COMING_SOON },
    );
    expect(result.ranking.find((r) => r.typeKey === 'atendimento')?.availability).toBe('AVAILABLE');
    expect(result.ranking.find((r) => r.typeKey === 'vendas')?.availability).toBe('COMING_SOON');
  });

  it('fail-closed: tipo ausente do mapa de disponibilidade nunca é tratado como disponível', () => {
    const result = computeRecommendation({ needs: ['cobrar_pagamentos'], priority: 'cobrar_pagamentos' }, {});
    expect(result.ranking[0].availability).toBe('COMING_SOON');
  });

  it('é determinístico: mesmas entradas produzem sempre o mesmo resultado', () => {
    const input = { needs: ['responder_duvidas', 'follow_up_sumidos'] as const, priority: 'follow_up_sumidos' as const };
    const availability = { atendimento: CatalogAvailability.AVAILABLE };
    const a = computeRecommendation({ needs: [...input.needs], priority: input.priority }, availability);
    const b = computeRecommendation({ needs: [...input.needs], priority: input.priority }, availability);
    expect(a).toEqual(b);
  });

  it('grava a versão da regra usada (§11 / TD16)', () => {
    const result = computeRecommendation({ needs: ['responder_duvidas'], priority: 'responder_duvidas' }, {});
    expect(result.ruleVersion).toBe(RECOMMENDATION_RULE_VERSION);
  });

  it('necessidade que aponta para dois Braços (follow_up_sumidos) distribui pontos corretamente', () => {
    const result = computeRecommendation({ needs: ['follow_up_sumidos'], priority: 'follow_up_sumidos' }, {});
    // vendas = 2 + 2 (prioridade) = 4; atendimento = 1
    expect(result.ranking[0]).toMatchObject({ typeKey: 'vendas' });
    expect(result.ranking[1]).toMatchObject({ typeKey: 'atendimento' });
  });
});
