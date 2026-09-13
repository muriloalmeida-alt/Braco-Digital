import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * Sprint 02 — Track A (US07-US17). Contra banco real, mesmo espírito de
 * `tenant-isolation.e2e-spec.ts` (Sprint 01): RLS de verdade, não mock.
 */
describe('Preparation — Manual de Trabalho (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;

  const companyA = { id: 'e2e10000-0000-0000-0000-00000000000a', name: 'E2E Prep Empresa A' };
  const companyB = { id: 'e2e10000-0000-0000-0000-00000000000b', name: 'E2E Prep Empresa B' };
  const ownerAEmail = 'e2e-prep-owner-a@test.local';
  const viewerAEmail = 'e2e-prep-viewer-a@test.local';
  const ownerBEmail = 'e2e-prep-owner-b@test.local';
  const plainPassword = 'senha-teste-123';

  let ownerAId: string;
  let viewerAId: string;
  let ownerBId: string;
  let atendimentoTypeId: string;
  let employeeId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = new PrismaClient();
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    await prisma.company.createMany({ data: [companyA, companyB], skipDuplicates: true });

    const ownerA = await prisma.user.upsert({
      where: { email: ownerAEmail },
      update: { passwordHash },
      create: { email: ownerAEmail, name: 'Owner Prep A', passwordHash },
    });
    ownerAId = ownerA.id;

    const viewerA = await prisma.user.upsert({
      where: { email: viewerAEmail },
      update: { passwordHash },
      create: { email: viewerAEmail, name: 'Viewer Prep A', passwordHash },
    });
    viewerAId = viewerA.id;

    const ownerB = await prisma.user.upsert({
      where: { email: ownerBEmail },
      update: { passwordHash },
      create: { email: ownerBEmail, name: 'Owner Prep B', passwordHash },
    });
    ownerBId = ownerB.id;

    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SELECT set_config('app.current_company_id', $1, true)`, companyA.id);
      await tx.companyMembership.upsert({
        where: { companyId_userId: { companyId: companyA.id, userId: ownerAId } },
        update: { role: 'OWNER' },
        create: { companyId: companyA.id, userId: ownerAId, role: 'OWNER' },
      });
      await tx.companyMembership.upsert({
        where: { companyId_userId: { companyId: companyA.id, userId: viewerAId } },
        update: { role: 'VIEWER' },
        create: { companyId: companyA.id, userId: viewerAId, role: 'VIEWER' },
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

    const atendimento = await prisma.employeeType.findUniqueOrThrow({ where: { key: 'atendimento' } });
    atendimentoTypeId = atendimento.id;
  });

  afterAll(async () => {
    await prisma.company.deleteMany({ where: { id: { in: [companyA.id, companyB.id] } } });
    await prisma.user.deleteMany({ where: { id: { in: [ownerAId, viewerAId, ownerBId] } } });
    await prisma.$disconnect();
    await app.close();
  });

  async function login(email: string) {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: plainPassword })
      .expect(200);
    return res.body.accessToken as string;
  }

  let tokenA: string;
  let tokenB: string;
  let tokenViewer: string;

  beforeAll(async () => {
    tokenA = await login(ownerAEmail);
    tokenB = await login(ownerBEmail);
    tokenViewer = await login(viewerAEmail);

    const hire = await request(app.getHttpServer())
      .post('/digital-employees')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ employeeTypeId: atendimentoTypeId })
      .expect(201);
    employeeId = hire.body.id;

    await request(app.getHttpServer())
      .post(`/digital-employees/${employeeId}/work-manual`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);
  });

  it('overview começa em 0 de 8, revisão bloqueada', async () => {
    const res = await request(app.getHttpServer())
      .get(`/digital-employees/${employeeId}/work-manual/overview`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);
    expect(res.body.completedCount).toBe(0);
    expect(res.body.review).toBe('bloqueada');
  });

  it('US15 — Concluir preparação falha (409) com manual incompleto', async () => {
    const res = await request(app.getHttpServer())
      .post(`/digital-employees/${employeeId}/work-manual/complete`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(409);
    expect(res.body.pendingSteps).toContain('empresa');
  });

  it('completa as 8 etapas e conclui a preparação (PREPARANDO → PRONTO)', async () => {
    // US07
    await request(app.getHttpServer())
      .patch('/companies/current/profile')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        attendanceName: 'Clínica Teste',
        about: 'Descrição',
        serviceMode: 'AMBOS',
        address: 'Rua Teste, 1',
        businessHours: [{ day: 'seg-sex', from: '08:00', to: '18:00' }],
      })
      .expect(200);

    // US08
    await request(app.getHttpServer())
      .post('/companies/current/products')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'Consulta', kind: 'SERVICO', clientDescription: 'x', pricingMode: 'SOB_CONSULTA' })
      .expect(201);

    // US09
    await request(app.getHttpServer())
      .patch(`/digital-employees/${employeeId}/responsibilities`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ responsibilities: [{ key: 'agendar', enabled: true }] })
      .expect(200);

    // US10
    await request(app.getHttpServer())
      .patch(`/digital-employees/${employeeId}/rules/acknowledgement`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ acknowledgedNoAdditional: true })
      .expect(200);

    // US11
    await request(app.getHttpServer())
      .patch(`/digital-employees/${employeeId}/autonomy`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        choices: [
          { responsibilityKey: 'receber_clientes', level: 'PODE_DECIDIR' },
          { responsibilityKey: 'identificar_necessidade', level: 'PODE_DECIDIR' },
          { responsibilityKey: 'encaminhar_humano', level: 'PODE_DECIDIR' },
          { responsibilityKey: 'agendar', level: 'PODE_DECIDIR' },
        ],
      })
      .expect(200);

    // US12
    const responsibles = await request(app.getHttpServer())
      .get(`/digital-employees/${employeeId}/responsibles`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/digital-employees/${employeeId}/responsibles`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ principalUserId: responsibles.body.eligibleUsers[0].userId })
      .expect(200);

    // US13
    await request(app.getHttpServer())
      .patch(`/digital-employees/${employeeId}/communication-style`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ tone: 'FORMAL', addressing: 'SENHOR_SENHORA', length: 'CURTAS_OBJETIVAS', emojis: 'NAO_USAR' })
      .expect(200);

    // US14 — WhatsApp (sempre obrigatório) + Calendar (agendar habilitado)
    await request(app.getHttpServer())
      .post(`/digital-employees/${employeeId}/resources/WHATSAPP/connect`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(201);
    await request(app.getHttpServer())
      .post(`/digital-employees/${employeeId}/resources/WHATSAPP/confirm`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ externalAccountRef: '+5511999990000' })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/digital-employees/${employeeId}/resources/GOOGLE_CALENDAR/confirm`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ externalAccountRef: 'agenda@teste.demo' })
      .expect(201);

    const overview = await request(app.getHttpServer())
      .get(`/digital-employees/${employeeId}/work-manual/overview`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);
    expect(overview.body.completedCount).toBe(8);
    expect(overview.body.review).toBe('disponivel');

    const complete = await request(app.getHttpServer())
      .post(`/digital-employees/${employeeId}/work-manual/complete`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(201);
    expect(complete.body.employeeStatus).toBe('PRONTO');
    expect(complete.body.review).toBe('concluida');

    const employee = await request(app.getHttpServer())
      .get(`/digital-employees/${employeeId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);
    expect(employee.body.status).toBe('PRONTO');
  });

  it('invalidar recurso obrigatório rebaixa PRONTO → PREPARANDO automaticamente', async () => {
    await request(app.getHttpServer())
      .post(`/digital-employees/${employeeId}/resources/WHATSAPP/disconnect`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(201);

    const employee = await request(app.getHttpServer())
      .get(`/digital-employees/${employeeId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);
    expect(employee.body.status).toBe('PREPARANDO');

    const overview = await request(app.getHttpServer())
      .get(`/digital-employees/${employeeId}/work-manual/overview`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);
    expect(overview.body.review).toBe('bloqueada');
    expect(overview.body.pendingSteps).toContain('recursos_trabalho');

    // Reconecta para não vazar estado para os testes seguintes.
    await request(app.getHttpServer())
      .post(`/digital-employees/${employeeId}/resources/WHATSAPP/confirm`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ externalAccountRef: '+5511999990000' })
      .expect(201);
  });

  it('PD7/TD14 — backend rejeita autonomia acima do teto e 🟡 sem condição', async () => {
    const aboveCeiling = await request(app.getHttpServer())
      .patch(`/digital-employees/${employeeId}/autonomy`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ choices: [{ responsibilityKey: 'reagendar', level: 'PODE_DECIDIR' }] })
      .expect(400);
    expect(aboveCeiling.body.message).toMatch(/não está disponível/);

    const missingCondition = await request(app.getHttpServer())
      .patch(`/digital-employees/${employeeId}/autonomy`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ choices: [{ responsibilityKey: 'reagendar', level: 'PODE_DECIDIR_SOB_REGRAS' }] })
      .expect(400);
    expect(missingCondition.body.message).toMatch(/condição/);

    await request(app.getHttpServer())
      .patch(`/digital-employees/${employeeId}/autonomy`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        choices: [
          { responsibilityKey: 'reagendar', level: 'PODE_DECIDIR_SOB_REGRAS', condition: 'só com 2h de antecedência' },
        ],
      })
      .expect(200);
  });

  it('US08 — regras de preço: Sob consulta não aceita valor; agendável exige duração', async () => {
    await request(app.getHttpServer())
      .post('/companies/current/products')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'X', kind: 'SERVICO', clientDescription: 'x', pricingMode: 'SOB_CONSULTA', price: 10 })
      .expect(400);

    await request(app.getHttpServer())
      .post('/companies/current/products')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'Y', kind: 'SERVICO', clientDescription: 'x', pricingMode: 'FIXO', price: 10, schedulable: true })
      .expect(400);
  });

  it('RBAC — VIEWER não edita etapas, mas lê', async () => {
    await request(app.getHttpServer())
      .patch('/companies/current/profile')
      .set('Authorization', `Bearer ${tokenViewer}`)
      .send({ attendanceName: 'Hack' })
      .expect(403);

    await request(app.getHttpServer())
      .get(`/digital-employees/${employeeId}/work-manual/overview`)
      .set('Authorization', `Bearer ${tokenViewer}`)
      .expect(200);
  });

  it('RLS — Empresa B não lê/edita produtos, responsabilidades nem overview da Empresa A', async () => {
    await request(app.getHttpServer())
      .get('/companies/current/products')
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(200)
      .then((res) => expect(res.body).toEqual([]));

    await request(app.getHttpServer())
      .get(`/digital-employees/${employeeId}/work-manual/overview`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(404);

    await request(app.getHttpServer())
      .get(`/digital-employees/${employeeId}/responsibilities`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(404);

    // Prova direta em nível de banco (não só de endpoint): com o tenant
    // da Empresa B ativo, uma leitura crua de employee_responsibilities
    // pelo id do funcionário da Empresa A retorna vazio — RLS, não só
    // filtro de aplicação.
    const rows = await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SELECT set_config('app.current_company_id', $1, true)`, companyB.id);
      return tx.employeeResponsibility.findMany({ where: { digitalEmployeeId: employeeId } });
    });
    expect(rows).toEqual([]);
  });
});
