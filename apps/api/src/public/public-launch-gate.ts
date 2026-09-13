/**
 * PD6 — Launch Gate / Legal (Privacidade do lead da landing).
 * docs/technical/16-product-decisions-required.md, docs/technical/20-
 * sprint-02-tech-readiness.md §24.3: "desenvolvimento não é bloqueado;
 * publicação com captação real de lead é bloqueada até validação
 * jurídico/compliance". Enquanto isso, dev/staging usam dados sintéticos.
 *
 * Controle técnico (decisão de Engenharia, registrada em TD19,
 * `docs/technical/17-technical-decisions.md`): a variável de ambiente
 * `PUBLIC_LEAD_CAPTURE_REAL` precisa valer exatamente `"true"` para que
 * um lead seja gravado como captação real. Ausente/qualquer outro valor
 * → captação permanece sintética, mesmo em produção, mesmo que alguém
 * esqueça de configurar algo. Fail-closed de propósito: o padrão nunca
 * captura dado real por omissão — alguém precisa decidir ativamente
 * "true" depois que o jurídico validar o aviso de privacidade.
 */
export function isRealPublicCaptureEnabled(): boolean {
  return process.env.PUBLIC_LEAD_CAPTURE_REAL === 'true';
}
