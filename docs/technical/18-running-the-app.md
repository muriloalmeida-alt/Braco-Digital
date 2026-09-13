# BRAÇO — Rodando a aplicação (Sprint 01)

Implementação de código das 8 histórias da Sprint 01 (US01–US06, US53,
US54), conforme `docs/technical/14-sprint-01-tech-readiness.md`. Este
documento é operacional (setup local) — não substitui nem altera nenhuma
decisão de produto/arquitetura registrada nos demais documentos técnicos.

## 1. Estrutura

```text
apps/
  api/   — App Service (NestJS + Prisma + PostgreSQL)
  web/   — Frontend (React + Vite)
```

Monólito modular (`01-architecture.md`), sem Redis/filas/Runtime ainda —
não há trabalho assíncrono na Sprint 01 (isso entra a partir da Sprint 03,
WhatsApp/atendimento).

## 2. Pré-requisitos

- Node.js 20+
- PostgreSQL 14+ acessível localmente

## 3. Setup

```bash
npm install

# Banco de dados
createuser braco --pwprompt --createdb   # ou equivalente do seu ambiente
createdb -O braco braco_dev

cp apps/api/.env.example apps/api/.env   # ajuste DATABASE_URL/JWT_SECRET
cd apps/api
npx prisma migrate dev
npx prisma db seed
cd ../..
```

O seed cria:
- os 5 `EmployeeType` do catálogo (`docs/04-employee-catalog.md`), com
  Braço Atendimento `AVAILABLE` e os demais `COMING_SOON` (PD5);
- uma empresa de demonstração + usuário Owner, cobrindo o pré-requisito de
  onboarding manual (PD1 — não há fluxo self-service de criação de conta
  nesta fase): `owner@clinicavida.demo` / `braco123`.

## 4. Rodar em desenvolvimento

```bash
npm run dev:api   # http://localhost:3001
npm run dev:web   # http://localhost:5173 (proxy /api -> :3001)
```

## 5. Testes

```bash
npm run test:api                                  # unitários
cd apps/api && npm run test:e2e                   # e2e (banco real)
```

Os testes e2e (`apps/api/test/tenant-isolation.e2e-spec.ts`) rodam contra
um banco real (não mockado) porque exercitam as policies de Row-Level
Security de fato — é o requisito de `04-multi-tenancy.md` §5 ("suíte de
testes de isolamento deve rodar no CI a cada PR"). Cobrem: isolamento
entre empresas (R1), salvaguarda de disponibilidade (PD5), idempotência de
contratação (US03), RBAC (US03/US06), autenticação obrigatória, e o fluxo
de US06 (iniciar preparação).

## 6. Decisões de implementação registradas nesta etapa

Pontos onde o código precisou de uma decisão de engenharia não detalhada
letra-por-letra na Technical Discovery — registrados aqui para
transparência, não alterações de produto:

- **Status inicial da contratação:** `DigitalEmployee` é criado
  diretamente em `PREPARANDO` (não em `CONTRATADO`), porque
  `docs/design/flows/01-hiring.md` descreve a transição como automática
  ("Status: Contratado/Preparando") e não existe uma User Story separada
  para mover de um estado ao outro. `CONTRATADO` permanece um valor válido
  do enum `EmployeeStatus`.
- **RLS via `company_memberships` self-lookup:** a policy original de RLS
  bloqueava a própria consulta de login (não se sabe a empresa antes de
  descobrir a quê empresas o usuário pertence). Corrigido permitindo que
  um usuário leia suas próprias linhas de membership via
  `app.current_user_id`, além do tenant ativo via `app.current_company_id`
  — ver migration `company_memberships_self_lookup`.
- **Hash de senha com bcryptjs, não Argon2id:** `02-technology-stack.md`
  recomendava Argon2id; usamos bcryptjs (implementação pura em JS) para
  evitar dependência de compilação nativa no ambiente de desenvolvimento.
  Senha continua hasheada e nunca em texto plano; reavaliar Argon2id antes
  de produção real, se apropriado.
- **Token JWT em localStorage no frontend:** simplificação da Sprint 01;
  `02-technology-stack.md` §8 sugere refresh token em cookie httpOnly.
  Aceitável para esta fase (sem dado real de cliente final ainda — PD3),
  mas deve ser endurecido antes de expor a aplicação a uso real.
- **Frontend sem Material Web Components:** `13-frontend-m3-
  implementation.md` recomendava `@material/web` como base. Nesta
  primeira fatia, os componentes (`Button`, `Card`, labels de status) são
  HTML/CSS próprios consumindo os mesmos design tokens M3 gerados
  algoritmicamente das seeds de cor (`scripts/generate-theme.mjs`), para
  priorizar velocidade de entrega. A fidelidade visual ao M3 (color roles,
  shape, typography) é a mesma; o que fica pendente é a adoção do web
  component oficial — decisão tecnicamente reversível, isolada nos
  arquivos de `src/components/`.
