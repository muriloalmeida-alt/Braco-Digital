/** Tokens de injeção do submódulo GCP KMS. Mesmo padrão de `google.tokens.ts`. */
export const GCP_KMS_CONFIG = Symbol('GCP_KMS_CONFIG');
export const GCP_KMS_FETCH = Symbol('GCP_KMS_FETCH');

export type GcpKmsFetch = typeof fetch;
