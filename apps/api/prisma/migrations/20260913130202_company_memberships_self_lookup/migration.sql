-- Corrige um problema real encontrado ao testar o login: a policy original
-- de company_memberships só permitia leitura com app.current_company_id já
-- setado, mas no momento do login ainda não sabemos qual empresa o usuário
-- vai usar (é exatamente o que essa consulta precisa descobrir).
--
-- Ajuste: um usuário pode enxergar suas PRÓPRIAS linhas de membership
-- (para descobrir a quais empresas pertence), além das linhas da empresa
-- do tenant ativo. Isso não vaza dado de outro usuário nem de outra
-- empresa — só permite a um usuário ver em quais empresas ele mesmo está.
ALTER POLICY tenant_isolation ON "company_memberships"
  USING (
    company_id = current_setting('app.current_company_id', true)
    OR user_id = current_setting('app.current_user_id', true)
  );
