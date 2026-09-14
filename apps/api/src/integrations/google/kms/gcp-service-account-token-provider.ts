import { Inject, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { createSign } from 'node:crypto';
import { GCP_KMS_CONFIG, GCP_KMS_FETCH, type GcpKmsFetch } from './gcp-kms.tokens';
import type { GcpKmsConfig } from './gcp-kms-config';

const CLOUDKMS_SCOPE = 'https://www.googleapis.com/auth/cloudkms';
/** Margem de segurança antes de considerar o access token "quase expirando" — mesmo espírito de `google-connection.service.ts`. */
const REFRESH_SAFETY_MARGIN_MS = 60_000;

function base64url(input: Buffer): string {
  return input.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Fluxo OAuth2 "JWT Bearer" de service account do Google (RFC 7523),
 * implementado em cima de `node:crypto`/`fetch` em vez do SDK oficial
 * (`google-auth-library`) — nenhuma dependência nova de infra, mesmo
 * padrão do resto do repositório (`GoogleApiClient`/`ZernioClient`):
 * cliente HTTP fino, fetch injetável, testável sem rede real. A chave
 * privada nunca é logada nem incluída em nenhuma mensagem de erro.
 */
@Injectable()
export class GcpServiceAccountTokenProvider {
  private cached: { accessToken: string; expiresAt: number } | null = null;

  constructor(
    @Inject(GCP_KMS_CONFIG) private readonly config: GcpKmsConfig | null,
    @Inject(GCP_KMS_FETCH) private readonly fetchFn: GcpKmsFetch,
  ) {}

  private requireConfig(): GcpKmsConfig {
    if (!this.config) {
      throw new ServiceUnavailableException('GCP KMS não está configurado neste ambiente.');
    }
    return this.config;
  }

  private signAssertion(config: GcpKmsConfig): string {
    const header = base64url(Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })));
    const nowSeconds = Math.floor(Date.now() / 1000);
    const claims = base64url(
      Buffer.from(
        JSON.stringify({
          iss: config.clientEmail,
          scope: CLOUDKMS_SCOPE,
          aud: config.tokenUri,
          iat: nowSeconds,
          exp: nowSeconds + 3600,
        }),
      ),
    );
    const unsigned = `${header}.${claims}`;
    const signature = base64url(createSign('RSA-SHA256').update(unsigned).sign(config.privateKey));
    return `${unsigned}.${signature}`;
  }

  async getAccessToken(): Promise<string> {
    if (this.cached && this.cached.expiresAt - REFRESH_SAFETY_MARGIN_MS > Date.now()) {
      return this.cached.accessToken;
    }

    const config = this.requireConfig();
    const assertion = this.signAssertion(config);
    const body = new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.requestTimeoutMs);
    let response: Response;
    try {
      response = await this.fetchFn(config.tokenUri, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
        signal: controller.signal,
      });
    } catch (err) {
      const isAbort = err instanceof Error && err.name === 'AbortError';
      throw new ServiceUnavailableException(isAbort ? 'Tempo limite excedido ao autenticar no GCP KMS.' : 'Falha de rede ao autenticar no GCP KMS.');
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      // Nunca inclui o corpo da resposta de erro do Google na exceção —
      // pode conter detalhe interno da conta de serviço.
      throw new ServiceUnavailableException(`Falha ao obter token de acesso do GCP KMS (status ${response.status}).`);
    }

    const json = (await response.json()) as { access_token: string; expires_in: number };
    this.cached = { accessToken: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 };
    return json.access_token;
  }
}
