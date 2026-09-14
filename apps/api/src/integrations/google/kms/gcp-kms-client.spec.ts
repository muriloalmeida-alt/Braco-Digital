import { ServiceUnavailableException } from '@nestjs/common';
import { GcpKmsClient, GcpKmsError } from './gcp-kms-client';
import { GcpServiceAccountTokenProvider } from './gcp-service-account-token-provider';
import type { GcpKmsConfig } from './gcp-kms-config';

const CONFIG: GcpKmsConfig = {
  keyName: 'projects/p/locations/l/keyRings/r/cryptoKeys/k',
  clientEmail: 'braco-kms@p.iam.gserviceaccount.com',
  privateKey: 'unused-in-these-tests',
  tokenUri: 'https://oauth2.googleapis.com/token',
  apiBase: 'https://cloudkms.googleapis.com/v1',
  requestTimeoutMs: 200,
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

function fakeTokenProvider(token = 'at-fake'): GcpServiceAccountTokenProvider {
  return { getAccessToken: jest.fn().mockResolvedValue(token) } as unknown as GcpServiceAccountTokenProvider;
}

describe('GcpKmsClient', () => {
  it('lança ServiceUnavailableException quando não está configurado', async () => {
    const client = new GcpKmsClient(null, jest.fn() as unknown as typeof fetch, fakeTokenProvider());
    await expect(client.encrypt('cGxhaW50ZXh0')).rejects.toThrow(ServiceUnavailableException);
  });

  it('encrypt chama {keyName}:encrypt com Bearer do token provider e devolve o ciphertext', async () => {
    let captured: { url: string; init: RequestInit } | null = null;
    const fetchFn = jest.fn(async (url: string, init: RequestInit) => {
      captured = { url, init };
      return jsonResponse({ ciphertext: 'Y2lwaGVy' });
    });
    const client = new GcpKmsClient(CONFIG, fetchFn as unknown as typeof fetch, fakeTokenProvider('at-1'));

    const result = await client.encrypt('cGxhaW50ZXh0');

    expect(result).toBe('Y2lwaGVy');
    expect(captured!.url).toBe(`${CONFIG.apiBase}/${CONFIG.keyName}:encrypt`);
    expect((captured!.init.headers as Record<string, string>).Authorization).toBe('Bearer at-1');
    expect(JSON.parse(captured!.init.body as string)).toEqual({ plaintext: 'cGxhaW50ZXh0' });
  });

  it('decrypt chama {keyName}:decrypt e devolve o plaintext', async () => {
    let captured: { url: string } | null = null;
    const fetchFn = jest.fn(async (url: string) => {
      captured = { url };
      return jsonResponse({ plaintext: 'cGxhaW50ZXh0' });
    });
    const client = new GcpKmsClient(CONFIG, fetchFn as unknown as typeof fetch, fakeTokenProvider());

    const result = await client.decrypt('Y2lwaGVy');

    expect(result).toBe('cGxhaW50ZXh0');
    expect(captured!.url).toBe(`${CONFIG.apiBase}/${CONFIG.keyName}:decrypt`);
  });

  it('nunca inclui o corpo de erro do Google na mensagem devolvida', async () => {
    const fetchFn = jest.fn(async () => new Response('detalhe interno sensível da chave', { status: 403 }));
    const client = new GcpKmsClient(CONFIG, fetchFn as unknown as typeof fetch, fakeTokenProvider());

    await expect(client.decrypt('x')).rejects.toMatchObject({
      message: expect.not.stringContaining('detalhe interno sensível'),
    });
  });

  it.each([
    [401, 'unauthorized'],
    [403, 'forbidden'],
    [404, 'not_found'],
    [500, 'server_error'],
  ])('status %i vira código %s', async (status, code) => {
    const fetchFn = jest.fn(async () => new Response('', { status }));
    const client = new GcpKmsClient(CONFIG, fetchFn as unknown as typeof fetch, fakeTokenProvider());
    await expect(client.decrypt('x')).rejects.toMatchObject({ code });
  });

  it('timeout local vira GcpKmsError code=timeout', async () => {
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
    const client = new GcpKmsClient({ ...CONFIG, requestTimeoutMs: 20 }, fetchFn as unknown as typeof fetch, fakeTokenProvider());
    await expect(client.decrypt('x')).rejects.toBeInstanceOf(GcpKmsError);
    await expect(client.decrypt('x')).rejects.toMatchObject({ code: 'timeout' });
  });
});
