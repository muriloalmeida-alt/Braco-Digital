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
  arquivos de `src/components/`. Revisado e aceito por PM/Product Design
  em `docs/delivery/sprints/sprint-01-review.md` §6.5: sem exigência de
  migração para `@material/web`.

## 7. Deploy no Railway

> Passo a passo completo, com a navegação no painel do Railway e um
> checklist de verificação: `19-deploy-railway.md`.

`apps/api` e `apps/web` são dois deployáveis independentes
(`01-architecture.md`) — no Railway, cada um deve ser um **serviço
separado**, com o *Root Directory* apontando para o respectivo diretório
(`apps/api` / `apps/web`). Um único serviço apontando para a raiz do
monorepo não funciona: o Railpack não consegue decidir sozinho qual dos
dois buildar, e o erro típico é a etapa `railpack prepare` falhar sem
detalhe útil no log.

Cada diretório já tem seu próprio `railway.json` com build/start
explícitos, para não depender de detecção automática.

### 7.1 Serviço `apps/api`

1. Criar o serviço com **Root Directory = `apps/api`**.
2. Adicionar o plugin **PostgreSQL** do Railway ao projeto.
3. Variáveis de ambiente do serviço:
   - `DATABASE_URL` → referenciar o plugin Postgres (`${{Postgres.DATABASE_URL}}`), nunca hardcoded.
   - `JWT_SECRET` → valor forte gerado por ambiente (nunca reaproveitar o de dev).
   - `JWT_EXPIRES_IN` → ex.: `900s`.
   - `CORS_ORIGIN` → URL pública do serviço `apps/web` (preencher depois de criá-lo).
   - `PORT` → não definir; o Railway injeta automaticamente e `main.ts` já lê `process.env.PORT`.
4. `npm install` roda `postinstall: prisma generate` automaticamente — o Prisma Client é sempre gerado no build, mesmo em ambiente limpo.
5. O start command (`start:railway`, já configurado em `railway.json`) roda `prisma migrate deploy` antes de subir a API — as migrações do banco de produção são aplicadas a cada deploy, sem passo manual.

### 7.2 Serviço `apps/web`

1. Criar o serviço com **Root Directory = `apps/web`**.
2. Variável de ambiente:
   - `VITE_API_BASE_URL` → URL pública do serviço `apps/api` (sem `/api` no final — a API não usa esse prefixo nas rotas). Como é lida em build-time pelo Vite, qualquer mudança nessa variável exige um novo deploy/build, não só um restart.
3. O start command (`npm run start`, já configurado) serve o build estático via `serve -s dist` — o `-s` habilita fallback de SPA (necessário para as rotas do React Router funcionarem em acesso direto/refresh).

### 7.3 Ordem recomendada

Suba `apps/api` primeiro (para ter a URL pública dele), configure
`VITE_API_BASE_URL` no `apps/web` apontando para essa URL, depois volte no
`apps/api` e preencha `CORS_ORIGIN` com a URL pública do `apps/web`. Sem
isso, o navegador bloqueia as chamadas do frontend por CORS mesmo com tudo
rodando.

### 7.4 Seed em produção

O seed (`prisma/seed.ts`) cria dados de demonstração (empresa "Clínica
Vida" + Owner com senha conhecida) — **não rodar em produção real** com
dados de cliente. Adequado apenas para ambiente de demonstração/piloto
controlado (PD1). Rodar manualmente via `railway run npm run prisma:seed`
(CLI do Railway) quando for o caso, nunca como parte automática do deploy.

## 8. Brand UI Foundation

Identidade visual aplicada conforme `docs/design/20-brand-ui-integration.md`
e `docs/design/21-logo-usage.md`. Mapeamento de onde cada asset de
`apps/web/public/brand/` é referenciado no código:

| Asset | Usado em | Contexto |
|---|---|---|
| `06_logo_negativa_branca.png` | `components/AppShell.tsx`, `pages/LoginPage.tsx` | Navigation Drawer (Expanded) e painel institucional do Login (Expanded) — superfícies em Azul Profundo |
| `03_logo_horizontal_colorida.png` | `components/AppShell.tsx` | Top App Bar (Compact/Medium), quando a largura comporta a assinatura |
| `09_icone_aplicativo.png` | `components/AppShell.tsx`, `index.html` | Top App Bar quando não há largura para a logo horizontal; `apple-touch-icon` |
| `02_logo_vertical_sem_assinatura.png` | `pages/LoginPage.tsx` | Login em Compact (sem o painel institucional escuro) |
| `10_favicon_32.png` | `index.html` | Favicon (`<link rel="icon">`) |

Os demais assets do pacote (`01`, `04`, `05`, `07`, `08`) não têm uso na
aplicação web nesta etapa — são materiais institucionais/redes sociais
(`docs/design/21-logo-usage.md` §4/§6), copiados para o repositório por
completude do pacote de marca, não referenciados em código.

Tema (seeds, âncoras de marca), tipografia (Manrope) e iconografia
(Lucide): decisões técnicas completas em
`docs/technical/17-technical-decisions.md` TD11/TD12 e
`docs/technical/13-frontend-m3-implementation.md` §2.
