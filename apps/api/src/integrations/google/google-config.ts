import { isProductionEnvironment } from '../../config/environment';
import { getCredentialsCipherProvider } from './kms/gcp-kms-config';

/**
 * Configuração do OAuth Google (issue #31). Único ponto que lê
 * `process.env.GOOGLE_*` — nada mais no módulo acessa `process.env`
 * diretamente, para que testes possam substituir a config inteira (mesmo
 * padrão de `zernio-config.ts`).
 *
 * Diferente do Zernio (uma chave de plataforma única), aqui cada empresa
 * tem sua PRÓPRIA autorização OAuth — mas o app OAuth (client_id/secret)
 * em si é um só, do projeto Google Cloud do BRAÇO.
 */
export interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  /** Timeout de chamadas HTTP ao Google, em ms. */
  requestTimeoutMs: number;
}

const DEFAULT_TIMEOUT_MS = 10_000;

/** Escopos mínimos pedidos (issue #31 §5) — nunca o escopo amplo `calendar`. */
export const GOOGLE_OAUTH_SCOPES = [
  'https://www.googleapis.com/auth/calendar.calendarlist.readonly',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.events.freebusy',
  'https://www.googleapis.com/auth/tasks',
] as const;

/** Só a presença do client id — o mínimo para dizer "alguém pretende usar isto". */
export function hasGoogleClientId(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env.GOOGLE_CLIENT_ID?.trim());
}

function missingRequiredVars(env: NodeJS.ProcessEnv): string[] {
  const missing: string[] = [];
  if (!env.GOOGLE_CLIENT_SECRET?.trim()) missing.push('GOOGLE_CLIENT_SECRET');
  if (!env.GOOGLE_REDIRECT_URI?.trim()) missing.push('GOOGLE_REDIRECT_URI');
  // GOOGLE_CREDENTIALS_ENCRYPTION_KEY (o formato "legado" de
  // EnvKeyAesGcmCipher, TD24) só é obrigatória quando o provider ativo
  // de fato depende dela: com CREDENTIALS_CIPHER_PROVIDER=env (default),
  // é a própria chave de cifra — continua obrigatória, nunca persistir
  // token OAuth sem criptografia (issue #31 §9). Com
  // CREDENTIALS_CIPHER_PROVIDER=gcp-kms, ela vira OPCIONAL: serve só
  // para LER ciphertext legado durante uma transição
  // (GoogleCloudKmsCipher aceita legacyCipher=null) — um ambiente novo,
  // sem dado legado, nunca deveria precisar dela. A exigência de
  // GCP_KMS_* em si é responsabilidade separada de
  // `assertCredentialsCipherEnvValid` (kms/gcp-kms-config.ts),
  // deliberadamente independente desta função (revisão do gate
  // Google+KMS, TD25).
  if (getCredentialsCipherProvider(env) === 'env' && !env.GOOGLE_CREDENTIALS_ENCRYPTION_KEY?.trim()) {
    missing.push('GOOGLE_CREDENTIALS_ENCRYPTION_KEY');
  }
  return missing;
}

/**
 * "Integração real habilitada" = todas as variáveis obrigatórias
 * presentes, não só o client id. Configuração parcial é tratada como
 * desabilitada (nunca "meio habilitada") — `GoogleModule` usa isto para
 * decidir se o cliente real existe ou é `null`, em qualquer ambiente, sem
 * nunca derrubar o boot da aplicação por conta disso (só
 * `assertGoogleEnvValid`, abaixo, pode fazer isso, e só em produção).
 */
export function isGoogleFullyConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return hasGoogleClientId(env) && missingRequiredVars(env).length === 0;
}

/**
 * Chamado por `main.ts` no bootstrap. "Em produção, falhar no startup se
 * a integração real estiver habilitada e as variáveis obrigatórias
 * estiverem ausentes" (issue #31 §15) — só em produção: em dev/test, uma
 * configuração parcial (ou ausente) é normal enquanto se prepara o
 * ambiente, e só desabilita a integração, nunca derruba o processo.
 */
export function assertGoogleEnvValid(env: NodeJS.ProcessEnv = process.env): void {
  if (!isProductionEnvironment() || !hasGoogleClientId(env)) return;

  const missing = missingRequiredVars(env);
  if (missing.length > 0) {
    throw new Error(
      `Configuração do Google incompleta em produção: GOOGLE_CLIENT_ID está definida, mas ${missing.join(', ')} ` +
        `não está(ão). Defina todas as variáveis GOOGLE_* ou nenhuma.`,
    );
  }
}

/**
 * Lê a config atual do `process.env`. Só deve ser chamada quando
 * `isGoogleFullyConfigured()` já foi checado — lança se chamada fora
 * dessa garantia, o que só deveria acontecer por bug interno.
 */
export function getGoogleOAuthConfig(env: NodeJS.ProcessEnv = process.env): GoogleOAuthConfig {
  if (!isGoogleFullyConfigured(env)) {
    throw new Error(
      'Google não está totalmente configurado (GOOGLE_CLIENT_ID/CLIENT_SECRET/REDIRECT_URI, mais GOOGLE_CREDENTIALS_ENCRYPTION_KEY ' +
        'quando CREDENTIALS_CIPHER_PROVIDER=env).',
    );
  }

  return {
    clientId: env.GOOGLE_CLIENT_ID!.trim(),
    clientSecret: env.GOOGLE_CLIENT_SECRET!.trim(),
    redirectUri: env.GOOGLE_REDIRECT_URI!.trim(),
    requestTimeoutMs: Number(env.GOOGLE_REQUEST_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS,
  };
}
