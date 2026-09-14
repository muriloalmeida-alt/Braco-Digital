/**
 * Tokens de injeção do módulo Google (issue #31). `GOOGLE_OAUTH_CONFIG`
 * resolve para `null` quando a integração não está habilitada (sem
 * `GOOGLE_CLIENT_ID`) — o módulo carrega normalmente em qualquer
 * ambiente sem Google configurado; só uma chamada de fato ao provedor
 * falha (`GoogleApiClient.requireConfig`), nunca o boot da aplicação
 * inteira. Mesmo padrão de `zernio.tokens.ts`.
 */
export const GOOGLE_OAUTH_CONFIG = Symbol('GOOGLE_OAUTH_CONFIG');
export const GOOGLE_FETCH = Symbol('GOOGLE_FETCH');
export const CREDENTIALS_CIPHER = Symbol('CREDENTIALS_CIPHER');

export type GoogleFetch = typeof fetch;
