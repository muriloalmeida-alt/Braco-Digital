/**
 * Seed de demonstração para a Sprint 01.
 *
 * Cobre o pré-requisito §0 de docs/technical/14-sprint-01-tech-readiness.md
 * (PD1 — onboarding manual): cria uma empresa e um usuário Owner
 * provisionados administrativamente, já que não há fluxo self-service
 * de criação de conta/empresa nesta fase.
 *
 * A empresa/usuário de teste vêm de variáveis de ambiente (com defaults
 * de desenvolvimento) — nunca de um script/comando ad-hoc rodado à mão.
 * `npm run seed` sozinho já funciona (defaults abaixo); para um valor
 * diferente, configure a variável no `.env` do ambiente (dev/staging/CI),
 * não passe um valor pontual por linha de comando. Ver `.env.example`.
 */
import { CatalogAvailability, PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SEED_COMPANY_ID = process.env.SEED_COMPANY_ID ?? '00000000-0000-0000-0000-000000000001';
const SEED_COMPANY_NAME = process.env.SEED_COMPANY_NAME ?? 'Clínica Vida (demo)';
const SEED_COMPANY_DOCUMENT = process.env.SEED_COMPANY_DOCUMENT ?? '00.000.000/0001-00';
const SEED_COMPANY_VERTICAL = process.env.SEED_COMPANY_VERTICAL ?? 'clinica';
const SEED_COMPANY_TIMEZONE = process.env.SEED_COMPANY_TIMEZONE ?? 'America/Sao_Paulo';
const SEED_OWNER_EMAIL = process.env.SEED_OWNER_EMAIL ?? 'owner@clinicavida.demo';
const SEED_OWNER_NAME = process.env.SEED_OWNER_NAME ?? 'Murilo (Owner demo)';
const SEED_OWNER_PASSWORD = process.env.SEED_OWNER_PASSWORD ?? 'braco123';

const EMPLOYEE_TYPES = [
  {
    key: 'atendimento',
    name: 'Braço Atendimento',
    role: 'Recepcionista Digital',
    mission:
      'Ser a porta de entrada da empresa, garantindo que todo cliente seja atendido, orientado e conduzido para o próximo passo.',
    expectedResult: 'Mais clientes atendidos, mais agendamentos e menos oportunidades perdidas.',
    responsibilities: [
      'Recebe clientes e responde dúvidas',
      'Apresenta produtos e serviços',
      'Agenda, confirma, reagenda e cancela',
    ],
    availability: CatalogAvailability.AVAILABLE,
    sortOrder: 1,
  },
  {
    key: 'vendas',
    name: 'Braço Vendas',
    role: 'Vendedor Digital',
    mission: 'Transformar interesse em oportunidade e oportunidade em venda.',
    expectedResult: 'Mais oportunidades convertidas em vendas.',
    responsibilities: [
      'Qualifica oportunidades',
      'Conduz a conversa comercial',
      'Faz acompanhamento',
    ],
    availability: CatalogAvailability.COMING_SOON,
    sortOrder: 2,
  },
  {
    key: 'orcamentos',
    name: 'Braço Orçamentos',
    role: 'Orçamentista Digital',
    mission: 'Transformar uma solicitação em orçamento e acompanhar a oportunidade.',
    expectedResult: 'Mais orçamentos enviados, acompanhados e aprovados.',
    responsibilities: [
      'Recebe solicitações de orçamento',
      'Monta e envia o orçamento',
      'Acompanha até a decisão do cliente',
    ],
    availability: CatalogAvailability.COMING_SOON,
    sortOrder: 3,
  },
  {
    key: 'pos-venda',
    name: 'Braço Pós-venda',
    role: 'Pós-venda Digital',
    mission: 'Garantir que o relacionamento continue depois da venda.',
    expectedResult: 'Mais retenção, recompra, avaliações e relacionamento.',
    responsibilities: [
      'Acompanha satisfação após a venda',
      'Estimula recompra',
      'Coleta avaliações',
    ],
    availability: CatalogAvailability.COMING_SOON,
    sortOrder: 4,
  },
  {
    key: 'financeiro',
    name: 'Braço Financeiro',
    role: 'Cobrador Digital',
    mission: 'Ajudar a empresa a receber no prazo e recuperar atrasos profissionalmente.',
    expectedResult: 'Mais pagamentos recebidos e menos inadimplência.',
    responsibilities: [
      'Envia lembretes de pagamento',
      'Negocia atrasos dentro das regras',
      'Registra o status de cobrança',
    ],
    availability: CatalogAvailability.COMING_SOON,
    sortOrder: 5,
  },
];

async function main() {
  for (const type of EMPLOYEE_TYPES) {
    await prisma.employeeType.upsert({
      where: { key: type.key },
      update: type,
      create: type,
    });
  }
  console.log(`Seed: ${EMPLOYEE_TYPES.length} EmployeeType(s) semeados.`);

  const company = await prisma.company.upsert({
    where: { id: SEED_COMPANY_ID },
    update: {},
    create: {
      id: SEED_COMPANY_ID,
      name: SEED_COMPANY_NAME,
      document: SEED_COMPANY_DOCUMENT,
      vertical: SEED_COMPANY_VERTICAL,
      timezone: SEED_COMPANY_TIMEZONE,
    },
  });

  const passwordHash = await bcrypt.hash(SEED_OWNER_PASSWORD, 10);
  const owner = await prisma.user.upsert({
    where: { email: SEED_OWNER_EMAIL },
    update: {},
    create: {
      email: SEED_OWNER_EMAIL,
      name: SEED_OWNER_NAME,
      passwordHash,
    },
  });

  // Grava CompanyMembership dentro do contexto de tenant (RLS exige
  // app.current_company_id setado até para o dono das tabelas — ver
  // migration enable_row_level_security).
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(
      `SELECT set_config('app.current_company_id', $1, true)`,
      company.id,
    );
    await tx.companyMembership.upsert({
      where: { companyId_userId: { companyId: company.id, userId: owner.id } },
      update: { role: 'OWNER' },
      create: { companyId: company.id, userId: owner.id, role: 'OWNER' },
    });
  });

  console.log(`Seed: empresa "${company.name}" (${company.id}) com Owner ${owner.email}.`);
  console.log(`Login de demonstração: ${owner.email} / ${SEED_OWNER_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
