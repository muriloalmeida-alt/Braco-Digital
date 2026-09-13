/**
 * PD6 — Launch Gate / Legal (Privacidade do lead da landing).
 * docs/technical/16-product-decisions-required.md, docs/technical/20-
 * sprint-02-tech-readiness.md §24.3: "desenvolvimento não é bloqueado;
 * publicação com captação real de lead é bloqueada até validação
 * jurídico/compliance".
 *
 * Product + Product Design Review 01 apontou uma falha de design: a
 * versão anterior deste arquivo usava um único booleano
 * (`PUBLIC_LEAD_CAPTURE_REAL`) e, quando "false", ainda ACEITAVA e
 * PERSISTIA nome/empresa/WhatsApp/e-mail reais — só marcava
 * `isSynthetic=true`. Isso não é fail-closed: dado pessoal real não
 * vira sintético por causa de uma flag. A revisão corrigida usa três
 * modos explícitos, e o modo `DISABLED` **recusa a submissão inteira**
 * antes de tocar em qualquer campo — nenhuma PII chega perto do banco.
 */
export type PublicLeadCaptureMode = 'DISABLED' | 'SYNTHETIC' | 'REAL';

const RAW_TO_MODE: Record<string, PublicLeadCaptureMode> = {
  REAL: 'REAL',
  SYNTHETIC: 'SYNTHETIC',
  TEST: 'SYNTHETIC', // sinônimo aceito — "ambiente de teste" é a linguagem voltada ao usuário
  DISABLED: 'DISABLED',
};

/**
 * `PUBLIC_LEAD_CAPTURE_MODE` controla o modo. Fail-closed por
 * construção: **qualquer** valor ausente, vazio, mal digitado ou não
 * reconhecido cai em `DISABLED` — o modo mais restritivo — nunca em
 * `SYNTHETIC` ou `REAL` por omissão/acidente. Só um valor
 * explicitamente reconhecido ativa um modo menos restritivo.
 */
export function getPublicLeadCaptureMode(): PublicLeadCaptureMode {
  const raw = (process.env.PUBLIC_LEAD_CAPTURE_MODE ?? '').trim().toUpperCase();
  return RAW_TO_MODE[raw] ?? 'DISABLED';
}
