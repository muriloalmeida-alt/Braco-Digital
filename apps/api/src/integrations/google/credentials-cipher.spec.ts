import { randomBytes } from 'node:crypto';
import { createCredentialsCipher, EnvKeyAesGcmCipher } from './credentials-cipher';

describe('EnvKeyAesGcmCipher', () => {
  const key = randomBytes(32).toString('base64');

  it('cifra e decifra de volta ao texto original (round-trip)', async () => {
    const cipher = new EnvKeyAesGcmCipher(key);
    const plaintext = 'ya29.a0Ael9sC-access-token-de-teste';

    const ciphertext = await cipher.encrypt(plaintext);
    expect(ciphertext).not.toContain(plaintext);
    expect(await cipher.decrypt(ciphertext)).toBe(plaintext);
  });

  it('produz ciphertexts diferentes para o mesmo texto (IV aleatório)', async () => {
    const cipher = new EnvKeyAesGcmCipher(key);
    const a = await cipher.encrypt('mesmo-texto');
    const b = await cipher.encrypt('mesmo-texto');
    expect(a).not.toBe(b);
  });

  it('nunca é considerada "production grade"', () => {
    const cipher = new EnvKeyAesGcmCipher(key);
    expect(cipher.isProductionGrade).toBe(false);
  });

  it('falha ao decifrar com a chave errada (autenticação GCM)', async () => {
    const cipherA = new EnvKeyAesGcmCipher(key);
    const cipherB = new EnvKeyAesGcmCipher(randomBytes(32).toString('base64'));

    const ciphertext = await cipherA.encrypt('segredo');
    await expect(cipherB.decrypt(ciphertext)).rejects.toThrow();
  });

  it('falha ao decifrar um ciphertext adulterado', async () => {
    const cipher = new EnvKeyAesGcmCipher(key);
    const ciphertext = await cipher.encrypt('segredo');
    const raw = Buffer.from(ciphertext, 'base64');
    raw[raw.length - 1] ^= 0xff; // adultera o último byte
    await expect(cipher.decrypt(raw.toString('base64'))).rejects.toThrow();
  });

  it('rejeita chave com tamanho diferente de 32 bytes', () => {
    expect(() => new EnvKeyAesGcmCipher(Buffer.from('chave-curta').toString('base64'))).toThrow(/32 bytes/);
  });

  it('createCredentialsCipher lança quando a variável de ambiente está ausente', () => {
    expect(() => createCredentialsCipher({})).toThrow(/GOOGLE_CREDENTIALS_ENCRYPTION_KEY/);
  });

  it('createCredentialsCipher constrói a partir da variável de ambiente', async () => {
    const cipher = createCredentialsCipher({ GOOGLE_CREDENTIALS_ENCRYPTION_KEY: key });
    expect(await cipher.decrypt(await cipher.encrypt('ok'))).toBe('ok');
  });
});
