# BRAÇO — Deploy no Railway (passo a passo)

Documento operacional (deploy) — expande `18-running-the-app.md` §7 com o
passo a passo completo, incluindo a navegação no painel do Railway. Não
altera nenhuma decisão de produto/arquitetura registrada nos demais
documentos técnicos.

## 0. Por que 2 serviços, não 1

`apps/api` e `apps/web` são dois deployáveis independentes
(`01-architecture.md`). No Railway, cada um precisa ser um **serviço
separado**, com o *Root Directory* apontando para o respectivo diretório.
Um único serviço apontando para a raiz do monorepo não funciona: o
Railpack não consegue decidir sozinho qual dos dois buildar, e o erro
típico é a etapa `railpack prepare` falhar sem detalhe útil no log.

Cada diretório já tem seu próprio `railway.json` com `buildCommand`
(`npm run build`) e `startCommand` **explícitos**, pra não depender de
detecção automática do Railpack em monorepo com workspaces npm
(`apps/api` e `apps/web` não têm `package-lock.json` próprio, só o da
raiz).

> **Incidente registrado:** o `apps/api` ficou crashando na subida com
> `Error: Cannot find module '/app/dist/main.js'` mesmo com o build
> "bem-sucedido" (`nest build` rodava e terminava sem erro). Causa real:
> faltava `apps/api/tsconfig.build.json` — sem ele, o `tsc` compila
> junto `src/`, `test/` e `prisma/seed.ts`, calcula a raiz comum como a
> pasta do projeto inteiro e gera `dist/src/main.js` (aninhado) em vez
> de `dist/main.js` (que é o caminho fixo usado no `start:railway`). O
> `tsconfig.build.json` restaurado exclui `test`/`prisma` da compilação
> de produção, deixando `src/` como única raiz e o output plano de
> novo. Ver seção 7.

## 1. Criar o projeto e o banco

1. No painel do Railway: **New Project** → **Empty Project**.
2. Dentro do projeto: **+ New** → **Database** → **Add PostgreSQL**. Isso
   cria o plugin `Postgres`, com sua própria `DATABASE_URL` interna.

## 2. Serviço `apps/api`

1. **+ New** → **GitHub Repo** → selecione este repositório
   (`muriloalmeida-alt/Braco-Digital`).
2. **Settings** do serviço → **Root Directory** = `apps/api` — passo
   obrigatório, sem ele o build falha (ver §0).
