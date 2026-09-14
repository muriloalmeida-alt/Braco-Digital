import { ServiceUnavailableException } from '@nestjs/common';
import type { CredentialsCipher } from '../credentials-cipher';
import { GcpKmsClient } from './gcp-kms-client';

/**
 * Prefixo que marca um ciphertext como produzido por este provider —
 * "ciphertext versionado" (issue de KMS production-grade): distingue o
 * formato legado do `EnvKeyAesGcmCipher` (base64 puro, sem prefixo) do
 * formato novo, permitindo os dois coexistirem no banco durante uma
 * migração sem exigir um "big bang". Nunca reaproveitar este prefixo
 * para outro formato no futuro — criar `gcpkms:v2:` se o formato mudar.
 */
export const GCP_KMS_CIPHERTEXT_PREFIX = 'gcpkms:v1:';

/**
 * Implementação production-grade de `CredentialsCipher` (issue de KMS
 * production-grade, TD24) — decisão deste ciclo: Google Cloud KMS, por
 * já existir dependência de Google Cloud na integração Google (issue
 * #31). `isProductionGrade: true` porque a chave nunca sai do KMS (só
 * operações Encrypt/Decrypt são expostas pela API), com rotação e
 * least-privilege geridos pelo IAM do GCP — ao contrário de
 * `EnvKeyAesGcmCipher`.
 *
 * `legacyCipher`, quando presente, é usado **só para leitura** de
 * ciphertext no formato antigo (sem o prefixo acima) — nunca para
 * escrita. Isso permite ler credenciais gravadas antes da migração
 * para KMS sem exigir uma reencriptação síncrona/bloqueante: a
 * reencriptação real acontece via `scripts/reencrypt-google-
 * credentials.ts` (execução explícita, nunca automática dentro de uma
 * request normal) ou naturalmente no próximo refresh de token real
 * (que sempre grava no formato novo).
 */
export class GoogleCloudKmsCipher implements CredentialsCipher {
  readonly providerName = 'gcp-kms';
  readonly isProductionGrade = true;

  constructor(
    private readonly kmsClient: GcpKmsClient,
    private readonly legacyCipher: CredentialsCipher | null,
  ) {}

  async encrypt(plaintext: string): Promise<string> {
    const plaintextB64 = Buffer.from(plaintext, 'utf8').toString('base64');
    const ciphertextB64 = await this.kmsClient.encrypt(plaintextB64);
    return `${GCP_KMS_CIPHERTEXT_PREFIX}${ciphertextB64}`;
  }

  async decrypt(stored: string): Promise<string> {
    if (stored.startsWith(GCP_KMS_CIPHERTEXT_PREFIX)) {
      const ciphertextB64 = stored.slice(GCP_KMS_CIPHERTEXT_PREFIX.length);
      const plaintextB64 = await this.kmsClient.decrypt(ciphertextB64);
      return Buffer.from(plaintextB64, 'base64').toString('utf8');
    }

    // Sem o prefixo => formato legado do EnvKeyAesGcmCipher.
    if (!this.legacyCipher) {
      throw new ServiceUnavailableException(
        'Credencial gravada no formato legado (env-aes), mas nenhuma chave de leitura legada está configurada neste ambiente ' +
          '(GOOGLE_CREDENTIALS_ENCRYPTION_KEY). Configure-a temporariamente para permitir a leitura até a reencriptação completa, ' +
          'ou rode scripts/reencrypt-google-credentials.ts.',
      );
    }
    return this.legacyCipher.decrypt(stored);
  }
}
