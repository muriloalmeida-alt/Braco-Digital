import { ServiceUnavailableException } from '@nestjs/common';
import { EnvKeyAesGcmCipher } from '../credentials-cipher';
import { GCP_KMS_CIPHERTEXT_PREFIX, GoogleCloudKmsCipher } from './google-cloud-kms-cipher';
import { GcpKmsClient } from './gcp-kms-client';

function fakeKmsClient(store: Map<string, string>): GcpKmsClient {
  // Fake simples: "cifra" só invertendo a string, o suficiente para
  // provar que o envelope (prefixo + roteamento encrypt/decrypt) está
  // correto sem precisar de uma chave GCP real.
  return {
    encrypt: jest.fn(async (plaintextB64: string) => {
      const ciphertextB64 = Buffer.from(plaintextB64).reverse().toString('base64');
      store.set(ciphertextB64, plaintextB64);
      return ciphertextB64;
    }),
    decrypt: jest.fn(async (ciphertextB64: string) => {
      const plaintextB64 = store.get(ciphertextB64);
      if (!plaintextB64) throw new Error('ciphertext desconhecido');
      return plaintextB64;
    }),
  } as unknown as GcpKmsClient;
}

describe('GoogleCloudKmsCipher', () => {
  it('isProductionGrade é true (ao contrário de EnvKeyAesGcmCipher)', () => {
    const cipher = new GoogleCloudKmsCipher(fakeKmsClient(new Map()), null);
    expect(cipher.isProductionGrade).toBe(true);
  });

  it('round-trip: encrypt then decrypt devolve o texto original', async () => {
    const cipher = new GoogleCloudKmsCipher(fakeKmsClient(new Map()), null);
    const stored = await cipher.encrypt('token-secreto-123');
    expect(await cipher.decrypt(stored)).toBe('token-secreto-123');
  });

  it('ciphertext é versionado com o prefixo gcpkms:v1: — nunca reaproveita o formato legado silenciosamente', async () => {
    const cipher = new GoogleCloudKmsCipher(fakeKmsClient(new Map()), null);
    const stored = await cipher.encrypt('x');
    expect(stored.startsWith(GCP_KMS_CIPHERTEXT_PREFIX)).toBe(true);
  });

  it('lê ciphertext no formato legado (sem prefixo) delegando para o cipher legado', async () => {
    const legacyCipher = new EnvKeyAesGcmCipher(Buffer.alloc(32, 7).toString('base64'));
    const legacyStored = await legacyCipher.encrypt('token-antigo');
    expect(legacyStored.startsWith(GCP_KMS_CIPHERTEXT_PREFIX)).toBe(false);

    const cipher = new GoogleCloudKmsCipher(fakeKmsClient(new Map()), legacyCipher);
    expect(await cipher.decrypt(legacyStored)).toBe('token-antigo');
  });

  it('nunca escreve no formato legado — todo encrypt() novo sempre usa o KMS, mesmo com legacyCipher presente', async () => {
    const legacyCipher = new EnvKeyAesGcmCipher(Buffer.alloc(32, 7).toString('base64'));
    const cipher = new GoogleCloudKmsCipher(fakeKmsClient(new Map()), legacyCipher);
    const stored = await cipher.encrypt('novo-token');
    expect(stored.startsWith(GCP_KMS_CIPHERTEXT_PREFIX)).toBe(true);
  });

  it('ciphertext legado sem legacyCipher configurado lança um erro claro (não decifra silenciosamente/não crasha)', async () => {
    const cipher = new GoogleCloudKmsCipher(fakeKmsClient(new Map()), null);
    await expect(cipher.decrypt('formato-legado-sem-prefixo')).rejects.toThrow(ServiceUnavailableException);
  });
});
