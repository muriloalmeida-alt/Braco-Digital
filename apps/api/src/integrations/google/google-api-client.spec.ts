import { ServiceUnavailableException } from '@nestjs/common';
import { GoogleApiClient, GoogleApiError } from './google-api-client';
import type { GoogleOAuthConfig } from './google-config';

const CONFIG: GoogleOAuthConfig = {
  clientId: 'client-id-123.apps.googleusercontent.com',
  clientSecret: 'super-secret-value',
  redirectUri: 'https://api.example.com/integrations/google/callback',
  requestTimeoutMs: 200,
};

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } });
}

describe('GoogleApiClient', () => {
  describe('buildAuthorizationUrl', () => {
    it('é pura (nunca chama fetch) e nunca inclui client_secret', () => {
      const fetchFn = jest.fn();
      const client = new GoogleApiClient(CONFIG, fetchFn as unknown as typeof fetch);

      const url = client.buildAuthorizationUrl('state-abc-123');

      expect(fetchFn).not.toHaveBeenCalled();
      expect(url).not.toContain('super-secret-value');
      const parsed = new URL(url);
      expect(parsed.searchParams.get('client_id')).toBe(CONFIG.clientId);
      expect(parsed.searchParams.get('redirect_uri')).toBe(CONFIG.redirectUri);
      expect(parsed.searchParams.get('state')).toBe('state-abc-123');
      expect(parsed.searchParams.get('response_type')).toBe('code');
      expect(parsed.searchParams.get('access_type')).toBe('offline');
    });

    it('usa só os escopos mínimos pedidos — nunca o escopo amplo "calendar"', () => {
      const client = new GoogleApiClient(CONFIG, jest.fn() as unknown as typeof fetch);
      const url = client.buildAuthorizationUrl('s');
      const scope = new URL(url).searchParams.get('scope')!;

      expect(scope.split(' ')).toEqual([
        'https://www.googleapis.com/auth/calendar.calendarlist.readonly',
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/calendar.events.freebusy',
        'https://www.googleapis.com/auth/tasks',
      ]);
      expect(scope).not.toContain('https://www.googleapis.com/auth/calendar ');
      expect(scope.split(' ')).not.toContain('https://www.googleapis.com/auth/calendar');
    });

    it('lança ServiceUnavailableException quando a integração não está configurada', () => {
      const client = new GoogleApiClient(null, jest.fn() as unknown as typeof fetch);
      expect(() => client.buildAuthorizationUrl('s')).toThrow(ServiceUnavailableException);
    });
  });

  describe('troca de código por token', () => {
    it('envia client_secret no corpo form-encoded do POST, nunca na URL', async () => {
      let captured: { url: string; init: RequestInit } | null = null;
      const fetchFn = jest.fn(async (url: string, init: RequestInit) => {
        captured = { url, init };
        return jsonResponse({ access_token: 'at-1', expires_in: 3600, refresh_token: 'rt-1', scope: 'a b', token_type: 'Bearer' });
      });
      const client = new GoogleApiClient(CONFIG, fetchFn as unknown as typeof fetch);

      const tokens = await client.exchangeCodeForTokens('auth-code-xyz');

      expect(captured!.url).toBe('https://oauth2.googleapis.com/token');
      expect(captured!.url).not.toContain('super-secret-value');
      const headers = captured!.init.headers as Record<string, string>;
      expect(headers['Content-Type']).toBe('application/x-www-form-urlencoded');
      const body = new URLSearchParams(captured!.init.body as string);
      expect(body.get('client_secret')).toBe('super-secret-value');
      expect(body.get('code')).toBe('auth-code-xyz');
      expect(body.get('grant_type')).toBe('authorization_code');
      expect(tokens.access_token).toBe('at-1');
    });

    it('nunca repete a troca de código automaticamente (POST não é idempotente aqui)', async () => {
      let calls = 0;
      const fetchFn = jest.fn(async () => {
        calls += 1;
        return new Response('', { status: 500 });
      });
      const client = new GoogleApiClient(CONFIG, fetchFn as unknown as typeof fetch);

      await expect(client.exchangeCodeForTokens('code')).rejects.toMatchObject({ code: 'server_error' });
      expect(calls).toBe(1);
    });
  });

  describe('refresh de token', () => {
    it('usa grant_type=refresh_token e nunca reenvia o refresh token como se fosse code', async () => {
      let captured: RequestInit | null = null;
      const fetchFn = jest.fn(async (_url: string, init: RequestInit) => {
        captured = init;
        return jsonResponse({ access_token: 'at-2', expires_in: 3600, scope: 'a', token_type: 'Bearer' });
      });
      const client = new GoogleApiClient(CONFIG, fetchFn as unknown as typeof fetch);

      await client.refreshAccessToken('rt-existing');

      const body = new URLSearchParams(captured!.body as string);
      expect(body.get('grant_type')).toBe('refresh_token');
      expect(body.get('refresh_token')).toBe('rt-existing');
      expect(body.has('code')).toBe(false);
    });
  });

  describe('revogação', () => {
    it('faz POST para o endpoint de revoke com o token', async () => {
      let captured: { url: string; init: RequestInit } | null = null;
      const fetchFn = jest.fn(async (url: string, init: RequestInit) => {
        captured = { url, init };
        return new Response('', { status: 200 });
      });
      const client = new GoogleApiClient(CONFIG, fetchFn as unknown as typeof fetch);

      await client.revokeToken('token-to-revoke');

      expect(captured!.url).toBe('https://oauth2.googleapis.com/revoke');
      const body = new URLSearchParams(captured!.init.body as string);
      expect(body.get('token')).toBe('token-to-revoke');
    });
  });

  describe('Calendar API', () => {
    it('listCalendars envia Bearer e pagina via nextPageToken', async () => {
      const calls: string[] = [];
      const fetchFn = jest.fn(async (url: string, init: RequestInit) => {
        calls.push(url);
        const headers = init.headers as Record<string, string>;
        expect(headers.Authorization).toBe('Bearer access-token-1');
        if (!url.includes('pageToken')) {
          return jsonResponse({ items: [{ id: 'cal-1', summary: 'Principal', accessRole: 'owner' }], nextPageToken: 'p2' });
        }
        return jsonResponse({ items: [{ id: 'cal-2', summary: 'Secundário', accessRole: 'reader' }] });
      });
      const client = new GoogleApiClient(CONFIG, fetchFn as unknown as typeof fetch);

      const calendars = await client.listCalendars('access-token-1');

      expect(calendars).toHaveLength(2);
      expect(calendars.map((c) => c.id)).toEqual(['cal-1', 'cal-2']);
      expect(calls[0]).toContain('/users/me/calendarList');
      expect(calls[1]).toContain('pageToken=p2');
    });

    it('getCalendarListEntry chama o path certo com o calendarId codificado', async () => {
      let capturedUrl = '';
      const fetchFn = jest.fn(async (url: string) => {
        capturedUrl = url;
        return jsonResponse({ id: 'cal@x.com', summary: 'X', accessRole: 'writer' });
      });
      const client = new GoogleApiClient(CONFIG, fetchFn as unknown as typeof fetch);

      const entry = await client.getCalendarListEntry('at', 'cal@x.com');

      expect(capturedUrl).toContain(encodeURIComponent('cal@x.com'));
      expect(entry.accessRole).toBe('writer');
    });
  });

  describe('Tasks API', () => {
    it('listTaskLists e createTaskList usam Bearer e os paths corretos', async () => {
      const urls: string[] = [];
      const fetchFn = jest.fn(async (url: string, init: RequestInit) => {
        urls.push(url);
        if (init.method === 'GET') return jsonResponse({ items: [{ id: 'tl-1', title: 'Minhas tarefas' }] });
        return jsonResponse({ id: 'tl-2', title: 'BRAÇO — Follow-ups' });
      });
      const client = new GoogleApiClient(CONFIG, fetchFn as unknown as typeof fetch);

      const lists = await client.listTaskLists('at');
      expect(lists).toEqual([{ id: 'tl-1', title: 'Minhas tarefas' }]);

      const created = await client.createTaskList('at', 'BRAÇO — Follow-ups');
      expect(created.id).toBe('tl-2');
      expect(urls.every((u) => u.startsWith('https://tasks.googleapis.com/tasks/v1'))).toBe(true);
    });
  });

  describe('mapeamento de erro por status', () => {
    const cases: [number, string][] = [
      [400, 'invalid_request'],
      [401, 'unauthorized'],
      [403, 'forbidden'],
      [404, 'not_found'],
      [500, 'server_error'],
    ];

    it.each(cases)('status %i vira código %s', async (status, code) => {
      // POST (createTaskList) — sem retry automático, então o teste não
      // depende de esperar múltiplos backoffs reais.
      const fetchFn = jest.fn(async () => new Response('erro interno do Google', { status }));
      const client = new GoogleApiClient(CONFIG, fetchFn as unknown as typeof fetch);

      await expect(client.createTaskList('at', 'X')).rejects.toMatchObject({ code });
    });

    it('429 vira rate_limited e propaga Retry-After em ms', async () => {
      const fetchFn = jest.fn(async () => new Response('', { status: 429, headers: { 'retry-after': '3' } }));
      const client = new GoogleApiClient(CONFIG, fetchFn as unknown as typeof fetch);

      try {
        await client.createTaskList('at', 'X');
        fail('deveria ter lançado');
      } catch (err) {
        expect(err).toBeInstanceOf(GoogleApiError);
        expect((err as GoogleApiError).code).toBe('rate_limited');
        expect((err as GoogleApiError).retryAfterMs).toBe(3000);
      }
    });

    it('nunca inclui o corpo de erro do Google na mensagem devolvida', async () => {
      const fetchFn = jest.fn(async () => new Response('detalhe interno sensível do Google', { status: 500 }));
      const client = new GoogleApiClient(CONFIG, fetchFn as unknown as typeof fetch);

      await expect(client.createTaskList('at', 'X')).rejects.toMatchObject({
        message: expect.not.stringContaining('detalhe interno sensível'),
      });
    });
  });

  describe('retry — só em GET, nunca em POST', () => {
    it('repete uma falha 500 em GET (listCalendars) até funcionar', async () => {
      let calls = 0;
      const fetchFn = jest.fn(async () => {
        calls += 1;
        if (calls < 2) return new Response('', { status: 500 });
        return jsonResponse({ items: [] });
      });
      const client = new GoogleApiClient({ ...CONFIG, requestTimeoutMs: 1000 }, fetchFn as unknown as typeof fetch);

      const result = await client.listCalendars('at');
      expect(result).toEqual([]);
      expect(calls).toBe(2);
    });

    it('nunca repete createTaskList automaticamente, mesmo com 500', async () => {
      let calls = 0;
      const fetchFn = jest.fn(async () => {
        calls += 1;
        return new Response('', { status: 500 });
      });
      const client = new GoogleApiClient(CONFIG, fetchFn as unknown as typeof fetch);

      await expect(client.createTaskList('at', 'X')).rejects.toMatchObject({ code: 'server_error' });
      expect(calls).toBe(1);
    });
  });

  it('timeout local vira GoogleApiError code=timeout', async () => {
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
    const client = new GoogleApiClient({ ...CONFIG, requestTimeoutMs: 20 }, fetchFn as unknown as typeof fetch);

    await expect(client.listTaskLists('at')).rejects.toMatchObject({ code: 'timeout' });
  });
});