3. **Variables**, adicione:
   - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}` — referência ao
     plugin criado no passo 1, **nunca** hardcoded.
   - `JWT_SECRET` = valor forte e único por ambiente (ex.:
     `openssl rand -hex 32`) — nunca reaproveitar o `change-me` de
     `.env.example` nem o de outro ambiente.
   - `JWT_EXPIRES_IN` = `900s`.
   - `CORS_ORIGIN` = deixe em branco por enquanto (preenche no §4). Aceita
     lista separada por vírgula se um dia houver mais de uma origem.
   - **Não defina `PORT`** — o Railway injeta automaticamente e
     `main.ts` já lê `process.env.PORT`.
4. Deploy. O que acontece automaticamente, via `railway.json` (issue
   #46 — migration e runtime deliberadamente separados no lifecycle):
   - **Build:** Railpack detecta Node, roda `npm install` (dispara
     `postinstall: prisma generate` sozinho — Prisma Client sempre
     atualizado, mesmo em ambiente limpo), depois `npm run build`.
   - **Pre-Deploy:** `npm run db:ensure-public-role && npm run
     prisma:deploy` — roda uma vez, **antes** da nova versão ser
     promovida. `db:ensure-public-role` garante que a role
     `braco_public` existe e tem a membership certa (issue #46; nunca
     precisa mais de SQL manual num ambiente novo — só cai no
     `public-role.sql` manual se o usuário do `DATABASE_URL` não tiver
     privilégio suficiente, e nesse caso falha aqui, claro, antes de
     qualquer migration rodar). Só então `prisma migrate deploy` aplica
     as migrations pendentes. **Se qualquer um dos dois falhar, a nova
     versão nunca é promovida** — a versão anterior continua no ar.
   - **Start:** `npm run start:prod` — só sobe o processo da API; nunca
     executa migration.
5. Depois do primeiro deploy: **Settings** → **Networking** → **Generate
   Domain**, para ter uma URL pública (formato
   `algo.up.railway.app`). Guarde essa URL — é usada no §3.

## 3. Serviço `apps/web`

1. **+ New** → **GitHub Repo** → mesmo repositório, como um **segundo**
   serviço.
2. **Settings** → **Root Directory** = `apps/web`.
3. **Variables**:
   - `VITE_API_BASE_URL` = URL pública do `apps/api` (passo 2.5), **sem**
     `/api` no final — a API não usa esse prefixo nas rotas.
4. Deploy. Start command já é `npm run start`, que serve o build estático
   via `serve -s dist` (o `-s` habilita fallback de SPA — necessário para
   as rotas do React Router funcionarem em acesso direto/refresh).
5. **Settings** → **Networking** → **Generate Domain**, para ter a URL
   pública do frontend.

## 4. Fechar o CORS

Volte no serviço `apps/api` → **Variables** → preencha `CORS_ORIGIN` com a
URL pública do `apps/web` (§3.5). Sem isso, o navegador bloqueia as
chamadas do frontend por CORS mesmo com os dois serviços no ar.

> **Ordem importa.** Suba a API primeiro (para ter a URL), configure o
> `VITE_API_BASE_URL` no web, depois volte na API para preencher o
> `CORS_ORIGIN`. Isso porque `VITE_API_BASE_URL` é lido em **build-time**
> pelo Vite — qualquer mudança nele exige um novo deploy/build, não só um
> restart.

## 5. Seed (opcional — só demo/piloto)

O seed (`prisma/seed.ts`) cria dados de demonstração (empresa "Clínica
Vida" + usuário Owner `owner@clinicavida.demo` / `braco123`) — **nunca
rodar em produção real** com dado de cliente. Adequado só para ambiente
de demonstração/piloto controlado (PD1).

```bash
railway run npm run prisma:seed
```

Rodar manualmente (Railway CLI logado no projeto, dentro de `apps/api`),
nunca como parte automática do deploy.

## 6. Checklist de verificação

- [ ] `apps/api` tem Root Directory = `apps/api` e `apps/web` tem Root
      Directory = `apps/web` (dois serviços, não um).
- [ ] Plugin PostgreSQL criado e `DATABASE_URL` do `apps/api` referencia
      `${{Postgres.DATABASE_URL}}` (não um valor colado à mão).
- [ ] `JWT_SECRET` é um valor forte, gerado por ambiente — não é
      `change-me`.
- [ ] `PORT` **não** está definida manualmente em nenhum dos dois
      serviços.
- [ ] `VITE_API_BASE_URL` (no `apps/web`) aponta para a URL pública real
      do `apps/api`, sem `/api` no final.
- [ ] `CORS_ORIGIN` (no `apps/api`) aponta para a URL pública real do
      `apps/web`.
- [ ] Ambos os serviços têm domínio público gerado (Networking → Generate
      Domain).
- [ ] Acessar a URL do `apps/web` carrega a tela de login sem erro de
      CORS no console do navegador.
- [ ] **Sem drift entre Git e Railway (issue #46, Parte 6):** Build
      Command, Pre-Deploy Command, Start Command e Root Directory do
      painel do Railway (aba **Settings** de cada serviço) batem
      exatamente com o que está versionado em `apps/api/railway.json`/
      `apps/web/railway.json`. Se algum campo aparecer com um valor
      diferente no painel, **o `railway.json` é a fonte de verdade** —
      ou o painel está com um override manual esquecido de uma
      investigação antiga (ver incidente do §7), ou o arquivo
      versionado ficou desatualizado; corrija um dos dois, nunca deixe
      os dois divergentes. Restart Policy não precisa bater
      necessariamente (não é lifecycle crítico), mas Root
      Directory/Build/Pre-Deploy/Start **sim**.

## 7. Troubleshooting

### 7.1 Rápido

| Sintoma | Causa provável |
|---|---|
| `railpack prepare` falha sem detalhe | Root Directory não configurado (serviço apontando pra raiz do monorepo) |
| `Error: Cannot find module '/app/dist/main.js'` na subida | `dist/` existe mas está aninhado (`dist/src/main.js`) por falta de `apps/api/tsconfig.build.json` — confirme que o arquivo existe e exclui `test`/`prisma`, e que `ls dist` no runtime mostra `main.js` direto na raiz, não uma subpasta `src/` |
| Erro de CORS no console do navegador | `CORS_ORIGIN` na API não bate **exatamente** com a URL do web (protocolo `https://` incluso, sem barra final) |
| Frontend chama `localhost:3001` em produção | `VITE_API_BASE_URL` não foi definida antes do build, ou mudou sem novo deploy (é lida em build-time) |
| API não sobe / erro de conexão com banco | `DATABASE_URL` não está referenciando o plugin Postgres corretamente |
| Migração não aplicada em produção | Confirme que o **Pre-Deploy Command** do serviço é `npm run db:ensure-public-role && npm run prisma:deploy` (ver `railway.json`) — o `start:prod` do runtime nunca roda migration de propósito (issue #46) |

### 7.2 `role "braco_public" does not exist` / P3018 / P3009 (runbook — issue #46)

**Incidente de origem:** a migration `20260913173626_sprint02_track_b_public_leads`
faz `GRANT ... TO braco_public`, mas não cria a role (por desenho — ver
`apps/api/prisma/bootstrap/public-role.sql`). Se `braco_public` ainda
não existir quando essa migration rodar, ela falha com
`ERROR: role "braco_public" does not exist` (Prisma reporta isso como
**P3018** — falha ao aplicar uma migration). Qualquer deploy seguinte
então falha com **P3009** ("migrate found failed migrations in the
target database"), porque o Prisma se recusa a aplicar migrations
novas enquanto houver uma marcada como falha.

Desde a issue #46, o `preDeployCommand` do `railway.json` roda
`npm run db:ensure-public-role` antes de `prisma migrate deploy` em
todo deploy — isso deve prevenir o P3018 original em qualquer ambiente
novo. Este runbook cobre o que fazer se, mesmo assim, uma migration
qualquer ficar marcada como falha (o mesmo incidente pode em teoria
acontecer com qualquer outra migration futura, por outro motivo).

**Nunca pule direto para `prisma migrate resolve`.** Antes:

1. Consultar `_prisma_migrations` (`SELECT migration_name, finished_at,
   logs FROM _prisma_migrations ORDER BY started_at`) para identificar
   exatamente qual migration está marcada como falha (`finished_at`
   nulo).
2. Ler o `logs` dessa linha (ou o Deploy Log do Railway) para entender
   a causa real do erro — nunca assumir que é o mesmo motivo de uma
   vez anterior.
3. Verificar se a migration teve **efeito parcial**: ela criou
   `Table`/`Enum`/etc. e falhou só numa `GRANT` no meio (efeito
   parcial), ou falhou antes de qualquer efeito (rodou inteira dentro
   de uma transação que reverteu tudo)? Inspecionar os objetos que a
   migration deveria ter criado (`\dt`, `\d nome_da_tabela`) resolve
   isso na prática.
4. Só depois de confirmar qual dos dois casos é, escolher:
   - **Sem efeito parcial relevante** → corrigir a causa raiz (ex.:
     rodar `npm run db:ensure-public-role` manualmente se for esse o
     motivo), depois `npx prisma migrate resolve --rolled-back
     <nome-da-migration>`, depois `npx prisma migrate deploy`.
   - **Com efeito parcial** → nunca reexecutar cegamente. Completar
     manualmente o que faltou e marcar `--applied`, OU desfazer com
     segurança os efeitos parciais e só então marcar
     `--rolled-back` e reaplicar. Documentar exatamente o que foi
     feito (qual caminho, quais comandos) em algum lugar rastreável
     (issue/PR), nunca só de memória.

**Nunca fazer, em nenhum dos dois casos:**
- `prisma migrate reset` — apaga o banco inteiro; nunca é solução de
  homologação/produção.
- Chamar `prisma migrate resolve` automaticamente/por script só porque
  apareceu P3009 — resolve sempre depende de entender a causa raiz
  primeiro (passos 1–3 acima).
- Apagar tabelas/dados manualmente para "destravar" a migration.

**Confirmado no incidente original** (`20260913173626_sprint02_track_b_public_leads`):
a migration inteira roda dentro de uma transação, então a falha na
`GRANT` não deixou nenhum efeito parcial (nem a tabela `leads` nem os
enums foram criados) — o caminho usado foi `--rolled-back` seguido de
`migrate deploy`, sem nenhuma limpeza manual adicional. Isso **não** é
garantia para migrations futuras — o passo 3 acima precisa ser
reconferido a cada incidente.
