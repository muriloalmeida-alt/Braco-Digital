import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { GoogleConnectionStatus, IntegrationConnectionMode, IntegrationStatus, PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { EnvKeyAesGcmCipher } from '../src/integrations/google/credentials-cipher';
import type { GoogleOAuthConfig } from '../src/integrations/google/google-config';
import { CREDENTIALS_CIPHER, GOOGLE_FETCH, GOOGLE_OAUTH_CONFIG } from '../src/integrations/google/google.tokens';

/**
 * Issue #31 — integração real de Google Calendar + Google Tasks via
 * OAuth. Contra Postgres real (mesmo espírito de `zernio.e2e-spec.ts`):
 * RLS de verdade, não mock de banco. O Google em si é substituído por um
 * fake injetado em `GOOGLE_FETCH` (`overrideProvider`) que valida o
 * contrato HTTP completo (método, path, corpo) a cada chamada.
 */
describe('Google — Calendar + Tasks OAuth real (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;

  const GOOGLE_TEST_CONFIG: GoogleOAuthConfig = {
    clientId: 'e2e-client-id.apps.googleusercontent.com',
    clientSecret: 'e2e-client-secret',
    redirectUri: 'http://localhost:3001/integrations/google/callback',
    requestTimeoutMs: 2000,
  };
  const TEST_CIPHER_KEY = randomBytes(32).toString('base64');

  type FetchStub = (url: string, init: RequestInit) => Promise<Response>;
  let fetchImpl: FetchStub = async () => new Response('não configurado neste teste', { status: 500 });
  const fetchCalls: { url: string; init: RequestInit }[] = [];
  const fakeFetch = (jest.fn(async (url: string, init: RequestInit) => {
    fetchCalls.push({ url, init });
    return fetchImpl(url, init);
  }) as unknown) as typeof fetch;

  function jsonRes(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
  }

  function tokenResponse(overrides: Partial<{ access_token: string; refresh_token: string; expires_in: number }> = {}) {
    return {
      access_token: overrides.access_token ?? 'access-token-default',
      expires_in: overrides.expires_in ?? 3600,
      refresh_token: overrides.refresh_token,
      scope: 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/tasks',
      token_type: 'Bearer',
    };
  }

  const plainPassword = 'senha-teste-123';
  const provisionedCompanyIds: string[] = [];
  const provisionedUserIds: string[] = [];

  async function provisionCompany(label: string): Promise<{ id: string; token: string }> {
    const passwordHash = await bcrypt.hash(plainPassword, 10);
    const company = await prisma.company.create({ data: { name: `E2E Google ${label}` } });
    const email = `e2e-google-${label}-${company.id.slice(0, 8)}@test.local`;
    const user = await prisma.user.create({ data: { email, name: `Owner ${label}`, passwordHash } });
    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SELECT set_config('app.current_company_id', $1, true)`, company.id);
      await tx.companyMembership.create({ data: { companyId: company.id, userId: user.id, role: 'OWNER' } });
    });
    const res = await request(app.getHttpServer()).post('/auth/login').send({ email, password: plainPassword }).expect(200);
    provisionedCompanyIds.push(company.id);
    provisionedUserIds.push(user.id);
    return { id: company.id, token: res.body.accessToken as string };
  }

  function extractState(authorizationUrl: string): string {
    return new URL(authorizationUrl).searchParams.get('state')!;
  }

  async function startOAuth(token: string): Promise<string> {
    const res = await request(app.getHttpServer())
      .post('/integrations/google/connect')
      .set('Authorization', `Bearer ${token}`)
      .expect(201);
    return extractState(res.body.authorizationUrl);
  }

  /** Onboarding completo: OAuth conectado, pronto para selecionar Calendar/Tasks. */
  async function connectCompany(token: string, tokens: ReturnType<typeof tokenResponse> = tokenResponse({ refresh_token: 'rt-1' })) {
    const state = await startOAuth(token);
    fetchImpl = async (url) => {
      if (url.includes('oauth2.googleapis.com/token')) return jsonRes(tokens);
      throw new Error(`chamada inesperada: ${url}`);
    };
    await request(app.getHttpServer()).get('/integrations/google/callback').query({ state, code: 'auth-code' }).expect(302);
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(GOOGLE_OAUTH_CONFIG)
      .useValue(GOOGLE_TEST_CONFIG)
      .overrideProvider(GOOGLE_FETCH)
      .useValue(fakeFetch)
      .overrideProvider(CREDENTIALS_CIPHER)
      .useValue(new EnvKeyAesGcmCipher(TEST_CIPHER_KEY))
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.googleOAuthAttempt.deleteMany({ where: { companyId: { in: provisionedCompanyIds } } });
    await prisma.googleConnection.deleteMany({ where: { companyId: { in: provisionedCompanyIds } } });
    await prisma.integration.deleteMany({ where: { companyId: { in: provisionedCompanyIds } } });
    await prisma.digitalEmployee.deleteMany({ where: { companyId: { in: provisionedCompanyIds } } });
    await prisma.companyMembership.deleteMany({ where: { companyId: { in: provisionedCompanyIds } } });
    await prisma.company.deleteMany({ where: { id: { in: provisionedCompanyIds } } });
    await prisma.user.deleteMany({ where: { id: { in: provisionedUserIds } } });
    await prisma.$disconnect();
    await app.close();
  });

  beforeEach(() => {
    fetchCalls.length = 0;
    fetchImpl = async () => new Response('não configurado neste teste', { status: 500 });
  });

  describe('Onboarding (start OAuth)', () => {
    it('cria a tentativa e devolve uma authorizationUrl com os escopos mínimos, sem o client_secret', async () => {
      const company = await provisionCompany('onboarding');
      const res = await request(app.getHttpServer())
        .post('/integrations/google/connect')
        .set('Authorization', `Bearer ${company.token}`)
        .expect(201);

      const url = new URL(res.body.authorizationUrl);
      expect(url.hostname).toBe('accounts.google.com');
      expect(url.searchParams.get('client_id')).toBe(GOOGLE_TEST_CONFIG.clientId);
      expect(res.body.authorizationUrl).not.toContain(GOOGLE_TEST_CONFIG.clientSecret);
      expect(url.searchParams.get('scope')).not.toContain('auth/calendar '); // nunca o escopo amplo isolado
      expect(url.searchParams.get('state')).toBeTruthy();

      const connection = await prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SELECT set_config('app.current_company_id', $1, true)`, company.id);
        return tx.googleConnection.findUnique({ where: { companyId: company.id } });
      });
      expect(connection?.status).toBe(GoogleConnectionStatus.CONNECTING);
    });
  });

  describe('Callback', () => {
    it('válido: troca code por token, cifra e persiste, marca CONNECTED — nunca em texto plano', async () => {
      const company = await provisionCompany('cb-valid');
      const state = await startOAuth(company.token);

      fetchImpl = async (url, init) => {
        expect(url).toBe('https://oauth2.googleapis.com/token');
        const body = new URLSearchParams(init.body as string);
        expect(body.get('client_secret')).toBe(GOOGLE_TEST_CONFIG.clientSecret);
        expect(body.get('grant_type')).toBe('authorization_code');
        return jsonRes(tokenResponse({ access_token: 'at-valid', refresh_token: 'rt-valid' }));
      };

      const res = await request(app.getHttpServer()).get('/integrations/google/callback').query({ state, code: 'code-1' }).expect(302);
      expect(res.headers.location).toContain('google=success');

      const connection = await prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SELECT set_config('app.current_company_id', $1, true)`, company.id);
        return tx.googleConnection.findUnique({ where: { companyId: company.id } });
      });
      expect(connection?.status).toBe(GoogleConnectionStatus.CONNECTED);
      expect(connection?.accessTokenEncrypted).toBeTruthy();
      expect(connection?.accessTokenEncrypted).not.toContain('at-valid');
      expect(connection?.refreshTokenEncrypted).not.toContain('rt-valid');
    });

    it('state inexistente: rejeita e não chama o Google', async () => {
      const res = await request(app.getHttpServer())
        .get('/integrations/google/callback')
        .query({ state: 'estado-nunca-criado', code: 'code-1' })
        .expect(302);
      expect(res.headers.location).toContain('reason=session_expired');
      expect(fetchCalls.length).toBe(0);
    });

    it('expirado: rejeita e não consulta o Google', async () => {
      const company = await provisionCompany('cb-expired');
      const state = await startOAuth(company.token);
      await prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SELECT set_config('app.current_company_id', $1, true)`, company.id);
        await tx.googleOAuthAttempt.update({ where: { id: state }, data: { expiresAt: new Date(Date.now() - 1000) } });
      });

      const res = await request(app.getHttpServer())
        .get('/integrations/google/callback')
        .query({ state, code: 'code-1' })
        .expect(302);
      expect(res.headers.location).toContain('reason=session_expired');
      expect(fetchCalls.length).toBe(0);
    });

    it('replay: a segunda chamada com o mesmo state é rejeitada', async () => {
      const company = await provisionCompany('cb-replay');
      const state = await startOAuth(company.token);
      fetchImpl = async () => jsonRes(tokenResponse({ refresh_token: 'rt-1' }));

      const first = await request(app.getHttpServer()).get('/integrations/google/callback').query({ state, code: 'code-1' }).expect(302);
      expect(first.headers.location).toContain('google=success');

      const second = await request(app.getHttpServer()).get('/integrations/google/callback').query({ state, code: 'code-1' }).expect(302);
      expect(second.headers.location).toContain('reason=session_expired');
    });

    it('cancelado pelo usuário: estado compreensível, não chama o Google', async () => {
      const company = await provisionCompany('cb-cancelled');
      const state = await startOAuth(company.token);

      const res = await request(app.getHttpServer())
        .get('/integrations/google/callback')
        .query({ state, error: 'access_denied' })
        .expect(302);
      expect(res.headers.location).toContain('reason=connection_cancelled');
      expect(fetchCalls.length).toBe(0);

      const connection = await prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SELECT set_config('app.current_company_id', $1, true)`, company.id);
        return tx.googleConnection.findUnique({ where: { companyId: company.id } });
      });
      expect(connection?.status).toBe(GoogleConnectionStatus.NOT_CONNECTED);
    });

    it('falha na troca de code por token: marca FAILED e redireciona com erro', async () => {
      const company = await provisionCompany('cb-tokenfail');
      const state = await startOAuth(company.token);
      fetchImpl = async () => new Response('', { status: 400 });

      const res = await request(app.getHttpServer()).get('/integrations/google/callback').query({ state, code: 'code-1' }).expect(302);
      expect(res.headers.location).toContain('reason=google_error');

      const connection = await prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SELECT set_config('app.current_company_id', $1, true)`, company.id);
        return tx.googleConnection.findUnique({ where: { companyId: company.id } });
      });
      expect(connection?.status).toBe(GoogleConnectionStatus.FAILED);
    });
  });

  describe('Calendar — seleção real', () => {
    it('accessRole owner/writer: valida, persiste e marca Integration REAL+CONNECTED', async () => {
      const company = await provisionCompany('cal-valid');
      await connectCompany(company.token);

      fetchImpl = async (url) => {
        expect(url).toContain('/users/me/calendarList/');
        return jsonRes({ id: 'primary', summary: 'Agenda Principal', accessRole: 'owner' });
      };

      const res = await request(app.getHttpServer())
        .post('/integrations/google/calendar/select')
        .set('Authorization', `Bearer ${company.token}`)
        .send({ calendarId: 'primary' })
        .expect(201);
      expect(res.body.status).toBe(IntegrationStatus.CONNECTED);
      expect(res.body.connectionMode).toBe(IntegrationConnectionMode.REAL);
      expect(res.body.externalAccountRef).toBe('primary');

      const integration = await prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SELECT set_config('app.current_company_id', $1, true)`, company.id);
        return tx.integration.findUnique({ where: { companyId_type: { companyId: company.id, type: 'GOOGLE_CALENDAR' } } });
      });
      expect(integration?.status).toBe('CONNECTED');
      expect(integration?.connectionMode).toBe('REAL');
    });

    it('accessRole reader (sem permissão de escrita): rejeita e NÃO persiste — sem criar evento fake para provar acesso', async () => {
      const company = await provisionCompany('cal-readonly');
      await connectCompany(company.token);

      const callsBeforeSelect = fetchCalls.length;
      fetchImpl = async () => jsonRes({ id: 'readonly-cal', summary: 'Só leitura', accessRole: 'reader' });

      await request(app.getHttpServer())
        .post('/integrations/google/calendar/select')
        .set('Authorization', `Bearer ${company.token}`)
        .send({ calendarId: 'readonly-cal' })
        .expect(403);

      // Nenhuma chamada de escrita (events.insert ou similar) foi feita —
      // só a consulta de metadata (accessRole).
      const callsDuringSelect = fetchCalls.slice(callsBeforeSelect);
      expect(callsDuringSelect.length).toBeGreaterThan(0);
      expect(callsDuringSelect.every((c) => c.url.includes('/calendarList/'))).toBe(true);

      const integration = await prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SELECT set_config('app.current_company_id', $1, true)`, company.id);
        return tx.integration.findUnique({ where: { companyId_type: { companyId: company.id, type: 'GOOGLE_CALENDAR' } } });
      });
      expect(integration).toBeNull();
    });

    it('calendarId inexistente: 404, sem persistir', async () => {
      const company = await provisionCompany('cal-notfound');
      await connectCompany(company.token);
      fetchImpl = async () => new Response('', { status: 404 });

      await request(app.getHttpServer())
        .post('/integrations/google/calendar/select')
        .set('Authorization', `Bearer ${company.token}`)
        .send({ calendarId: 'nao-existe' })
        .expect(404);
    });
  });

  describe('Tasks — setup idempotente', () => {
    it('cria "BRAÇO — Follow-ups" quando não existe', async () => {
      const company = await provisionCompany('tasks-create');
      await connectCompany(company.token);

      let createCalls = 0;
      fetchImpl = async (url, init) => {
        if (init.method === 'GET') return jsonRes({ items: [{ id: 'other-list', title: 'Minhas tarefas pessoais' }] });
        createCalls += 1;
        const body = JSON.parse(init.body as string);
        expect(body.title).toBe('BRAÇO — Follow-ups');
        return jsonRes({ id: 'tl-new', title: 'BRAÇO — Follow-ups' });
      };

      const res = await request(app.getHttpServer())
        .post('/integrations/google/tasks/setup')
        .set('Authorization', `Bearer ${company.token}`)
        .expect(201);
      expect(res.body.externalAccountRef).toBe('tl-new');
      expect(createCalls).toBe(1);
    });

    it('reutiliza a lista existente quando já há uma "BRAÇO — Follow-ups" — nunca cria duplicata', async () => {
      const company = await provisionCompany('tasks-reuse');
      await connectCompany(company.token);

      let createCalls = 0;
      fetchImpl = async (url, init) => {
        if (init.method === 'GET') return jsonRes({ items: [{ id: 'tl-existing', title: 'BRAÇO — Follow-ups' }] });
        createCalls += 1;
        return jsonRes({ id: 'should-not-be-created', title: 'x' });
      };

      const res = await request(app.getHttpServer())
        .post('/integrations/google/tasks/setup')
        .set('Authorization', `Bearer ${company.token}`)
        .expect(201);
      expect(res.body.externalAccountRef).toBe('tl-existing');
      expect(createCalls).toBe(0);
    });
  });

  describe('Readiness — Integration real alimenta a mesma leitura de ResourcesService', () => {
    it('depois de Calendar+Tasks reais, /digital-employees/:id/resources reflete CONNECTED+REAL sem nenhuma mudança em ResourcesService', async () => {
      const company = await provisionCompany('readiness');
      await connectCompany(company.token);

      fetchImpl = async (url, init) => {
        if (url.includes('/calendarList/')) return jsonRes({ id: 'primary', summary: 'Agenda', accessRole: 'owner' });
        if (init.method === 'GET' && url.includes('/lists')) return jsonRes({ items: [] });
        if (init.method === 'POST' && url.includes('/lists')) return jsonRes({ id: 'tl-1', title: 'BRAÇO — Follow-ups' });
        throw new Error(`inesperado: ${url}`);
      };
      await request(app.getHttpServer())
        .post('/integrations/google/calendar/select')
        .set('Authorization', `Bearer ${company.token}`)
        .send({ calendarId: 'primary' })
        .expect(201);
      await request(app.getHttpServer()).post('/integrations/google/tasks/setup').set('Authorization', `Bearer ${company.token}`).expect(201);

      const atendimento = await prisma.employeeType.findUniqueOrThrow({ where: { key: 'atendimento' } });
      const hire = await request(app.getHttpServer())
        .post('/digital-employees')
        .set('Authorization', `Bearer ${company.token}`)
        .send({ employeeTypeId: atendimento.id })
        .expect(201);
      const employeeId = hire.body.id;

      // Habilita responsabilidades que exigem Calendar/Tasks (catálogo já
      // existente, não alterado por esta issue).
      await request(app.getHttpServer())
        .patch(`/digital-employees/${employeeId}/responsibilities`)
        .set('Authorization', `Bearer ${company.token}`)
        .send({
          responsibilities: [
            { key: 'agendar', enabled: true },
            { key: 'fazer_follow_up', enabled: true },
          ],
        })
        .expect(200);

      const resources = await request(app.getHttpServer())
        .get(`/digital-employees/${employeeId}/resources`)
        .set('Authorization', `Bearer ${company.token}`)
        .expect(200);

      const calendar = resources.body.find((r: { type: string }) => r.type === 'GOOGLE_CALENDAR');
      const tasks = resources.body.find((r: { type: string }) => r.type === 'GOOGLE_TASKS');
      expect(calendar).toMatchObject({ status: 'CONNECTED', connectionMode: 'REAL', required: true });
      expect(tasks).toMatchObject({ status: 'CONNECTED', connectionMode: 'REAL', required: true });
    });
  });

  describe('Disconnect — OAuth compartilhado', () => {
    it('desconectar Calendar não revoga OAuth se Tasks continuar conectado', async () => {
      const company = await provisionCompany('disc-cal');
      await connectCompany(company.token);
      fetchImpl = async (url, init) => {
        if (url.includes('/calendarList/')) return jsonRes({ id: 'primary', summary: 'Agenda', accessRole: 'owner' });
        if (init.method === 'GET' && url.includes('/lists')) return jsonRes({ items: [] });
        if (init.method === 'POST' && url.includes('/lists')) return jsonRes({ id: 'tl-1', title: 'BRAÇO — Follow-ups' });
        throw new Error(`inesperado: ${url}`);
      };
      await request(app.getHttpServer()).post('/integrations/google/calendar/select').set('Authorization', `Bearer ${company.token}`).send({ calendarId: 'primary' }).expect(201);
      await request(app.getHttpServer()).post('/integrations/google/tasks/setup').set('Authorization', `Bearer ${company.token}`).expect(201);

      fetchImpl = async (url) => {
        throw new Error(`revoke não deveria ter sido chamado: ${url}`);
      };
      await request(app.getHttpServer()).post('/integrations/google/calendar/disconnect').set('Authorization', `Bearer ${company.token}`).expect(201);

      const status = await request(app.getHttpServer()).get('/integrations/google/status').set('Authorization', `Bearer ${company.token}`).expect(200);
      expect(status.body.calendar.status).toBe('DISCONNECTED');
      expect(status.body.tasks.status).toBe('CONNECTED');
      expect(status.body.connection.status).toBe(GoogleConnectionStatus.CONNECTED);
    });

    it('desconectar o último recurso ativo faz revoke best-effort e limpa as credenciais locais', async () => {
      const company = await provisionCompany('disc-last');
      await connectCompany(company.token, tokenResponse({ refresh_token: 'rt-to-revoke' }));
      fetchImpl = async (url) => {
        if (url.includes('/calendarList/')) return jsonRes({ id: 'primary', summary: 'Agenda', accessRole: 'owner' });
        throw new Error(`inesperado: ${url}`);
      };
      await request(app.getHttpServer()).post('/integrations/google/calendar/select').set('Authorization', `Bearer ${company.token}`).send({ calendarId: 'primary' }).expect(201);

      let revokeCalled = false;
      fetchImpl = async (url, init) => {
        expect(url).toBe('https://oauth2.googleapis.com/revoke');
        revokeCalled = true;
        const body = new URLSearchParams(init.body as string);
        expect(body.get('token')).toBe('rt-to-revoke');
        return new Response('', { status: 200 });
      };
      await request(app.getHttpServer()).post('/integrations/google/calendar/disconnect').set('Authorization', `Bearer ${company.token}`).expect(201);

      expect(revokeCalled).toBe(true);
      const connection = await prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SELECT set_config('app.current_company_id', $1, true)`, company.id);
        return tx.googleConnection.findUnique({ where: { companyId: company.id } });
      });
      expect(connection?.status).toBe(GoogleConnectionStatus.DISCONNECTED);
      expect(connection?.accessTokenEncrypted).toBeNull();
      expect(connection?.refreshTokenEncrypted).toBeNull();
    });

    it('falha remota no revoke não deixa o recurso CONNECTED — best-effort, limpa local mesmo assim', async () => {
      const company = await provisionCompany('disc-revoke-fail');
      await connectCompany(company.token);
      fetchImpl = async (url) => {
        if (url.includes('/calendarList/')) return jsonRes({ id: 'primary', summary: 'Agenda', accessRole: 'owner' });
        throw new Error(`inesperado: ${url}`);
      };
      await request(app.getHttpServer()).post('/integrations/google/calendar/select').set('Authorization', `Bearer ${company.token}`).send({ calendarId: 'primary' }).expect(201);

      fetchImpl = async () => new Response('', { status: 500 }); // revoke falha

      await request(app.getHttpServer()).post('/integrations/google/calendar/disconnect').set('Authorization', `Bearer ${company.token}`).expect(201);

      const status = await request(app.getHttpServer()).get('/integrations/google/status').set('Authorization', `Bearer ${company.token}`).expect(200);
      expect(status.body.calendar.status).toBe('DISCONNECTED');
      expect(status.body.connection.status).toBe(GoogleConnectionStatus.DISCONNECTED);
    });
  });

  describe('Refresh e revogação', () => {
    it('access token perto de expirar é renovado automaticamente, preservando o refresh token quando o Google não devolve um novo', async () => {
      const company = await provisionCompany('refresh-preserve');
      await connectCompany(company.token, tokenResponse({ access_token: 'at-1', refresh_token: 'rt-original', expires_in: 1 }));

      // expires_in=1s já deve estar "perto de expirar" (margem de 60s) —
      // a próxima chamada autenticada deve renovar.
      let refreshCalled = false;
      fetchImpl = async (url, init) => {
        if (url.includes('/calendarList/')) {
          expect(fetchCalls.some((c) => c.url === 'https://oauth2.googleapis.com/token')).toBe(true);
          return jsonRes({ id: 'primary', summary: 'Agenda', accessRole: 'owner' });
        }
        expect(url).toBe('https://oauth2.googleapis.com/token');
        const body = new URLSearchParams(init.body as string);
        expect(body.get('grant_type')).toBe('refresh_token');
        expect(body.get('refresh_token')).toBe('rt-original');
        refreshCalled = true;
        // Google NÃO devolve um novo refresh_token nesta renovação.
        return jsonRes(tokenResponse({ access_token: 'at-2' }));
      };

      await request(app.getHttpServer())
        .post('/integrations/google/calendar/select')
        .set('Authorization', `Bearer ${company.token}`)
        .send({ calendarId: 'primary' })
        .expect(201);
      expect(refreshCalled).toBe(true);

      const connection = await prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SELECT set_config('app.current_company_id', $1, true)`, company.id);
        return tx.googleConnection.findUnique({ where: { companyId: company.id } });
      });
      // refresh token nunca foi sobrescrito por null.
      expect(connection?.refreshTokenEncrypted).toBeTruthy();
    });

    it('falha definitiva de refresh (ex.: revogado externamente) degrada a conexão e marca os recursos afetados NEEDS_ATTENTION', async () => {
      const company = await provisionCompany('refresh-fail');
      // expires_in longo aqui: o próprio setup (select calendar) não deve
      // precisar renovar — só a ação seguinte, depois de expirarmos o
      // token manualmente, é que deve disparar o refresh que vai falhar.
      await connectCompany(company.token, tokenResponse({ refresh_token: 'rt-1', expires_in: 3600 }));
      fetchImpl = async (url) => {
        if (url.includes('/calendarList/')) return jsonRes({ id: 'primary', summary: 'Agenda', accessRole: 'owner' });
        throw new Error(`inesperado: ${url}`);
      };
      await request(app.getHttpServer()).post('/integrations/google/calendar/select').set('Authorization', `Bearer ${company.token}`).send({ calendarId: 'primary' }).expect(201);

      // Expira o access token manualmente (simula o tempo passar) para
      // forçar a próxima chamada autenticada a tentar renovar.
      await prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SELECT set_config('app.current_company_id', $1, true)`, company.id);
        await tx.googleConnection.update({ where: { companyId: company.id }, data: { tokenExpiresAt: new Date(Date.now() - 1000) } });
      });

      // Simula revogação: qualquer chamada ao token endpoint falha com invalid_grant.
      fetchImpl = async (url) => {
        if (url === 'https://oauth2.googleapis.com/token') return new Response(JSON.stringify({ error: 'invalid_grant' }), { status: 400 });
        throw new Error(`inesperado: ${url}`);
      };

      await request(app.getHttpServer())
        .get('/integrations/google/calendars')
        .set('Authorization', `Bearer ${company.token}`)
        .expect(403);

      const [connection, integration] = await Promise.all([
        prisma.$transaction(async (tx) => {
          await tx.$executeRawUnsafe(`SELECT set_config('app.current_company_id', $1, true)`, company.id);
          return tx.googleConnection.findUnique({ where: { companyId: company.id } });
        }),
        prisma.$transaction(async (tx) => {
          await tx.$executeRawUnsafe(`SELECT set_config('app.current_company_id', $1, true)`, company.id);
          return tx.integration.findUnique({ where: { companyId_type: { companyId: company.id, type: 'GOOGLE_CALENDAR' } } });
        }),
      ]);
      expect(connection?.status).toBe(GoogleConnectionStatus.DEGRADED);
      expect(integration?.status).toBe(IntegrationStatus.NEEDS_ATTENTION);
      // Nunca mantido CONNECTED silenciosamente.
      expect(integration?.status).not.toBe(IntegrationStatus.CONNECTED);
    });
  });

  describe('Isolamento entre tenants', () => {
    it('a GoogleConnection da empresa A não é visível sob o tenant da empresa B', async () => {
      const companyA = await provisionCompany('tenant-a');
      const companyB = await provisionCompany('tenant-b');
      await connectCompany(companyA.token);

      const connectionUnderB = await prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SELECT set_config('app.current_company_id', $1, true)`, companyB.id);
        return tx.googleConnection.findUnique({ where: { companyId: companyA.id } });
      });
      expect(connectionUnderB).toBeNull();
    });

    it('a empresa B (sem conexão própria) não consegue listar calendários usando a conexão de A', async () => {
      const companyA = await provisionCompany('tenant-a2');
      const companyB = await provisionCompany('tenant-b2');
      await connectCompany(companyA.token);

      await request(app.getHttpServer())
        .get('/integrations/google/calendars')
        .set('Authorization', `Bearer ${companyB.token}`)
        .expect(403);
    });

    it('a empresa B não consegue desconectar a conexão Google da empresa A', async () => {
      const companyA = await provisionCompany('tenant-a3');
      const companyB = await provisionCompany('tenant-b3');
      await connectCompany(companyA.token);

      // Nem 404 nem 200 "sucesso" — a rota só opera sobre a própria
      // empresa de B (que não tem Integration GOOGLE_CALENDAR nenhuma).
      await request(app.getHttpServer())
        .post('/integrations/google/calendar/disconnect')
        .set('Authorization', `Bearer ${companyB.token}`)
        .expect(404);

      const connectionA = await prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SELECT set_config('app.current_company_id', $1, true)`, companyA.id);
        return tx.googleConnection.findUnique({ where: { companyId: companyA.id } });
      });
      expect(connectionA?.status).toBe(GoogleConnectionStatus.CONNECTED);
    });
  });
});
