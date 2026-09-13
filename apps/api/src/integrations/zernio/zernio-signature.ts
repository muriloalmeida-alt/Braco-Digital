import crypto from 'node:crypto';

/**
 * Assinatura de webhook do Zernio (issue #30):
 * `lowercase_hex(HMAC-SHA256(raw_request_body, ZERNIO_WEBHOOK_SECRET))`.
 *
 * `rawBody` precisa ser o corpo exatamente como chegou na rede, antes de
 * qualquer parse JSON — reserializar o objeto parseado produz bytes
 * diferentes (ordem de chaves, espaçamento) e quebraria a verificação
 * silenciosamente. Ver `main.ts` (captura do corpo bruto só nesta rota).
 *
 * Comparação em tempo constante (`timingSafeEqual`) — comparar strings
 * hex com `===` vazaria por timing quantos caracteres iniciais batem.
 */
export function verifyZernioSignature(rawBody: Buffer, receivedHex: string, secret: string): boolean {
  if (!/^[a-f0-9]{64}$/.test(receivedHex)) return false;

  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest();
  const received = Buffer.from(receivedHex, 'hex');

  return received.length === expected.length && crypto.timingSafeEqual(received, expected);
}
