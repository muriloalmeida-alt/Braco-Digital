/**
 * Normalização de WhatsApp para E.164 (US83, mesma convenção conceitual
 * de `docs/technical/05-whatsapp.md` §4). Assume DDI 55 (Brasil) quando
 * o visitante não digita `+`. Pura — sem I/O.
 */
export function normalizeWhatsapp(raw: string): string | null {
  const digitsOnly = raw.replace(/[^\d+]/g, '');
  const withCountryCode = digitsOnly.startsWith('+') ? digitsOnly : `+55${digitsOnly.replace(/^0+/, '')}`;
  const isValidE164 = /^\+[1-9]\d{7,14}$/.test(withCountryCode);
  return isValidE164 ? withCountryCode : null;
}
