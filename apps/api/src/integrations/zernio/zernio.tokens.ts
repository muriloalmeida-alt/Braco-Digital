/**
 * Tokens de injeção do módulo Zernio. `ZERNIO_CONFIG` resolve para `null`
 * quando a integração não está habilitada (sem `ZERNIO_API_KEY`) — o
 * módulo carrega normalmente em qualquer ambiente sem Zernio configurado;
 * só uma chamada de fato ao provedor falha (`ZernioClient.requireConfig`),
 * nunca o boot da aplicação inteira.
 */
export const ZERNIO_CONFIG = Symbol('ZERNIO_CONFIG');
export const ZERNIO_FETCH = Symbol('ZERNIO_FETCH');

export type ZernioFetch = typeof fetch;
