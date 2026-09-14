import { ServiceUnavailableException } from '@nestjs/common';
import { generateKeyPairSync, verify } from 'node:crypto';
import { GcpServiceAccountTokenProvider } from './gcp-service-account-token-provider';
import type { GcpKmsConfig } from './gcp-kms-config';

const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });

const CONFIG: GcpKmsConfig = {
  keyName: 'projects/p/locations/l/keyRings/r/cryptoKeys/k',
  clientEmail: 'braco-kms@p.iam.gserviceaccount.com',
  privateKey: privateKey.export({ type: 'pkcs1', format: 'pem' }).toString(),
  tokenUri: 'https://oauth2.googleapis.com/token',
  apiBase: 'https://cloudkms.googleapis.com/v1',
  requestTimeoutMs: 200,
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

function decodeJwtPart(part: string): Record<string, unknown> {
  return JSON.parse(Buffer.from(part.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
}

describe('GcpServiceAccountTokenProvider', () => {
  it('lança ServiceUnavailableException quando GCP KMS não está configurado', async () => {
    const provider = new GcpServiceAccountTokenProvider(null, jest.fn() as unknown as typeof fetch);
    await expect(provider.getAccessToken()).rejects.toThrow(ServiceUnavailableException);
  });

  it('assina um JWT RS256 válido (RFC 7523) e troca por access_token no token_uri configurado', async () => {
    let captured: { url: string; init: RequestInit } | null = null;
    const fetchFn = jest.fn(async (url: string, init: RequestInit) => {
      captured = { url, init };
      return jsonResponse({ access_token: 'at-kms-1', expires_in: 3600, token_type: 'Bearer' });
    });
    const provider = new GcpServiceAccountTokenProvider(CONFIG, fetchFn as unknown as typeof fetch);

    const token = await provider.getAccessToken();

    expect(token).toBe('at-kms-1');
    expect(captured!.url).toBe(CONFIG.tokenUri);
    const body = new URLSearchParams(captured!.init.body as string);
    expect(body.get('grant_type')).toBe('urn:ietf:params:oauth:grant-type:jwt-bearer');
    const assertion = body.get('assertion')!;
    const [headerB64, claimsB64, sigB64] = assertion.split('.');
    expect(decodeJwtPart(headerB64)).toEqual({ alg: 'RS256', typ: 'JWT' });
    const claims = decodeJwtPart(claimsB64);
    expect(claims.iss).toBe(CONFIG.clientEmail);
    expect(claims.scope).toBe('https://www.googleapis.com/auth/cloudkms');
    expect(claims.aud).toBe(CONFIG.tokenUri);

    // A assinatura precisa validar de verdade contra a chave pública —
    // não é só "parece um JWT", é criptograficamente correto.
    const signature = Buffer.from(sigB64.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
    const isValid = verify('RSA-SHA256', Buffer.from(`${headerB64}.${claimsB64}`), publicKey, signature);
    expect(isValid).toBe(true);
  });

  it('nunca inclui a chave privada em nenhuma parte da requisição/erro', async () => {
    let captured: RequestInit | null = null;
    const fetchFn = jest.fn(async (_url: string, init: RequestInit) => {
      captured = init;
      return jsonResponse({ access_token: 'at', expires_in: 3600 });
    });
    const provider = new GcpServiceAccountTokenProvider(CONFIG, fetchFn as unknown as typeof fetch);
    await provider.getAccessToken();
    expect(JSON.stringify(captured)).not.toContain('BEGIN RSA PRIVATE KEY');
  });

  it('cacheia o token em memória — não chama o token_uri de novo antes de expirar', async () => {
    let calls = 0;
    const fetchFn = jest.fn(async () => {
      calls += 1;
      return jsonResponse({ access_token: `at-${calls}`, expires_in: 3600 });
    });
    const provider = new GcpServiceAccountTokenProvider(CONFIG, fetchFn as unknown as typeof fetch);

    const first = await provider.getAccessToken();
    const second = await provider.getAccessToken();
    expect(first).toBe(second);
    expect(calls).toBe(1);
  });

  it('renova quando o token cacheado está perto de expirar', async () => {
    let calls = 0;
    const fetchFn = jest.fn(async () => {
      calls += 1;
      // expires_in muito curto força a próxima chamada a considerar o
      // token "quase expirando" (margem de segurança de 60s).
      return jsonResponse({ access_token: `at-${calls}`, expires_in: 1 });
    });
    const provider = new GcpServiceAccountTokenProvider(CONFIG, fetchFn as unknown as typeof fetch);

    const first = await provider.getAccessToken();
    const second = await provider.getAccessToken();
    expect(first).not.toBe(second);
    expect(calls).toBe(2);
  });

  it('token_uri retornando erro nunca expõe o corpo bruto da resposta', async () => {
    const fetchFn = jest.fn(async () => new Response('detalhe interno sensível do Google', { status: 400 }));
    const provider = new GcpServiceAccountTokenProvider(CONFIG, fetchFn as unknown as typeof fetch);
    await expect(provider.getAccessToken()).rejects.toMatchObject({
      message: expect.not.stringContaining('detalhe interno sensível'),
    });
  });

  it('timeout local vira ServiceUnavailableException', async () => {
    const fetchFn = jest.fn(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => {
            const err = new Error('aborted');
            err.name = 'AbortError';
            reject(err);
          });
        }),
    );
    const provider = new GcpServiceAccountTokenProvider({ ...CONFIG, requestTimeoutMs: 20 }, fetchFn as unknown as typeof fetch);
    await expect(provider.getAccessToken()).rejects.toThrow(ServiceUnavailableException);
  });
});
