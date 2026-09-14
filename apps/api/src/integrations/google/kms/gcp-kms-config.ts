import { isProductionEnvironment } from '../../../config/environment';

/**
 * Configuração do provider de criptografia production-grade (issue de
 * KMS production-grade, TD24 em `docs/technical/17-technical-
 * decisions.md`). Único ponto que lê `process.env.CREDENTIALS_CIPHER_*`/
 * `GCP_KMS_*` — nada mais neste submódulo acessa `process.env`
 * diretamente, mesmo padrão de `google-config.ts`/`zernio-config.ts`.
 */
export type CredentialsCipherProvider = 'env' | 'gcp-kms';

export interface GcpKmsConfig {
  /** Resource name completo, ex.: `projects/p/locations/l/keyRings/r/cryptoKeys/k`. */
  keyName: string;
  /** E-mail da service account usada só para Encrypt/Decrypt nesta chave (menor privilégio). */
  clientEmail: string;
  /** Chave privada RSA da service account, PEM (aceita `\n` literal escapado em variável de ambiente). */
  privateKey: string;
  tokenUri: string;
  apiBase: string;
  requestTimeoutMs: number;
}

const DEFAULT_TOKEN_URI = 'https://oauth2.googleapis.com/token';
const DEFAULT_API_BASE = 'https://cloudkms.googleapis.com/v1';
const DEFAULT_TIMEOUT_MS = 10_000;

/**
 * `'env'` é o default explícito — nunca muda o comportamento de quem já
 * está rodando sem esta variável definida (retrocompatível com o que
 * `EnvKeyAesGcmCipher` já fazia sozinho antes desta issue).
 */
export function getCredentialsCipherProvider(env: NodeJS.ProcessEnv = process.env): CredentialsCipherProvider {
  const raw = env.CREDENTIALS_CIPHER_PROVIDER?.trim().toLowerCase();
  return raw === 'gcp-kms' ? 'gcp-kms' : 'env';
}

function missingGcpKmsVars(env: NodeJS.ProcessEnv): string[] {
  const missing: string[] = [];
  if (!env.GCP_KMS_KEY_NAME?.trim()) missing.push('GCP_KMS_KEY_NAME');
  if (!env.GCP_KMS_CLIENT_EMAIL?.trim()) missing.push('GCP_KMS_CLIENT_EMAIL');
  if (!env.GCP_KMS_PRIVATE_KEY?.trim()) missing.push('GCP_KMS_PRIVATE_KEY');
  return missing;
}

export function isGcpKmsFullyConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return missingGcpKmsVars(env).length === 0;
}

export function getGcpKmsConfig(env: NodeJS.ProcessEnv = process.env): GcpKmsConfig {
  if (!isGcpKmsFullyConfigured(env)) {
    throw new Error('GCP KMS não está totalmente configurado (GCP_KMS_KEY_NAME/GCP_KMS_CLIENT_EMAIL/GCP_KMS_PRIVATE_KEY).');
  }
  return {
    keyName: env.GCP_KMS_KEY_NAME!.trim(),
    clientEmail: env.GCP_KMS_CLIENT_EMAIL!.trim(),
    // `\n` literal é o formato comum de colar uma chave PEM numa
    // variável de ambiente de uma linha só (Railway, GitHub Actions
    // etc.) — sem isto, `createSign`/`createPrivateKey` recusam a PEM.
    privateKey: env.GCP_KMS_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    tokenUri: env.GCP_KMS_TOKEN_URI?.trim() || DEFAULT_TOKEN_URI,
    apiBase: (env.GCP_KMS_API_BASE?.trim() || DEFAULT_API_BASE).replace(/\/+$/, ''),
    requestTimeoutMs: Number(env.GCP_KMS_REQUEST_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS,
  };
}

/**
 * Chamado por `main.ts` no bootstrap, ao lado de `assertGoogleEnvValid`.
 * "Fail-closed": em produção, se alguma integração real que precisa de
 * `CredentialsCipher` está habilitada (hoje: Google), o provider
 * `env` nunca é aceito — exige `gcp-kms` totalmente configurado. Nunca
 * derruba o boot fora de produção (dev/test/homologação controlada
 * continuam podendo usar `env`, documentado como não-production-grade).
 */
export function assertCredentialsCipherEnvValid(env: NodeJS.ProcessEnv = process.env, googleEnabled: boolean): void {
  if (!isProductionEnvironment() || !googleEnabled) return;

  const provider = getCredentialsCipherProvider(env);
  if (provider !== 'gcp-kms') {
    throw new Error(
      'Configuração de criptografia insegura para produção: CREDENTIALS_CIPHER_PROVIDER precisa ser "gcp-kms" quando uma ' +
        'integração real (Google) está habilitada em produção — "env" (EnvKeyAesGcmCipher) nunca é production-grade ' +
        '(docs/technical/10-security-lgpd.md §4). Nunca há fallback automático.',
    );
  }

  const missing = missingGcpKmsVars(env);
  if (missing.length > 0) {
    throw new Error(`Configuração do GCP KMS incompleta em produção: faltam ${missing.join(', ')}.`);
  }
}
