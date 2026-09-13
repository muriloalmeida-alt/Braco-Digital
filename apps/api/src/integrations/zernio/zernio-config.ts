import { isProductionEnvironment } from '../../config/environment';

/**
 * Configuração do Zernio (issue #30). Único ponto que lê
 * `process.env.ZERNIO_*` — nada mais no módulo acessa `process.env`
 * diretamente, para que testes possam substituir a config inteira.
 *
 * `ZERNIO_API_KEY` é uma chave única da plataforma (não uma credencial
 * por empresa) — BRAÇO usa um único profile Zernio "guarda-chuva" e cria
 * um `profileId` por empresa dentro dele. Por isso não há nada aqui para
 * criptografar em `Integration.credentials_encrypted`: o KMS/secrets
 * manager ainda ausente (docs/technical/20-sprint-02-tech-readiness.md
 * §24.2) não é um bloqueio para esta integração especificamente.
 */
export interface ZernioConfig {
  baseUrl: string;
  apiKey: string;
  webhookSecret: string;
  redirectUrl: string;
  /** Timeout de chamadas HTTP ao Zernio, em ms. */
  requestTimeoutMs: number;
}

const DEFAULT_BASE_URL = 'https://zernio.com/api/v1';
const DEFAULT_TIMEOUT_MS = 10_000;

/** Só a chave presente — o mínimo para dizer "alguém pretende usar isto". */
export function hasZernioApiKey(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env.ZERNIO_API_KEY?.trim());
}

function missingRequiredVars(env: NodeJS.ProcessEnv): string[] {
  const missing: string[] = [];
  if (!env.ZERNIO_WEBHOOK_SECRET?.trim()) missing.push('ZERNIO_WEBHOOK_SECRET');
  if (!env.ZERNIO_REDIRECT_URL?.trim()) missing.push('ZERNIO_REDIRECT_URL');
  return missing;
}

/**
 * "Integração real habilitada" = todas as variáveis obrigatórias
 * presentes, não só a API key. Uma configuração parcial é tratada como
 * desabilitada (nunca como "meio habilitada") — `ZernioModule` usa isto
 * para decidir se o cliente real existe ou é `null`, em qualquer
 * ambiente, sem nunca derrubar o boot da aplicação por conta disso (só
 * `assertZernioEnvValid`, abaixo, pode fazer isso, e só em produção).
 */
export function isZernioFullyConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return hasZernioApiKey(env) && missingRequiredVars(env).length === 0;
}

/**
 * Chamado por `main.ts` no bootstrap. "Em produção, falhar no startup se
 * a integração real estiver habilitada e as variáveis obrigatórias
 * estiverem ausentes" (issue #30) — só em produção: em dev/test, uma
 * configuração parcial (ou ausente) é normal enquanto se prepara o
 * ambiente, e só desabilita a integração (ver `isZernioFullyConfigured`),
 * nunca derruba o processo.
 */
export function assertZernioEnvValid(env: NodeJS.ProcessEnv = process.env): void {
  if (!isProductionEnvironment() || !hasZernioApiKey(env)) return;

  const missing = missingRequiredVars(env);
  if (missing.length > 0) {
    throw new Error(
      `Configuração do Zernio incompleta em produção: ZERNIO_API_KEY está definida, mas ${missing.join(', ')} ` +
        `não está(ão). Defina todas as variáveis ZERNIO_* ou nenhuma.`,
    );
  }
}

/**
 * Lê a config atual do `process.env`. Só deve ser chamada quando
 * `isZernioFullyConfigured()` já foi checado (é o que `ZernioModule` faz
 * na fábrica do provider) — lança se chamada fora dessa garantia, o que
 * só deveria acontecer por bug interno, nunca por configuração ausente
 * em produção normal.
 */
export function getZernioConfig(env: NodeJS.ProcessEnv = process.env): ZernioConfig {
  if (!isZernioFullyConfigured(env)) {
    throw new Error('Zernio não está totalmente configurado (ZERNIO_API_KEY/WEBHOOK_SECRET/REDIRECT_URL).');
  }

  return {
    baseUrl: (env.ZERNIO_BASE_URL?.trim() || DEFAULT_BASE_URL).replace(/\/+$/, ''),
    apiKey: env.ZERNIO_API_KEY!.trim(),
    webhookSecret: env.ZERNIO_WEBHOOK_SECRET!.trim(),
    redirectUrl: env.ZERNIO_REDIRECT_URL!.trim(),
    requestTimeoutMs: Number(env.ZERNIO_REQUEST_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS,
  };
}
