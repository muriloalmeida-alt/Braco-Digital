import { normalizeWhatsapp } from './whatsapp-normalize';

describe('normalizeWhatsapp', () => {
  it('normaliza número brasileiro sem DDI para E.164', () => {
    expect(normalizeWhatsapp('11999998888')).toBe('+5511999998888');
  });

  it('normaliza número já formatado com máscara', () => {
    expect(normalizeWhatsapp('(11) 99999-8888')).toBe('+5511999998888');
  });

  it('preserva DDI internacional explícito', () => {
    expect(normalizeWhatsapp('+1 415 555 0100')).toBe('+14155550100');
  });

  it('rejeita entrada vazia ou não numérica', () => {
    expect(normalizeWhatsapp('abc')).toBeNull();
    expect(normalizeWhatsapp('')).toBeNull();
  });

  it('rejeita número curto demais para ser válido', () => {
    expect(normalizeWhatsapp('123')).toBeNull();
  });
});
