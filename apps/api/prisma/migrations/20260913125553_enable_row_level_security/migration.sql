-- BRAÇO — Row-Level Security (defesa em profundidade de multi-tenancy)
-- Ver docs/technical/04-multi-tenancy.md.
--
-- Tabelas de tenant ficam bloqueadas por padrão (fail-closed): se
-- app.current_company_id não estiver setado na sessão/transação, a policy
-- avalia para NULL/false e nenhuma linha é retornada ou gravada.
--
-- FORCE ROW LEVEL SECURITY garante que a policy vale mesmo para o dono da
-- tabela (a role de aplicação `braco` é dona das tabelas por ter rodado a
-- migração) — sem isso, RLS não protegeria contra um bug de query do
-- próprio backend, que é exatamente o risco que essa defesa existe para
-- cobrir.

ALTER TABLE "company_memberships" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "company_memberships" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "company_memberships"
  USING (company_id = current_setting('app.current_company_id', true));

ALTER TABLE "digital_employees" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "digital_employees" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "digital_employees"
  USING (company_id = current_setting('app.current_company_id', true));

ALTER TABLE "work_manuals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "work_manuals" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "work_manuals"
  USING (company_id = current_setting('app.current_company_id', true));

ALTER TABLE "idempotency_keys" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "idempotency_keys" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "idempotency_keys"
  USING (company_id = current_setting('app.current_company_id', true));

-- "companies" (raiz do tenant), "users" (identidade global) e
-- "employee_types" (catálogo global) não são tenant-scoped e não recebem
-- RLS por policy de company_id — isolamento delas é por design (não há
-- company_id nelas) e por RBAC na camada de aplicação.
