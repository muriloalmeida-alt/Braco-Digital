import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * Testes de isolamento de tenant (R1 — docs/technical/15-technical-risks.md)
 * e de RBAC/idempotência/guardrail de disponibilidade (US03).
 *
 * Estes são os testes que a Technical Discovery pede como "primeiro
 * conjunto de testes automatizados do projeto, antes de qualquer feature
 * de negócio" (04-multi-tenancy.md §5). Rodam contra um banco real
 * (DATABASE_URL do ambiente) para exercitar de fato as policies de RLS —
 * um mock de Prisma não provaria nada aqui.
 */
describe('Tenant isolation & RBAC (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;

  const companyA = { id: 'e2e00000-0000-0000-0000-00000000000a', name: 'E2E Empresa A' };
  const companyB = { id: 'e2e00000-0000-0000-0000-00000000000b', name: 'E2E Empresa B' };

  const ownerAEmail = 'e2e-owner-a@test.local';
  const viewerAEmail = 'e2e-viewer-a@test.local';
  const ownerBEmail = 'e2e-owner-b@test.local';
  const plainPassword = 'senha-teste-123';

  let ownerAId: string;
  let viewerAId: string;
  let ownerBId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = new PrismaClient();

    const passwordHash = await bcrypt.hash(plainPassword, 10);

    await prisma.company.createMany({
      data: [companyA, companyB],
      skipDuplicates: true,
    });

    const ownerA = await prisma.user.upsert({
      where: { email: ownerAEmail },
      update: { passwordHash },
      create: { email: ownerAEmail, name: 'Owner A', passwordHash },
    });
    ownerAId = ownerA.id;

    const viewerA = await prisma.user.upsert({
      where: { email: viewerAEmail },
      update: { passwordHash },
      create: { email: viewerAEmail, name: 'Viewer A', passwordHash },
    });
    viewerAId = viewerA.id;

    const ownerB = await prisma.user.upsert({
      where: { email: ownerBEmail },
      update: { passwordHash },
      create: { email: ownerBEmail, name: 'Owner B', passwordHash },
    });
    ownerBId = ownerB.id;

    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(
        `SELECT set_config('app.current_company_id', $1, true)`,
        companyA.id,
      );
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
      await tx.$executeRawUnsafe(
        `SELECT set_config('app.current_company_id', $1, true)`,
        companyB.id,
      );
      await tx.companyMembership.upsert({
        where: { companyId_userId: { companyId: companyB.id, userId: ownerBId } },
        update: { role: 'OWNER' },
        create: { companyId: companyB.id, userId: ownerBId, role: 'OWNER' },
      });
    });
  });

  afterAll(async () => {
    // Cascade cuida de company_memberships/digital_employees/work_manuals/
    // idempotency_keys ao deletar a Company; usuários são globais e
    // precisam ser limpos à parte.
    await prisma.company.deleteMany({ where: { id: { in: [companyA.id, companyB.id] } } });
    await prisma.user.deleteMany({
      where: { id: { in: [ownerAId, viewerAId, ownerBId] } },
    });
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

  it('isola digital-employees entre empresas (R1)', async () => {
    const tokenA = await login(ownerAEmail);
    const tokenB = await login(ownerBEmail);

    const atendimento = await prisma.employeeType.findUniqueOrThrow({
      where: { key: 'atendimento' },
    });

    const hireRes = await request(app.getHttpServer())
      .post('/digital-employees')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ employeeTypeId: atendimento.id })
      .expect(201);

    const employeeId = hireRes.body.id as string;

    // Empresa B não vê nada na listagem.
    const listB = await request(app.getHttpServer())
      .get('/digital-employees')
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(200);
    expect(listB.body).toEqual([]);

    // Empresa B não consegue ler o funcionário da Empresa A por ID direto.
    await request(app.getHttpServer())
      .get(`/digital-employees/${employeeId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(404);

    // Empresa A continua vendo o próprio funcionário normalmente.
    const listA = await request(app.getHttpServer())
      .get('/digital-employees')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);
    expect(listA.body).toHaveLength(1);
    expect(listA.body[0].id).toBe(employeeId);
  });

  it('bloqueia contratação de funcionário "Em breve" (PD5 — salvaguarda de backend)', async () => {
    const tokenA = await login(ownerAEmail);
    const vendas = await prisma.employeeType.findUniqueOrThrow({ where: { key: 'vendas' } });

    const res = await request(app.getHttpServer())
      .post('/digital-employees')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ employeeTypeId: vendas.id })
      .expect(409);

    expect(res.body.message).toMatch(/não está disponível/);
  });

  it('é idempotente via Idempotency-Key (duplo clique não duplica)', async () => {
    const tokenA = await login(ownerAEmail);
    const atendimento = await prisma.employeeType.findUniqueOrThrow({
      where: { key: 'atendimento' },
    });
    const key = `e2e-idem-${Date.now()}`;

    const first = await request(app.getHttpServer())
      .post('/digital-employees')
      .set('Authorization', `Bearer ${tokenA}`)
      .set('Idempotency-Key', key)
      .send({ employeeTypeId: atendimento.id })
      .expect(201);

    const second = await request(app.getHttpServer())
      .post('/digital-employees')
      .set('Authorization', `Bearer ${tokenA}`)
      .set('Idempotency-Key', key)
      .send({ employeeTypeId: atendimento.id })
      .expect(201);

    expect(second.body.id).toBe(first.body.id);
  });

  it('nega contratação a um papel VIEWER (RBAC)', async () => {
    const tokenViewer = await login(viewerAEmail);
    const atendimento = await prisma.employeeType.findUniqueOrThrow({
      where: { key: 'atendimento' },
    });

    await request(app.getHttpServer())
      .post('/digital-employees')
      .set('Authorization', `Bearer ${tokenViewer}`)
      .send({ employeeTypeId: atendimento.id })
      .expect(403);

    // Mas leitura do catálogo continua permitida a qualquer papel.
    await request(app.getHttpServer())
      .get('/employee-types')
      .set('Authorization', `Bearer ${tokenViewer}`)
      .expect(200);
  });

  it('exige autenticação em todas as rotas de negócio', async () => {
    await request(app.getHttpServer()).get('/digital-employees').expect(401);
    await request(app.getHttpServer()).get('/employee-types').expect(401);
  });

  it('US06: inicia a preparação e a torna idempotente, sem preencher seções', async () => {
    const tokenA = await login(ownerAEmail);
    const list = await request(app.getHttpServer())
      .get('/digital-employees')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);
    const employeeId = list.body[0].id as string;

    const before = await request(app.getHttpServer())
      .get(`/digital-employees/${employeeId}/work-manual`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);
    expect(before.body.status).toBe('not_started');
    expect(before.body.sections).toHaveLength(9);

    const started = await request(app.getHttpServer())
      .post(`/digital-employees/${employeeId}/work-manual`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);
    expect(started.body.status).toBe('in_progress');

    const startedAgain = await request(app.getHttpServer())
      .post(`/digital-employees/${employeeId}/work-manual`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);
    expect(startedAgain.body.id).toBe(started.body.id);
  });
});
