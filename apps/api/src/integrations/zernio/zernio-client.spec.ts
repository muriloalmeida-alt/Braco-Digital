import { ServiceUnavailableException } from '@nestjs/common';
import { ZernioApiError, ZernioClient } from './zernio-client';
import { ZernioMetrics } from './zernio-metrics';
import type { ZernioConfig } from './zernio-config';

const CONFIG: ZernioConfig = {
  baseUrl: 'https://zernio.test/api/v1',
  apiKey: 'sk_test_super_secret',
  webhookSecret: 'whsec_test',
  redirectUrl: 'https://api.example.com/callback',
  requestTimeoutMs: 200,
};

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } });
}

describe('ZernioClient', () => {
  it('envia o header Authorization: Bearer <API_KEY> automaticamente, nunca em query string ou payload', async () => {
    let capturedRequest: { url: string; init: RequestInit } | null = null;
    const fetchFn = jest.fn(async (url: string, init: RequestInit) => {
      capturedRequest = { url, init };
      return jsonResponse({ ok: true });
    });

    const client = new ZernioClient(CONFIG, fetchFn as unknown as typeof fetch, new ZernioMetrics());
    await client.request({ method: 'POST', path: '/profiles', body: { name: 'Empresa X' } });

    expect(capturedRequest).not.toBeNull();
    const headers = capturedRequest!.init.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer sk_test_super_secret');
    expect(capturedRequest!.url).not.toContain('sk_test_super_secret');
    expect(JSON.stringify(capturedRequest!.init.body)).not.toContain('Bearer');
  });

  it('inclui Idempotency-Key quando fornecida', async () => {
    let capturedHeaders: Record<string, string> = {};
    const fetchFn = jest.fn(async (_url: string, init: RequestInit) => {
      capturedHeaders = init.headers as Record<string, string>;
      return jsonResponse({ ok: true });
    });
    const client = new ZernioClient(CONFIG, fetchFn as unknown as typeof fetch, new ZernioMetrics());

    await client.request({ method: 'POST', path: '/inbox/conversations/c1/messages', idempotencyKey: 'idem-123', body: {} });
    expect(capturedHeaders['Idempotency-Key']).toBe('idem-123');
  });

  it('lança ServiceUnavailableException quando a integração não está configurada (config null)', async () => {
    const client = new ZernioClient(null, jest.fn() as unknown as typeof fetch, new ZernioMetrics());
    await expect(client.request({ method: 'GET', path: '/whatsapp/number-info' })).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  describe('mapeamento de erro por status', () => {
    const cases: [number, string][] = [
      [400, 'invalid_request'],
      [401, 'unauthorized'],
      [402, 'payment_required'],
      [403, 'forbidden'],
      [404, 'not_found'],
      [409, 'conflict'],
      [422, 'unprocessable'],
      [500, 'server_error'],
    ];

    it.each(cases)('status %i vira código %s', async (status, code) => {
      const fetchFn = jest.fn(async () => new Response('erro interno do provedor', { status }));
      const client = new ZernioClient(CONFIG, fetchFn as unknown as typeof fetch, new ZernioMetrics());

      await expect(client.request({ method: 'POST', path: '/x' })).rejects.toMatchObject({ code });
    });

    it('429 vira rate_limited e propaga Retry-After em ms', async () => {
      const fetchFn = jest.fn(async () => new Response('', { status: 429, headers: { 'retry-after': '2' } }));
      const client = new ZernioClient(CONFIG, fetchFn as unknown as typeof fetch, new ZernioMetrics());

      try {
        await client.request({ method: 'POST', path: '/x' });
        fail('deveria ter lançado');
      } catch (err) {
        expect(err).toBeInstanceOf(ZernioApiError);
        expect((err as ZernioApiError).code).toBe('rate_limited');
        expect((err as ZernioApiError).retryAfterMs).toBe(2000);
      }
    });

    it('nunca inclui o corpo de erro do provedor na mensagem devolvida ao chamador', async () => {
      const fetchFn = jest.fn(async () => new Response('detalhe interno sensível do Zernio', { status: 500 }));
      const client = new ZernioClient(CONFIG, fetchFn as unknown as typeof fetch, new ZernioMetrics());

      await expect(client.request({ method: 'GET', path: '/x' })).rejects.toMatchObject({
        message: expect.not.stringContaining('detalhe interno sensível'),
      });
    });
  });

  describe('retry — só em GET, nunca em POST/PATCH/DELETE', () => {
    it('repete uma falha 500 em GET até funcionar (dentro do limite)', async () => {
      let calls = 0;
      const fetchFn = jest.fn(async () => {
        calls += 1;
        if (calls < 2) return new Response('', { status: 500 });
        return jsonResponse({ ok: true });
      });
      const client = new ZernioClient({ ...CONFIG, requestTimeoutMs: 1000 }, fetchFn as unknown as typeof fetch, new ZernioMetrics());

      const result = await client.request<{ ok: boolean }>({ method: 'GET', path: '/whatsapp/number-info' });
      expect(result.ok).toBe(true);
      expect(calls).toBe(2);
    });

    it('nunca repete um POST automaticamente, mesmo com 500/timeout — quem chamou decide', async () => {
      let calls = 0;
      const fetchFn = jest.fn(async () => {
        calls += 1;
        return new Response('', { status: 500 });
      });
      const client = new ZernioClient(CONFIG, fetchFn as unknown as typeof fetch, new ZernioMetrics());

      await expect(client.request({ method: 'POST', path: '/inbox/conversations/c1/messages', body: {} })).rejects.toMatchObject({
        code: 'server_error',
      });
      expect(calls).toBe(1);
    });
  });

  it('timeout local vira ZernioApiError code=timeout', async () => {
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
    const client = new ZernioClient({ ...CONFIG, requestTimeoutMs: 20 }, fetchFn as unknown as typeof fetch, new ZernioMetrics());

    await expect(client.request({ method: 'POST', path: '/x' })).rejects.toMatchObject({ code: 'timeout' });
  });
});
