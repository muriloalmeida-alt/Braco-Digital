import { ATENDIMENTO_RESPONSIBILITY_CATALOG, getResponsibilityCatalog } from './responsibility-catalog';

describe('responsibility-catalog (US09)', () => {
  it('tem exatamente 3 essenciais e 11 configuráveis (14 no total, casa com a tabela de autonomia)', () => {
    expect(ATENDIMENTO_RESPONSIBILITY_CATALOG).toHaveLength(14);
    expect(ATENDIMENTO_RESPONSIBILITY_CATALOG.filter((r) => r.essential)).toHaveLength(3);
  });

  it('agendar/confirmar/reagendar/cancelar exigem Calendar; não exigem Tasks', () => {
    for (const key of ['agendar', 'confirmar_agendamento', 'reagendar', 'cancelar']) {
      const def = ATENDIMENTO_RESPONSIBILITY_CATALOG.find((r) => r.key === key)!;
      expect(def.requiresCalendar).toBe(true);
      expect(def.requiresTasks).toBe(false);
    }
  });

  it('follow-up/recuperação/lembretes exigem Tasks; não exigem Calendar', () => {
    for (const key of ['fazer_follow_up', 'recuperar_contatos', 'enviar_lembretes']) {
      const def = ATENDIMENTO_RESPONSIBILITY_CATALOG.find((r) => r.key === key)!;
      expect(def.requiresTasks).toBe(true);
      expect(def.requiresCalendar).toBe(false);
    }
  });

  it('tipo de funcionário desconhecido retorna catálogo vazio (nunca inventa responsabilidade)', () => {
    expect(getResponsibilityCatalog('vendas')).toEqual([]);
  });
});
