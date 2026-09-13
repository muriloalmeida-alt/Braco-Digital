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

Cada diretório já tem seu próprio `railway.json` (build `RAILPACK` + start
command explícito), para não depender de detecção automática.

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
4. Deploy. O que acontece automaticamente, via `railway.json`:
   - Build: Railpack detecta Node, roda `npm install`, que dispara
     `postinstall: prisma generate` sozinho (Prisma Client sempre
     atualizado, mesmo em ambiente limpo).
   - Start (`npm run start:railway`): roda `prisma migrate deploy` antes
     de subir a API — as migrações do banco de produção aplicam a cada
     deploy, sem passo manual.
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

## 7. Troubleshooting rápido

| Sintoma | Causa provável |
|---|---|
| `railpack prepare` falha sem detalhe | Root Directory não configurado (serviço apontando pra raiz do monorepo) |
| Erro de CORS no console do navegador | `CORS_ORIGIN` na API não bate **exatamente** com a URL do web (protocolo `https://` incluso, sem barra final) |
| Frontend chama `localhost:3001` em produção | `VITE_API_BASE_URL` não foi definida antes do build, ou mudou sem novo deploy (é lida em build-time) |
| API não sobe / erro de conexão com banco | `DATABASE_URL` não está referenciando o plugin Postgres corretamente |
| Migração não aplicada em produção | Confirme que o start command do serviço é `npm run start:railway` (não `npm run start:prod`, que pula o `prisma migrate deploy`) |
