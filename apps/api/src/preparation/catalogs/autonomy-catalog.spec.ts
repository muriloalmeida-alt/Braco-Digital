import { AutonomyLevel } from '@prisma/client';
import {
  ATENDIMENTO_AUTONOMY_DEFAULTS,
  AUTONOMY_RANK,
  getAutonomyDefault,
  isWithinCeiling,
} from './autonomy-catalog';

describe('autonomy-catalog (PD7/TD14)', () => {
  it('ordena permissividade PODE_DECIDIR > SOB_REGRAS > PRECISA_HUMANO', () => {
    expect(AUTONOMY_RANK.PODE_DECIDIR).toBeGreaterThan(AUTONOMY_RANK.PODE_DECIDIR_SOB_REGRAS);
    expect(AUTONOMY_RANK.PODE_DECIDIR_SOB_REGRAS).toBeGreaterThan(AUTONOMY_RANK.PRECISA_HUMANO);
  });

  it('isWithinCeiling aceita o teto e qualquer nível mais conservador', () => {
    expect(isWithinCeiling(AutonomyLevel.PODE_DECIDIR_SOB_REGRAS, AutonomyLevel.PODE_DECIDIR_SOB_REGRAS)).toBe(true);
    expect(isWithinCeiling(AutonomyLevel.PRECISA_HUMANO, AutonomyLevel.PODE_DECIDIR_SOB_REGRAS)).toBe(true);
  });

  it('isWithinCeiling rejeita nível mais permissivo que o teto', () => {
    expect(isWithinCeiling(AutonomyLevel.PODE_DECIDIR, AutonomyLevel.PODE_DECIDIR_SOB_REGRAS)).toBe(false);
  });

  it('tabela oficial do Braço Atendimento v1 tem 14 responsabilidades, recomendação = teto', () => {
    expect(ATENDIMENTO_AUTONOMY_DEFAULTS).toHaveLength(14);
    for (const def of ATENDIMENTO_AUTONOMY_DEFAULTS) {
      expect(def.recommended).toBe(def.ceiling);
    }
  });

  it('as 5 responsabilidades condicionais ao Calendar/Tasks têm teto 🟡, as demais 🟢', () => {
    const yellowKeys = ['reagendar', 'cancelar', 'fazer_follow_up', 'recuperar_contatos', 'enviar_lembretes'];
    for (const key of yellowKeys) {
      expect(getAutonomyDefault('atendimento', key)?.ceiling).toBe(AutonomyLevel.PODE_DECIDIR_SOB_REGRAS);
    }
    expect(getAutonomyDefault('atendimento', 'receber_clientes')?.ceiling).toBe(AutonomyLevel.PODE_DECIDIR);
  });

  it('retorna catálogo vazio para tipo de funcionário desconhecido', () => {
    expect(getAutonomyDefault('vendas', 'qualquer')).toBeUndefined();
  });
});
