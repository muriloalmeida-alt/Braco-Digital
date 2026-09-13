-- BRAÇO — Bootstrap único da role pública (Track B / TD15).
--
-- NÃO é uma migração do Prisma. Rodar UMA VEZ por ambiente (local, staging,
-- produção), à mão, conectado como um usuário do Postgres com o atributo
-- CREATEROLE (ou superusuário — ex.: `postgres` no gerenciador do provedor,
-- ou o painel de admin do Postgres no Railway).
--
-- Por quê separado da migração normal (prisma/migrations/):
-- a role usada para rodar `prisma migrate deploy` (a role de aplicação,
-- ex. "braco") não tem — e por princípio de menor privilégio não deveria
-- ter — o atributo CREATEROLE. Só uma role com CREATEROLE/superusuário
-- pode criar outra role ou conceder membership nela. Todo o resto do
-- setup da role pública (GRANTs de SELECT/INSERT em tabelas específicas,
-- a policy de RLS) já está na migração normal
-- (20260913173626_sprint02_track_b_public_leads), porque o dono das
-- tabelas pode conceder privilégios sobre seus próprios objetos sem
-- precisar de CREATEROLE — só precisa que a role já exista, e é
-- exatamente isso que este script garante primeiro.
--
-- Ordem de execução num ambiente novo:
--   1. Este script (uma vez, como superusuário/CREATEROLE).
--   2. `prisma migrate deploy` (role de aplicação normal).
--
-- Idempotente — seguro rodar de novo sem efeito colateral.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'braco_public') THEN
    CREATE ROLE braco_public NOLOGIN;
  END IF;
END
$$;

-- Substituir "braco" pelo usuário real da aplicação no ambiente, se for
-- diferente (ex.: o usuário gerado pelo plugin Postgres do Railway).
-- CURRENT_USER não é usado aqui de propósito: este script roda como o
-- superusuário/admin, não como a role de aplicação — precisamos nomear
-- explicitamente a quem conceder membership.
GRANT braco_public TO braco;
