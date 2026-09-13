import crypto from 'node:crypto';
import { verifyZernioSignature } from './zernio-signature';

const SECRET = 'test-webhook-secret';

function sign(body: Buffer, secret = SECRET): string {
  return crypto.createHmac('sha256', secret).update(body).digest('hex');
}

describe('verifyZernioSignature', () => {
  it('aceita uma assinatura HMAC válida sobre o corpo bruto', () => {
    const body = Buffer.from(JSON.stringify({ id: '1', event: 'message.received' }));
    expect(verifyZernioSignature(body, sign(body), SECRET)).toBe(true);
  });

  it('rejeita quando o corpo foi alterado após a assinatura ser calculada', () => {
    const original = Buffer.from(JSON.stringify({ id: '1', event: 'message.received' }));
    const signature = sign(original);
    const tampered = Buffer.from(JSON.stringify({ id: '1', event: 'message.received', extra: true }));
    expect(verifyZernioSignature(tampered, signature, SECRET)).toBe(false);
  });

  it('rejeita quando o segredo usado para assinar é diferente', () => {
    const body = Buffer.from(JSON.stringify({ id: '1' }));
    const signature = sign(body, 'outro-segredo');
    expect(verifyZernioSignature(body, signature, SECRET)).toBe(false);
  });

  it('rejeita assinatura ausente (string vazia)', () => {
    const body = Buffer.from('{}');
    expect(verifyZernioSignature(body, '', SECRET)).toBe(false);
  });

  it('rejeita assinatura malformada (não hex, tamanho errado, maiúsculas)', () => {
    const body = Buffer.from('{}');
    expect(verifyZernioSignature(body, 'not-hex-at-all', SECRET)).toBe(false);
    expect(verifyZernioSignature(body, 'abcd', SECRET)).toBe(false); // curta demais
    expect(verifyZernioSignature(body, sign(body).toUpperCase(), SECRET)).toBe(false); // maiúsculas
  });

  it('a verificação usa o corpo bruto — reserializar o mesmo objeto JSON com espaçamento diferente quebra a assinatura', () => {
    const payload = { id: '1', event: 'message.received' };
    const compact = Buffer.from(JSON.stringify(payload));
    const signature = sign(compact);
    const respaced = Buffer.from(JSON.stringify(payload, null, 2)); // mesmo conteúdo lógico, bytes diferentes
    expect(verifyZernioSignature(respaced, signature, SECRET)).toBe(false);
  });
});
