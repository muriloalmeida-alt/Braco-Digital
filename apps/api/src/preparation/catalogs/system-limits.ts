/**
 * US10 — System Limits: visíveis, não editáveis, superiores às regras da
 * empresa (docs/design/22-work-manual-content-model.md §7). Conteúdo é de
 * Produto/Design, fixo em código — nunca uma tabela editável.
 */
export interface SystemLimitDefinition {
  key: string;
  label: string;
}

export const SYSTEM_LIMITS: SystemLimitDefinition[] = [
  { key: 'nao_fingir_humano', label: 'Não fingir ser humano' },
  { key: 'nao_inventar_informacao', label: 'Não inventar informação' },
  { key: 'nao_informar_preco_nao_autorizado', label: 'Não informar preço/condição não autorizada' },
  { key: 'nao_negociar_fora_das_regras', label: 'Não negociar fora das regras' },
  { key: 'nao_fazer_promessa_nao_autorizada', label: 'Não fazer promessa não autorizada' },
  { key: 'nao_decidir_excecao_fora_autonomia', label: 'Não tomar decisão excepcional fora da autonomia' },
  { key: 'nao_emitir_diagnostico_regulado', label: 'Não emitir diagnóstico/orientação profissional regulada' },
  { key: 'chamar_humano_em_risco', label: 'Chamar humano em risco, exceção, pedido explícito ou julgamento humano' },
];
