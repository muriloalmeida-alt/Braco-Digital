import { resolveSenderIdentity, shouldAutoRespond } from './zernio-webhook.service';

describe('resolveSenderIdentity', () => {
  it('prefere businessScopedUserId quando presente', () => {
    expect(resolveSenderIdentity({ businessScopedUserId: 'bsuid-1', phoneNumber: '+5511999998888' })).toBe('bsuid-1');
  });

  it('usa phoneNumber como fallback quando businessScopedUserId está ausente', () => {
    expect(resolveSenderIdentity({ phoneNumber: '+5511999998888' })).toBe('+5511999998888');
  });

  it('nunca assume que o telefone está presente — retorna null se nenhum dos dois existir', () => {
    expect(resolveSenderIdentity({})).toBeNull();
  });
});

describe('shouldAutoRespond', () => {
  it('bloqueia resposta automática quando metadata.standby === true', () => {
    expect(shouldAutoRespond({ metadata: { standby: true } })).toBe(false);
  });

  it('permite quando metadata.standby é false, ausente, ou metadata é null', () => {
    expect(shouldAutoRespond({ metadata: { standby: false } })).toBe(true);
    expect(shouldAutoRespond({ metadata: {} })).toBe(true);
    expect(shouldAutoRespond({ metadata: null })).toBe(true);
  });
});
