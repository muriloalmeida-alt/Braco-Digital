import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { getCredentialsCipherProvider, getGcpKmsConfig, isGcpKmsFullyConfigured } from './kms/gcp-kms-config';
import { GcpKmsClient } from './kms/gcp-kms-client';
import { GcpServiceAccountTokenProvider } from './kms/gcp-service-account-token-provider';
import { GoogleCloudKmsCipher } from './kms/google-cloud-kms-cipher';

/**
 * Abstração de criptografia de credenciais (issue #31 §9,
 * docs/technical/10-security-lgpd.md §4). Nenhum outro arquivo deste
 * módulo lida com bytes de chave/cifra diretamente — tudo passa por
 * aqui, para que trocar a implementação (ex.: por um KMS gerenciado de
 * verdade) seja uma troca local, sem tocar `GoogleConnectionService`.
 */
export interface CredentialsCipher {
  encrypt(plaintext: string): Promise<string>;
  decrypt(ciphertext: string): Promise<string>;
  /** Nome curto para logs/relatórios (nunca segredo nenhum aqui). */
  readonly providerName: string;
  /**
   * `false` para qualquer implementação que não seja um KMS gerenciado
   * com rotação — usado só para NUNCA deixar uma configuração insegura
   * passar como se fosse válida para produção em silêncio (issue #31
   * §9). Ver `assertProductionGradeIfNeeded` abaixo.
   */
  readonly isProductionGrade: boolean;
}

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

/**
 * Implementação real (AES-256-GCM) com uma chave simétrica fixa vinda de
 * variável de ambiente (`GOOGLE_CREDENTIALS_ENCRYPTION_KEY`, base64 de
 * 32 bytes).
 *
 * **NÃO é a solução definitiva de produção.**
 * `docs/technical/10-security-lgpd.md` §4 exige chaves geridas por um
 * serviço de KMS gerenciado com rotação — "nunca chave simétrica
 * hardcoded ou em variável de ambiente sem rotação". Isto aqui é uma
 * cifra real (não texto plano, não um no-op), suficiente para
 * desenvolvimento/homologação e para destravar o restante da issue #31,
 * mas `isProductionGrade` é `false` de propósito: nenhuma parte do
 * código deve tratar isto como "pronto para produção" sem uma migração
 * explícita para um provider de KMS de verdade (AWS KMS, Google Cloud
 * KMS, HashiCorp Vault etc. — ver docs/technical/22-google-workspace-
 * integration.md, seção "Criptografia").
 */
export class EnvKeyAesGcmCipher implements CredentialsCipher {
  readonly providerName = 'env-aes-256-gcm (não produção — ver docs/technical/22-google-workspace-integration.md)';
  readonly isProductionGrade = false;

  private readonly key: Buffer;

  constructor(base64Key: string) {
    const key = Buffer.from(base64Key, 'base64');
    if (key.length !== 32) {
      throw new Error(
        `GOOGLE_CREDENTIALS_ENCRYPTION_KEY inválida: esperado 32 bytes em base64 (AES-256), recebido ${key.length} byte(s). ` +
          `Gere uma nova com: openssl rand -base64 32`,
      );
    }
    this.key = key;
  }

  async encrypt(plaintext: string): Promise<string> {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return Buffer.concat([iv, authTag, ciphertext]).toString('base64');
  }

  async decrypt(ciphertextB64: string): Promise<string> {
    const raw = Buffer.from(ciphertextB64, 'base64');
    if (raw.length < IV_LENGTH + AUTH_TAG_LENGTH) {
      throw new Error('Credencial criptografada malformada (tamanho inválido).');
    }
    const iv = raw.subarray(0, IV_LENGTH);
    const authTag = raw.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const ciphertext = raw.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
    const decipher = createDecipheriv(ALGORITHM, this.key, iv);
    decipher.setAuthTag(authTag);
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return plaintext.toString('utf8');
  }
}

/**
 * `fetchImpl` é injetável (default: `fetch` global) só para permitir
 * testar a seleção do provider `gcp-kms` sem rede real — a instância
 * devolvida (`GoogleCloudKmsCipher`) só faz uma chamada de verdade
 * quando `encrypt`/`decrypt` é chamado, nunca na construção.
 */
export function createCredentialsCipher(env: NodeJS.ProcessEnv = process.env, fetchImpl: typeof fetch = fetch): CredentialsCipher {
  const provider = getCredentialsCipherProvider(env);
  const legacyKey = env.GOOGLE_CREDENTIALS_ENCRYPTION_KEY?.trim();
  const legacyCipher = legacyKey ? new EnvKeyAesGcmCipher(legacyKey) : null;

  if (provider === 'gcp-kms') {
    // Config `null` é aceitável na construção (mesmo padrão de
    // `GoogleApiClient`/`ZernioClient`) — só falha (503) na primeira
    // chamada real de encrypt/decrypt, nunca no boot.
    const kmsConfig = isGcpKmsFullyConfigured(env) ? getGcpKmsConfig(env) : null;
    const tokenProvider = new GcpServiceAccountTokenProvider(kmsConfig, fetchImpl);
    const kmsClient = new GcpKmsClient(kmsConfig, fetchImpl, tokenProvider);
    // `legacyCipher` aqui é só para LEITURA de dados gravados antes da
    // migração para KMS — `GoogleCloudKmsCipher` nunca escreve no
    // formato antigo (ver comentário na classe).
    return new GoogleCloudKmsCipher(kmsClient, legacyCipher);
  }

  if (!legacyCipher) {
    throw new Error('GOOGLE_CREDENTIALS_ENCRYPTION_KEY não configurada — não é possível cifrar/decifrar credenciais do Google.');
  }
  return legacyCipher;
}
