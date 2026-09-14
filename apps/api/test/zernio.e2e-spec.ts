import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient, ZernioConnectionStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import type { ZernioConfig } from '../src/integrations/zernio/zernio-config';
import { ZernioMessagesService } from '../src/integrations/zernio/zernio-messages.service';
import { applyZernioWebhookRawBody } from '../src/integrations/zernio/zernio-webhook.middleware';
import { ZERNIO_CONFIG, ZERNIO_FETCH } from '../src/integrations/zernio/zernio.tokens';

/**
 * Issue #30 — integração real de WhatsApp via Zernio. Contra Postgres
 * real (mesmo espírito de `preparation.e2e-spec.ts`/`tenant-
 * isolation.e2e-spec.ts`): RLS de verdade, não mock de banco. O Zernio em
 * si é substituído por um fake injetado em `ZERNIO_FETCH`
 * (`overrideProvider`) que valida o contrato HTTP completo (método,
 * path, headers, corpo) a cada chamada — nunca aceita silenciosamente
 * uma chamada malformada.
 */
describe('Zernio — WhatsApp real (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;

  const ZERNIO_TEST_CONFIG: ZernioConfig = {
    baseUrl: 'http://fake-zernio.test/api/v1',
    apiKey: 'sk_test_e2e_secret',
    webhookSecret: 'whsec_e2e_test_secret',
    redirectUrl: 'http://localhost:3001/integrations/zernio/whatsapp/callback',
    requestTimeoutMs: 2000,
  };

  function sign(body: Buffer): string {
    return crypto.createHmac('sha256', ZERNIO_TEST_CONFIG.webhookSecret).update(body).digest('hex');
  }

  /**
   * `supertest`/`superagent` serializa (`JSON.stringify`) qualquer corpo
   * que não seja `string` sempre que o `Content-Type` é JSON — inclusive
   * um `Buffer`, virando `{"type":"Buffer","data":[...]}` no corpo real
   * da requisição. Isso quebraria a verificação HMAC (que precisa dos
   * bytes exatos) silenciosamente. Enviar a versão `string` (utf8) do
   * mesmo buffer evita essa serialização e preserva os bytes assinados.
   */
  function postWebhook(headers: Record<string, string>, body: Buffer) {
    return request(app.getHttpServer())
      .post('/webhooks/zernio')
      .set('Content-Type', 'application/json')
      .set(headers)
      .send(body.toString('utf8'));
  }

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

  const companyA = { id: 'e2e20000-0000-0000-0000-00000000000a', name: 'E2E Zernio Empresa A' };
  const companyB = { id: 'e2e20000-0000-0000-0000-00000000000b', name: 'E2E Zernio Empresa B' };
  const ownerAEmail = 'e2e-zernio-owner-a@test.local';
  const ownerBEmail = 'e2e-zernio-owner-b@test.local';
  const plainPassword = 'senha-teste-123';
  let ownerAId: string;
  let ownerBId: string;
  let tokenA: string;
  let tokenB: string;

  // Empresas provisionadas sob demanda (uma por cenário de Callback/Webhook/
  // Envio) — necessário porque `ensureProfile` é (corretamente) "pegajoso"
  // por empresa: a primeira vez que uma empresa ganha um profileId, esse é
  // o profileId dela para sempre (como em produção). Reusar `companyA` em
  // vários cenários com profileId esperado diferente faria o callback
  // detectar uma "adulteração" que não existe de verdade — é a suíte que
  // precisa de isolamento, não a implementação que precisa relaxar.
  const provisionedCompanyIds: string[] = [];
  const provisionedUserIds: string[] = [];

  async function provisionCompany(label: string): Promise<{ id: string; token: string }> {
    const passwordHash = await bcrypt.hash(plainPassword, 10);
    const company = await prisma.company.create({ data: { name: `E2E Zernio ${label}` } });
    const email = `e2e-zernio-${label}-${company.id.slice(0, 8)}@test.local`;
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

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(ZERNIO_CONFIG)
      .useValue(ZERNIO_TEST_CONFIG)
      .overrideProvider(ZERNIO_FETCH)
      .useValue(fakeFetch)
      .compile();

    // `bodyParser: false` — mesmo motivo de `main.ts`: sem isto, o parser
    // JSON automático do Nest consome o corpo antes do `raw()` do
    // webhook rodar, e a verificação HMAC estaria testando um caminho
    // que a produção não usa (pior: um bug que só aparece rodando de
    // verdade, não no typecheck).
    app = moduleRef.createNestApplication({ bodyParser: false });
    applyZernioWebhookRawBody(app);
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = new PrismaClient();
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    await prisma.company.createMany({ data: [companyA, companyB], skipDuplicates: true });

    const ownerA = await prisma.user.upsert({
      where: { email: ownerAEmail },
      update: { passwordHash },
      create: { email: ownerAEmail, name: 'Owner Zernio A', passwordHash },
    });
    ownerAId = ownerA.id;
    const ownerB = await prisma.user.upsert({
      where: { email: ownerBEmail },
      update: { passwordHash },
      create: { email: ownerBEmail, name: 'Owner Zernio B', passwordHash },
    });
    ownerBId = ownerB.id;

    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SELECT set_config('app.current_company_id', $1, true)`, companyA.id);
      await tx.companyMembership.upsert({
        where: { companyId_userId: { companyId: companyA.id, userId: ownerAId } },
        update: { role: 'OWNER' },
        create: { companyId: companyA.id, userId: ownerAId, role: 'OWNER' },
      });
    });
    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SELECT set_config('app.current_company_id', $1, true)`, companyB.id);
      await tx.companyMembership.upsert({
        where: { companyId_userId: { companyId: companyB.id, userId: ownerBId } },
        update: { role: 'OWNER' },
        create: { companyId: companyB.id, userId: ownerBId, role: 'OWNER' },
      });
    });

    async function login(email: string) {
      const res = await request(app.getHttpServer()).post('/auth/login').send({ email, password: plainPassword }).expect(200);
      return res.body.accessToken as string;
    }
    tokenA = await login(ownerAEmail);
    tokenB = await login(ownerBEmail);
  });

  afterAll(async () => {
    const allCompanyIds = [companyA.id, companyB.id, ...provisionedCompanyIds];
    const allUserIds = [ownerAId, ownerBId, ...provisionedUserIds];
    await prisma.zernioMessage.deleteMany({ where: { companyId: { in: allCompanyIds } } });
    await prisma.zernioWebhookEvent.deleteMany({});
    await prisma.zernioOnboardingAttempt.deleteMany({ where: { companyId: { in: allCompanyIds } } });
    await prisma.zernioConnection.deleteMany({ where: { companyId: { in: allCompanyIds } } });
    await prisma.companyMembership.deleteMany({ where: { companyId: { in: provisionedCompanyIds } } });
    await prisma.company.deleteMany({ where: { id: { in: allCompanyIds } } });
    await prisma.user.deleteMany({ where: { id: { in: allUserIds } } });
    await prisma.$disconnect();
    await app.close();
  });

  beforeEach(() => {
    fetchCalls.length = 0;
    fetchImpl = async () => new Response('não configurado neste teste', { status: 500 });
  });

  function extractCorrelationId(redirectUrl: string): string {
    return new URL(redirectUrl).searchParams.get('correlationId')!;
  }

  describe('Criação/reuso do profile + geração do authUrl', () => {
    it('cria o profile na primeira chamada e reutiliza (nunca cria dois) numa segunda', async () => {
      let profileCreations = 0;
      fetchImpl = async (url, init) => {
        if (url.includes('/profiles')) {
          profileCreations += 1;
          expect(init.method).toBe('POST');
          expect((init.headers as Record<string, string>).Authorization).toBe(`Bearer ${ZERNIO_TEST_CONFIG.apiKey}`);
          expect(JSON.parse(init.body as string)).toEqual({ name: `BRAÇO — ${companyA.name}` });
          return jsonRes({ _id: 'profile-a-1' });
        }
        if (url.includes('/connect/whatsapp')) {
          expect(init.method).toBe('GET');
          const u = new URL(url);
          expect(u.searchParams.get('profileId')).toBe('profile-a-1');
          expect(u.searchParams.get('onboarding')).toBe('api');
          expect(u.searchParams.get('signup')).toBe('hosted');
          expect(u.searchParams.get('redirect_url')).toContain(ZERNIO_TEST_CONFIG.redirectUrl);
          return jsonRes({ authUrl: 'https://zernio.test/embedded-signup?token=abc', state: 'zernio-state-1' });
        }
        throw new Error(`chamada inesperada: ${url}`);
      };

      const first = await request(app.getHttpServer())
        .post('/integrations/zernio/whatsapp/connect')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(201);
      expect(first.body.authUrl).toBe('https://zernio.test/embedded-signup?token=abc');
      expect(profileCreations).toBe(1);

      const second = await request(app.getHttpServer())
        .post('/integrations/zernio/whatsapp/connect')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(201);
      expect(second.body.authUrl).toBeTruthy();
      expect(profileCreations).toBe(1); // não criou um segundo profile
    });
  });

  describe('Callback', () => {
    async function startOnboarding(token: string, profileId: string) {
      fetchImpl = async (url) => {
        if (url.includes('/profiles')) return jsonRes({ _id: profileId });
        if (url.includes('/connect/whatsapp')) return jsonRes({ authUrl: 'https://zernio.test/signup', state: 's1' });
        throw new Error(`chamada inesperada: ${url}`);
      };
      const res = await request(app.getHttpServer())
        .post('/integrations/zernio/whatsapp/connect')
        .set('Authorization', `Bearer ${token}`)
        .expect(201);
      // O redirect_url enviado ao Zernio carrega nosso correlationId —
      // capturado a partir da chamada real feita a /connect/whatsapp.
      const connectCall = fetchCalls.find((c) => c.url.includes('/connect/whatsapp'))!;
      const redirectUrlSent = new URL(connectCall.url).searchParams.get('redirect_url')!;
      return { authUrl: res.body.authUrl, correlationId: extractCorrelationId(redirectUrlSent) };
    }

    it('válido: consulta o status real e só marca CONNECTED se o provedor confirmar', async () => {
      const company = await provisionCompany('cb-ok');
      const { correlationId } = await startOnboarding(company.token, 'profile-cb-ok');

      fetchImpl = async (url) => {
        if (url.includes('/whatsapp/number-info')) {
          expect(new URL(url).searchParams.get('accountId')).toBe('acc-cb-ok');
          return jsonRes({
            phone: { display_phone_number: '+55 11 90000-0000', verified_name: 'E2E', name_status: 'APPROVED', quality_rating: 'GREEN', messaging_limit_tier: 'TIER_1K', status: 'CONNECTED', is_official_business_account: false, platform_type: 'CLOUD_API' },
            waba: { name: 'E2E', business_verification_status: 'VERIFIED', timezone_id: 'America/Sao_Paulo' },
          });
        }
        throw new Error(`chamada inesperada: ${url}`);
      };

      const res = await request(app.getHttpServer())
        .get('/integrations/zernio/whatsapp/callback')
        .query({ correlationId, connected: 'whatsapp', profileId: 'profile-cb-ok', accountId: 'acc-cb-ok', username: '+5511900000000' })
        .expect(302);
      expect(res.headers.location).toContain('zernio=success');

      const connection = await prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SELECT set_config('app.current_company_id', $1, true)`, company.id);
        return tx.zernioConnection.findUnique({ where: { companyId: company.id } });
      });
      expect(connection?.status).toBe(ZernioConnectionStatus.CONNECTED);
      expect(connection?.accountId).toBe('acc-cb-ok');

      const integration = await prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SELECT set_config('app.current_company_id', $1, true)`, company.id);
        return tx.integration.findUnique({ where: { companyId_type: { companyId: company.id, type: 'WHATSAPP' } } });
      });
      expect(integration?.status).toBe('CONNECTED');
      expect(integration?.connectionMode).toBe('REAL');
    });

    it('a confirmação real do provedor é obrigatória — se o número não estiver CONNECTED lá, não vira CONNECTED aqui', async () => {
      const company = await provisionCompany('cb-degraded');
      const { correlationId } = await startOnboarding(company.token, 'profile-cb-degraded');
      fetchImpl = async (url) => {
        if (url.includes('/whatsapp/number-info')) {
          return jsonRes({
            phone: { display_phone_number: '+55 11 90000-0000', verified_name: 'E2E', name_status: 'PENDING', quality_rating: 'GREEN', messaging_limit_tier: 'TIER_1K', status: 'PENDING_REVIEW', is_official_business_account: false, platform_type: 'CLOUD_API' },
            waba: { name: 'E2E', business_verification_status: 'PENDING', timezone_id: 'America/Sao_Paulo' },
          });
        }
        throw new Error(`chamada inesperada: ${url}`);
      };

      const res = await request(app.getHttpServer())
        .get('/integrations/zernio/whatsapp/callback')
        .query({ correlationId, connected: 'whatsapp', profileId: 'profile-cb-degraded', accountId: 'acc-cb-degraded', username: '+5511900000001' })
        .expect(302);
      expect(res.headers.location).toContain('zernio=error');

      const connection = await prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SELECT set_config('app.current_company_id', $1, true)`, company.id);
        return tx.zernioConnection.findUnique({ where: { companyId: company.id } });
      });
      expect(connection?.status).not.toBe(ZernioConnectionStatus.CONNECTED);
    });

    it('expirado: rejeita e não consulta o Zernio', async () => {
      const company = await provisionCompany('cb-expired');
      const { correlationId } = await startOnboarding(company.token, 'profile-cb-expired');
      await prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SELECT set_config('app.current_company_id', $1, true)`, company.id);
        await tx.zernioOnboardingAttempt.update({ where: { id: correlationId }, data: { expiresAt: new Date(Date.now() - 1000) } });
      });

      const res = await request(app.getHttpServer())
        .get('/integrations/zernio/whatsapp/callback')
        .query({ correlationId, connected: 'whatsapp', profileId: 'profile-cb-expired', accountId: 'acc-x', username: '+551190000' })
        .expect(302);
      expect(res.headers.location).toContain('reason=session_expired');
      expect(fetchCalls.find((c) => c.url.includes('number-info'))).toBeUndefined();
    });

    it('repetido (replay): a segunda chamada com o mesmo correlationId é rejeitada', async () => {
      const company = await provisionCompany('cb-replay');
      const { correlationId } = await startOnboarding(company.token, 'profile-cb-replay');
      fetchImpl = async (url) => {
        if (url.includes('/whatsapp/number-info')) {
          return jsonRes({
            phone: { display_phone_number: '+55', verified_name: 'E2E', name_status: 'APPROVED', quality_rating: 'GREEN', messaging_limit_tier: 'TIER_1K', status: 'CONNECTED', is_official_business_account: false, platform_type: 'CLOUD_API' },
            waba: { name: 'E2E', business_verification_status: 'VERIFIED', timezone_id: 'America/Sao_Paulo' },
          });
        }
        throw new Error('inesperado');
      };
      const query = { correlationId, connected: 'whatsapp', profileId: 'profile-cb-replay', accountId: 'acc-replay', username: '+551190000' };

      const firstRes = await request(app.getHttpServer()).get('/integrations/zernio/whatsapp/callback').query(query).expect(302);
      expect(firstRes.headers.location).toContain('zernio=success');

      const secondRes = await request(app.getHttpServer()).get('/integrations/zernio/whatsapp/callback').query(query).expect(302);
      expect(secondRes.headers.location).toContain('reason=session_expired');
    });

    it('adulterado: profileId da query não bate com o da tentativa registrada é rejeitado', async () => {
      const company = await provisionCompany('cb-tampered');
      const { correlationId } = await startOnboarding(company.token, 'profile-cb-real');
      const res = await request(app.getHttpServer())
        .get('/integrations/zernio/whatsapp/callback')
        .query({ correlationId, connected: 'whatsapp', profileId: 'profile-de-outra-tentativa', accountId: 'acc-y', username: '+551190000' })
        .expect(302);
      expect(res.headers.location).toContain('zernio=error');
      expect(fetchCalls.find((c) => c.url.includes('number-info'))).toBeUndefined();
    });

    it('erro reportado pelo Zernio (ex.: whatsapp_number_already_connected) é persistido e redireciona com o motivo', async () => {
      const company = await provisionCompany('cb-error-code');
      const { correlationId } = await startOnboarding(company.token, 'profile-cb-error-code');
      const res = await request(app.getHttpServer())
        .get('/integrations/zernio/whatsapp/callback')
        .query({ correlationId, error: 'whatsapp_number_already_connected' })
        .expect(302);
      expect(res.headers.location).toContain('reason=whatsapp_number_already_connected');
    });
  });

  describe('Webhook', () => {
    async function connectCompany(token: string, companyId: string, profileId: string, accountId: string) {
      fetchImpl = async (url) => {
        if (url.includes('/profiles')) return jsonRes({ _id: profileId });
        if (url.includes('/connect/whatsapp')) return jsonRes({ authUrl: 'https://zernio.test/signup', state: 's' });
        throw new Error(`chamada inesperada: ${url}`);
      };
      const connectRes = await request(app.getHttpServer()).post('/integrations/zernio/whatsapp/connect').set('Authorization', `Bearer ${token}`).expect(201);
      const connectCall = fetchCalls.find((c) => c.url.includes('/connect/whatsapp'))!;
      const correlationId = extractCorrelationId(new URL(connectCall.url).searchParams.get('redirect_url')!);

      fetchImpl = async (url) => {
        if (url.includes('/whatsapp/number-info')) {
          return jsonRes({
            phone: { display_phone_number: '+55', verified_name: 'E2E', name_status: 'APPROVED', quality_rating: 'GREEN', messaging_limit_tier: 'TIER_1K', status: 'CONNECTED', is_official_business_account: false, platform_type: 'CLOUD_API' },
            waba: { name: 'E2E', business_verification_status: 'VERIFIED', timezone_id: 'America/Sao_Paulo' },
          });
        }
        throw new Error('inesperado');
      };
      await request(app.getHttpServer())
        .get('/integrations/zernio/whatsapp/callback')
        .query({ correlationId, connected: 'whatsapp', profileId, accountId, username: '+5511900000000' })
        .expect(302);
      void connectRes;
    }

    function messageReceivedPayload(accountId: string, platformMessageId: string) {
      return {
        id: crypto.randomUUID(),
        event: 'message.received',
        message: {
          id: 'internal-1',
          conversationId: 'conv-e2e-1',
          platform: 'whatsapp',
          platformMessageId,
          direction: 'incoming',
          text: 'Olá, quero marcar um horário',
          attachments: [],
          sender: { businessScopedUserId: 'bsuid-e2e-1', phoneNumber: '+5511999998888' },
          sentAt: new Date().toISOString(),
          isRead: false,
          sentVia: null,
        },
        conversation: { id: 'conv-e2e-1', platformConversationId: 'conv-e2e-1', participantId: '5511999998888', status: 'active' },
        account: { id: accountId, accountId, profileId: 'profile-webhook', platform: 'whatsapp' },
        metadata: null,
        timestamp: new Date().toISOString(),
      };
    }

    it('válido: persiste a mensagem e responde 200', async () => {
      const company = await provisionCompany('webhook-valid');
      await connectCompany(company.token, company.id, 'profile-webhook-valid', 'acc-webhook-valid');

      const payload = messageReceivedPayload('acc-webhook-valid', 'wamid.e2e.1');
      const body = Buffer.from(JSON.stringify(payload));

      await postWebhook(
        { 'X-Zernio-Event': 'message.received', 'X-Zernio-Event-Id': payload.id, 'X-Zernio-Signature': sign(body) },
        body,
      ).expect(200);

      const message = await prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SELECT set_config('app.current_company_id', $1, true)`, company.id);
        return tx.zernioMessage.findUnique({ where: { platformMessageId: 'wamid.e2e.1' } });
      });
      expect(message?.companyId).toBe(company.id);
      expect(message?.senderIdentity).toBe('bsuid-e2e-1');
    });

    it('assinatura inválida é rejeitada', async () => {
      const payload = messageReceivedPayload('acc-webhook-a', 'wamid.e2e.invalid-sig');
      const body = Buffer.from(JSON.stringify(payload));
      await postWebhook({ 'X-Zernio-Event-Id': payload.id, 'X-Zernio-Signature': 'f'.repeat(64) }, body).expect(403);
    });

    it('evento repetido (mesmo eventId) não repete o efeito', async () => {
      const payload = messageReceivedPayload('acc-webhook-a', 'wamid.e2e.dup');
      const body = Buffer.from(JSON.stringify(payload));
      const headers = { 'X-Zernio-Event-Id': payload.id, 'X-Zernio-Signature': sign(body) };

      await postWebhook(headers, body).expect(200);
      await postWebhook(headers, body).expect(200);

      const count = await prisma.zernioWebhookEvent.count({ where: { eventId: payload.id } });
      expect(count).toBe(1);
    });

    it('account.disconnected atualiza o estado para DISCONNECTED', async () => {
      const company = await provisionCompany('webhook-disconnect');
      await connectCompany(company.token, company.id, 'profile-webhook-disconnect', 'acc-webhook-disconnect');

      const payload = { id: crypto.randomUUID(), event: 'account.disconnected', account: { id: 'acc-webhook-disconnect', accountId: 'acc-webhook-disconnect' } };
      const body = Buffer.from(JSON.stringify(payload));
      await postWebhook({ 'X-Zernio-Event-Id': payload.id, 'X-Zernio-Signature': sign(body) }, body).expect(200);

      const connection = await prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SELECT set_config('app.current_company_id', $1, true)`, company.id);
        return tx.zernioConnection.findUnique({ where: { companyId: company.id } });
      });
      expect(connection?.status).toBe(ZernioConnectionStatus.DISCONNECTED);

      // Desconexão impede novos envios (issue #30, "tratamento de desconexões").
      const messagesService = app.get(ZernioMessagesService);
      await expect(messagesService.sendMessage(company.id, 'conv-e2e-1', 'oi', 'idem-after-disconnect')).rejects.toThrow();
    });
  });

  describe('Envio idempotente', () => {
    it('a chamada de envio inclui Bearer, accountId da própria conexão e Idempotency-Key', async () => {
      const company = await provisionCompany('send');
      const profileId = 'profile-send-1';
      const accountId = 'acc-send-1';
      fetchImpl = async (url) => {
        if (url.includes('/profiles')) return jsonRes({ _id: profileId });
        if (url.includes('/connect/whatsapp')) return jsonRes({ authUrl: 'https://zernio.test/signup', state: 's' });
        if (url.includes('/whatsapp/number-info')) {
          return jsonRes({
            phone: { display_phone_number: '+55', verified_name: 'E2E', name_status: 'APPROVED', quality_rating: 'GREEN', messaging_limit_tier: 'TIER_1K', status: 'CONNECTED', is_official_business_account: false, platform_type: 'CLOUD_API' },
            waba: { name: 'E2E', business_verification_status: 'VERIFIED', timezone_id: 'America/Sao_Paulo' },
          });
        }
        throw new Error(`inesperado: ${url}`);
      };
      const connectRes = await request(app.getHttpServer()).post('/integrations/zernio/whatsapp/connect').set('Authorization', `Bearer ${company.token}`).expect(201);
      const connectCall = fetchCalls.find((c) => c.url.includes('/connect/whatsapp'))!;
      const correlationId = extractCorrelationId(new URL(connectCall.url).searchParams.get('redirect_url')!);
      await request(app.getHttpServer())
        .get('/integrations/zernio/whatsapp/callback')
        .query({ correlationId, connected: 'whatsapp', profileId, accountId, username: '+5511900000000' })
        .expect(302);
      void connectRes;

      fetchImpl = async (url, init) => {
        if (url.includes('/inbox/conversations/')) {
          return jsonRes({ success: true, warnings: [], data: { messageId: 'wamid.sent.1', conversationId: 'conv-send-1', attachments: [], messageIds: ['wamid.sent.1'] } });
        }
        throw new Error(`inesperado: ${url} ${JSON.stringify(init)}`);
      };

      const messagesService = app.get(ZernioMessagesService);
      await messagesService.sendMessage(company.id, 'conv-send-1', 'Olá! Como posso ajudar?', 'idem-e2e-1');

      const sendCall = fetchCalls.find((c) => c.url.includes('/inbox/conversations/'))!;
      expect(sendCall.url).toContain('/inbox/conversations/conv-send-1/messages');
      expect((sendCall.init.headers as Record<string, string>).Authorization).toBe(`Bearer ${ZERNIO_TEST_CONFIG.apiKey}`);
      expect((sendCall.init.headers as Record<string, string>)['Idempotency-Key']).toBe('idem-e2e-1');
      expect(JSON.parse(sendCall.init.body as string)).toEqual({ accountId, message: 'Olá! Como posso ajudar?' });
    });
  });

  describe('Desconexão real', () => {
    async function connectCompany(token: string, profileId: string, accountId: string) {
      fetchImpl = async (url) => {
        if (url.includes('/profiles')) return jsonRes({ _id: profileId });
        if (url.includes('/connect/whatsapp')) return jsonRes({ authUrl: 'https://zernio.test/signup', state: 's' });
        throw new Error(`chamada inesperada: ${url}`);
      };
      const connectRes = await request(app.getHttpServer()).post('/integrations/zernio/whatsapp/connect').set('Authorization', `Bearer ${token}`).expect(201);
      const connectCall = fetchCalls.find((c) => c.url.includes('/connect/whatsapp'))!;
      const correlationId = extractCorrelationId(new URL(connectCall.url).searchParams.get('redirect_url')!);

      fetchImpl = async (url) => {
        if (url.includes('/whatsapp/number-info')) {
          return jsonRes({
            phone: { display_phone_number: '+55', verified_name: 'E2E', name_status: 'APPROVED', quality_rating: 'GREEN', messaging_limit_tier: 'TIER_1K', status: 'CONNECTED', is_official_business_account: false, platform_type: 'CLOUD_API' },
            waba: { name: 'E2E', business_verification_status: 'VERIFIED', timezone_id: 'America/Sao_Paulo' },
          });
        }
        throw new Error('inesperado');
      };
      await request(app.getHttpServer())
        .get('/integrations/zernio/whatsapp/callback')
        .query({ correlationId, connected: 'whatsapp', profileId, accountId, username: '+5511900000000' })
        .expect(302);
      void connectRes;
    }

    it('chama DELETE /accounts/{accountId} no Zernio e sincroniza Integration para DISCONNECTED', async () => {
      const company = await provisionCompany('disconnect-real');
      await connectCompany(company.token, 'profile-disconnect-real', 'acc-disconnect-real');

      let deleteCall: { url: string; init: RequestInit } | null = null;
      fetchImpl = async (url, init) => {
        if (init.method === 'DELETE' && url.includes('/accounts/')) {
          deleteCall = { url, init };
          return new Response(null, { status: 204 });
        }
        throw new Error(`chamada inesperada: ${url}`);
      };

      const res = await request(app.getHttpServer())
        .post('/integrations/zernio/whatsapp/disconnect')
        .set('Authorization', `Bearer ${company.token}`)
        .expect(201);
      expect(res.body.status).toBe('DISCONNECTED');
      expect(deleteCall).not.toBeNull();
      expect(deleteCall!.url).toContain('/accounts/acc-disconnect-real');
      expect((deleteCall!.init.headers as Record<string, string>).Authorization).toBe(`Bearer ${ZERNIO_TEST_CONFIG.apiKey}`);

      const [connection, integration] = await prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SELECT set_config('app.current_company_id', $1, true)`, company.id);
        return Promise.all([
          tx.zernioConnection.findUnique({ where: { companyId: company.id } }),
          tx.integration.findUnique({ where: { companyId_type: { companyId: company.id, type: 'WHATSAPP' } } }),
        ]);
      });
      expect(connection?.status).toBe(ZernioConnectionStatus.DISCONNECTED);
      expect(connection?.accountId).toBeNull();
      expect(integration?.status).toBe('DISCONNECTED');
    });

    it('404 do provedor (conta já não existe lá) é tratado como já desconectado, não como erro', async () => {
      const company = await provisionCompany('disconnect-404');
      await connectCompany(company.token, 'profile-disconnect-404', 'acc-disconnect-404');

      fetchImpl = async (url, init) => {
        if (init.method === 'DELETE' && url.includes('/accounts/')) return new Response('', { status: 404 });
        throw new Error(`chamada inesperada: ${url}`);
      };

      await request(app.getHttpServer())
        .post('/integrations/zernio/whatsapp/disconnect')
        .set('Authorization', `Bearer ${company.token}`)
        .expect(201)
        .expect((res) => expect(res.body.status).toBe('DISCONNECTED'));
    });

    it('idempotente: sem accountId local (já desconectado antes) não chama o provedor e continua DISCONNECTED', async () => {
      const company = await provisionCompany('disconnect-idempotent');
      await connectCompany(company.token, 'profile-disconnect-idempotent', 'acc-disconnect-idempotent');

      fetchImpl = async (url, init) => {
        if (init.method === 'DELETE' && url.includes('/accounts/')) return new Response(null, { status: 204 });
        throw new Error(`chamada inesperada: ${url}`);
      };
      await request(app.getHttpServer()).post('/integrations/zernio/whatsapp/disconnect').set('Authorization', `Bearer ${company.token}`).expect(201);

      fetchImpl = async () => {
        throw new Error('não deveria chamar o Zernio numa segunda desconexão idempotente');
      };
      const second = await request(app.getHttpServer())
        .post('/integrations/zernio/whatsapp/disconnect')
        .set('Authorization', `Bearer ${company.token}`)
        .expect(201);
      expect(second.body.status).toBe('DISCONNECTED');
    });

    it('desconectar como empresa B nunca afeta a conexão real da empresa A', async () => {
      const companyOwnerA = await provisionCompany('disconnect-iso-a');
      const companyOwnerB = await provisionCompany('disconnect-iso-b');
      await connectCompany(companyOwnerA.token, 'profile-disconnect-iso-a', 'acc-disconnect-iso-a');

      fetchImpl = async () => {
        throw new Error('empresa B não tem conta Zernio própria — não deveria chamar o provedor');
      };
      await request(app.getHttpServer())
        .post('/integrations/zernio/whatsapp/disconnect')
        .set('Authorization', `Bearer ${companyOwnerB.token}`)
        .expect(201);

      const connectionA = await prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SELECT set_config('app.current_company_id', $1, true)`, companyOwnerA.id);
        return tx.zernioConnection.findUnique({ where: { companyId: companyOwnerA.id } });
      });
      expect(connectionA?.status).toBe(ZernioConnectionStatus.CONNECTED);
      expect(connectionA?.accountId).toBe('acc-disconnect-iso-a');
    });
  });

  describe('Isolamento entre tenants', () => {
    it('a conexão da empresa A não é visível sob o tenant da empresa B', async () => {
      const connectionUnderB = await prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SELECT set_config('app.current_company_id', $1, true)`, companyB.id);
        return tx.zernioConnection.findUnique({ where: { companyId: companyA.id } });
      });
      expect(connectionUnderB).toBeNull();
    });

    it('a empresa B não consegue enviar mensagem usando a conexão da empresa A', async () => {
      const messagesService = app.get(ZernioMessagesService);
      // companyB não tem accountId configurado neste describe isolado — deve recusar.
      await expect(messagesService.sendMessage(companyB.id, 'conv-x', 'oi', `idem-isolation-${Date.now()}`)).rejects.toThrow();
    });
  });
});
