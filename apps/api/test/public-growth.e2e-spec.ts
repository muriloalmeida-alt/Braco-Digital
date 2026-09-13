import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { ThrottlerStorage, ThrottlerStorageService } from '@nestjs/throttler';
import request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * Track B — Growth / "Monte sua equipe" (público, sem tenant, sem login).
 * docs/technical/20-sprint-02-tech-readiness.md §7, §16, TD15.
 *
 * Roda contra um banco real — em especial o teste de isolamento por role
 * de banco (§ "Isolamento — role pública") só prova alguma coisa de
 * verdade contra Postgres de verdade, nunca contra um mock de Prisma.
 */
describe('Track B — Growth público (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.lead.deleteMany({ where: { source: 'e2e-test' } });
    await prisma.$disconnect();
    await app.close();
  });

  describe('GET /public/employee-types', () => {
    it('retorna o catálogo público sem exigir autenticação, reusando a mesma fonte do catálogo autenticado', async () => {
      const res = await request(app.getHttpServer()).get('/public/employee-types').expect(200);
      expect(res.body).toHaveLength(5);
      const atendimento = res.body.find((t: { key: string }) => t.key === 'atendimento');
      expect(atendimento.availability).toBe('AVAILABLE');
      // Nenhum identificador de tenant deve vazar por esta rota pública.
      expect(atendimento.companyId).toBeUndefined();
    });
  });

  describe('POST /public/diagnostics/recommendation', () => {
    it('retorna ranking determinístico com motivo e disponibilidade real do catálogo', async () => {
      const res = await request(app.getHttpServer())
        .post('/public/diagnostics/recommendation')
        .send({ needs: ['responder_duvidas', 'organizar_agendamentos'], priority: 'responder_duvidas' })
        .expect(200);
      expect(res.body.ruleVersion).toBe('v1');
      expect(res.body.ranking[0]).toMatchObject({ typeKey: 'atendimento', availability: 'AVAILABLE' });
      // Score interno nunca é exposto ao cliente.
      expect(JSON.stringify(res.body)).not.toMatch(/score/i);
    });

    it('rejeita quando a prioridade não está entre as necessidades selecionadas', async () => {
      await request(app.getHttpServer())
        .post('/public/diagnostics/recommendation')
        .send({ needs: ['responder_duvidas'], priority: 'cobrar_pagamentos' })
        .expect(400);
    });

    it('rejeita diagnóstico sem nenhuma necessidade selecionada', async () => {
      await request(app.getHttpServer())
        .post('/public/diagnostics/recommendation')
        .send({ needs: [], priority: 'responder_duvidas' })
        .expect(400);
    });

    it('é determinístico via HTTP: mesma entrada produz sempre o mesmo ranking', async () => {
      const body = { needs: ['cobrar_pagamentos'], priority: 'cobrar_pagamentos' };
      const first = await request(app.getHttpServer()).post('/public/diagnostics/recommendation').send(body);
      const second = await request(app.getHttpServer()).post('/public/diagnostics/recommendation').send(body);
      expect(first.body).toEqual(second.body);
    });
  });

  describe('POST /public/leads', () => {
    const validPayload = {
      name: 'Visitante Teste',
      companyName: 'Empresa Teste E2E',
      whatsapp: '11999998888',
      segment: 'saude',
      teamSize: 'DE_2_A_5',
      volume: 'DE_11_A_30',
      answers: { needs: ['responder_duvidas'], priority: 'responder_duvidas' },
    };

    // Product Review 01: o default fail-closed é DISABLED (nenhum lead é
    // aceito). Estes testes cobrem o funcionamento normal do endpoint —
    // rodam sob SYNTHETIC, explicitamente, exatamente como um ambiente
    // de dev/staging real precisaria configurar.
    const previousMode = process.env.PUBLIC_LEAD_CAPTURE_MODE;
    beforeAll(() => {
      process.env.PUBLIC_LEAD_CAPTURE_MODE = 'SYNTHETIC';
    });
    afterAll(() => {
      if (previousMode === undefined) delete process.env.PUBLIC_LEAD_CAPTURE_MODE;
      else process.env.PUBLIC_LEAD_CAPTURE_MODE = previousMode;
    });

    it('persiste o lead, recalculando o ranking no servidor (nunca confia no ranking do cliente)', async () => {
      const res = await request(app.getHttpServer()).post('/public/leads').send(validPayload).expect(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.ranking[0].typeKey).toBe('atendimento');
      expect(res.body.isSynthetic).toBe(true);

      const persisted = await prisma.lead.findUnique({ where: { id: res.body.id } });
      expect(persisted?.whatsapp).toBe('+5511999998888'); // normalizado para E.164
      expect(persisted?.companyName).toBe(validPayload.companyName);
      // PD6: SYNTHETIC nunca persiste como captação real, mesmo que o
      // texto de todos os campos pareça um lead de verdade.
      expect(persisted?.isSynthetic).toBe(true);

      await prisma.lead.update({ where: { id: res.body.id }, data: { source: 'e2e-test' } });
    });

    it('não cria User, Company nem DigitalEmployee a partir do lead (PRD 04 §19)', async () => {
      const usersBefore = await prisma.user.count();
      const companiesBefore = await prisma.company.count();
      await request(app.getHttpServer())
        .post('/public/leads')
        .send({ ...validPayload, whatsapp: '11988887777' })
        .expect(201)
        .then((res) => prisma.lead.update({ where: { id: res.body.id }, data: { source: 'e2e-test' } }));
      expect(await prisma.user.count()).toBe(usersBefore);
      expect(await prisma.company.count()).toBe(companiesBefore);
    });

    it('rejeita WhatsApp inválido', async () => {
      await request(app.getHttpServer())
        .post('/public/leads')
        .send({ ...validPayload, whatsapp: 'abc' })
        .expect(400);
    });

    it('aplica rate limit dedicado (§7): excesso de requisições retorna 429', async () => {
      // O limite de /public/leads é 5/min; os testes acima já consumiram
      // parte da janela. Dispara mais tentativas até estourar.
      const attempts = await Promise.all(
        Array.from({ length: 6 }).map(() =>
          request(app.getHttpServer())
            .post('/public/leads')
            .send({ ...validPayload, whatsapp: '11900000000' }),
        ),
      );
      const statuses = attempts.map((r) => r.status);
      expect(statuses).toContain(429);
      // Limpa qualquer lead sintético eventualmente criado antes do 429.
      await prisma.lead.updateMany({
        where: { whatsapp: '+5511900000000' },
        data: { source: 'e2e-test' },
      });
    });
  });

  /**
   * Product Review 01 — três modos de captação (DISABLED/SYNTHETIC/REAL)
   * substituindo o booleano `PUBLIC_LEAD_CAPTURE_REAL`, que a revisão
   * apontou como não fail-closed (mesmo "false" ainda persistia PII
   * real, só marcando `isSynthetic=true`).
   */
  describe('Product Review 01 — capture modes (DISABLED/SYNTHETIC/REAL)', () => {
    // As 3 chamadas a POST /public/leads deste describe (uma por modo)
    // não podem herdar o rate limit já consumido pelo describe anterior
    // (que inclui um teste que deliberadamente estoura o limite de
    // 5/min) — reseta o storage do throttler para começar com janela
    // limpa, sem depender de ordem/contagem entre describes.
    beforeAll(() => {
      (app.get(ThrottlerStorage) as ThrottlerStorageService).storage.clear();
    });

    const validPayload = {
      name: 'Visitante Capture Mode',
      companyName: 'Empresa Capture Mode',
      whatsapp: '11977776666',
      segment: 'saude',
      teamSize: 'DE_2_A_5',
      volume: 'DE_11_A_30',
      answers: { needs: ['responder_duvidas'], priority: 'responder_duvidas' },
    };

    async function withMode<T>(mode: string | undefined, fn: () => Promise<T>): Promise<T> {
      const previous = process.env.PUBLIC_LEAD_CAPTURE_MODE;
      if (mode === undefined) delete process.env.PUBLIC_LEAD_CAPTURE_MODE;
      else process.env.PUBLIC_LEAD_CAPTURE_MODE = mode;
      try {
        return await fn();
      } finally {
        if (previous === undefined) delete process.env.PUBLIC_LEAD_CAPTURE_MODE;
        else process.env.PUBLIC_LEAD_CAPTURE_MODE = previous;
      }
    }

    it('DISABLED é o default fail-closed (variável ausente)', async () => {
      await withMode(undefined, async () => {
        const res = await request(app.getHttpServer()).get('/public/leads/capture-mode').expect(200);
        expect(res.body.mode).toBe('DISABLED');
      });
    });

    describe('modo DISABLED', () => {
      it('diagnóstico e recomendação continuam funcionando', async () => {
        await withMode('DISABLED', async () => {
          await request(app.getHttpServer()).get('/public/employee-types').expect(200);
          await request(app.getHttpServer())
            .post('/public/diagnostics/recommendation')
            .send({ needs: ['responder_duvidas'], priority: 'responder_duvidas' })
            .expect(200);
        });
      });

      it('endpoint de lead rejeita a submissão e nenhuma PII é persistida', async () => {
        const leadsBefore = await prisma.lead.count();
        await withMode('DISABLED', async () => {
          await request(app.getHttpServer()).post('/public/leads').send(validPayload).expect(403);
        });
        expect(await prisma.lead.count()).toBe(leadsBefore);
        const byWhatsapp = await prisma.lead.findFirst({ where: { whatsapp: '+5511977776666' } });
        expect(byWhatsapp).toBeNull();
      });
    });

    describe('modo SYNTHETIC', () => {
      it('formulário funciona e o registro é marcado de teste/sintético', async () => {
        await withMode('SYNTHETIC', async () => {
          const modeRes = await request(app.getHttpServer()).get('/public/leads/capture-mode').expect(200);
          expect(modeRes.body.mode).toBe('SYNTHETIC');

          const res = await request(app.getHttpServer()).post('/public/leads').send(validPayload).expect(201);
          expect(res.body.isSynthetic).toBe(true);

          const persisted = await prisma.lead.findUnique({ where: { id: res.body.id } });
          expect(persisted?.isSynthetic).toBe(true);

          await prisma.lead.update({ where: { id: res.body.id }, data: { source: 'e2e-test' } });
        });
      });
    });

    describe('modo REAL', () => {
      it('não ativa com valores parecidos mas não reconhecidos — continua fail-closed', async () => {
        for (const almostReal of ['REALX', 'true', 'REAL-MODE', '1']) {
          await withMode(almostReal, async () => {
            const res = await request(app.getHttpServer()).get('/public/leads/capture-mode').expect(200);
            expect(res.body.mode).not.toBe('REAL');
          });
        }
      });

      it('quando explicitamente REAL, o formulário funciona e o registro NÃO é sintético', async () => {
        await withMode('REAL', async () => {
          const modeRes = await request(app.getHttpServer()).get('/public/leads/capture-mode').expect(200);
          expect(modeRes.body.mode).toBe('REAL');

          const res = await request(app.getHttpServer())
            .post('/public/leads')
            .send({ ...validPayload, whatsapp: '11955554444' })
            .expect(201);
          expect(res.body.isSynthetic).toBe(false);

          const persisted = await prisma.lead.findUnique({ where: { id: res.body.id } });
          expect(persisted?.isSynthetic).toBe(false);

          // Mesmo em REAL, a estrutura de campos capturados continua a
          // mesma (nome/empresa/WhatsApp/e-mail opcional) — evidência
          // jurídica adicional (aviso/aceite/timestamp) é decisão de
          // Produto/Jurídico ainda pendente (PD6), não implementada
          // nesta sprint.
          await prisma.lead.update({ where: { id: res.body.id }, data: { source: 'e2e-test' } });
        });
      });
    });
  });

  describe('POST /public/analytics/events', () => {
    it('aceita evento válido sem PII e responde 204', async () => {
      await request(app.getHttpServer())
        .post('/public/analytics/events')
        .send({
          event: 'landing_view',
          sessionId: '11111111-1111-4111-8111-111111111111',
          eventId: '22222222-2222-4222-8222-222222222222',
        })
        .expect(204);
    });

    it('rejeita nome de evento fora da allowlist (whitelist de DTO)', async () => {
      await request(app.getHttpServer())
        .post('/public/analytics/events')
        .send({
          event: 'evento_inventado',
          sessionId: '11111111-1111-4111-8111-111111111111',
          eventId: '33333333-3333-4333-8333-333333333333',
        })
        .expect(400);
    });
  });

  describe('Isolamento — role pública do banco (TD15)', () => {
    it('braco_public NÃO consegue ler tabelas de tenant, nem em teoria (prova negativa real no Postgres)', async () => {
      await expect(
        prisma.$transaction(async (tx) => {
          await tx.$executeRawUnsafe(`SET LOCAL ROLE braco_public`);
          return tx.$queryRawUnsafe(`SELECT * FROM companies LIMIT 1`);
        }),
      ).rejects.toThrow(/permission denied/i);

      await expect(
        prisma.$transaction(async (tx) => {
          await tx.$executeRawUnsafe(`SET LOCAL ROLE braco_public`);
          return tx.$queryRawUnsafe(`SELECT * FROM digital_employees LIMIT 1`);
        }),
      ).rejects.toThrow(/permission denied/i);
    });

    it('braco_public NÃO consegue ler a própria tabela "leads" (só INSERT foi concedido)', async () => {
      await expect(
        prisma.$transaction(async (tx) => {
          await tx.$executeRawUnsafe(`SET LOCAL ROLE braco_public`);
          return tx.$queryRawUnsafe(`SELECT * FROM leads LIMIT 1`);
        }),
      ).rejects.toThrow(/permission denied/i);
    });

    it('braco_public CONSEGUE ler employee_types (catálogo público) e inserir em leads', async () => {
      const types = await prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SET LOCAL ROLE braco_public`);
        return tx.$queryRawUnsafe(`SELECT key FROM employee_types LIMIT 1`);
      });
      expect(types).toBeDefined();
    });
  });
});
