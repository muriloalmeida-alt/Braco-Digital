# BRAÇO — Multi-tenancy

BRAÇO é multiempresa desde o MVP: uma empresa contrata funcionários, e o
roadmap (`docs/10-product-roadmap.md`) prevê expansão para mais Braços por
empresa e mais empresas. A estratégia de tenancy precisa suportar isso sem
reescrita.

## 1. Estratégia de banco

**Recomendação: banco único, schema único, isolamento por `company_id` +
Row-Level Security (RLS) do PostgreSQL.**

| Estratégia | Prós | Contras | Adequação ao MVP |
|---|---|---|---|
| **Coluna `company_id` + RLS (recomendada)** | Custo mínimo; uma migração para todos; simples de operar com equipe pequena; RLS dá isolamento em nível de banco, não só de aplicação | Todo tenant compartilha recursos de banco (ruído entre empresas grandes/pequenas) | ✅ Adequada agora |
| Schema por tenant | Isolamento lógico mais forte; backup seletivo por tenant | Migração precisa rodar N vezes; complexidade cresce linearmente com nº de empresas; não compensa no volume do MVP | Considerar se exigência contratual de isolamento aparecer (ex.: cliente enterprise) |
| Banco por tenant | Isolamento máximo | Custo e operação inviáveis para PME com dezenas/centenas de tenants pequenos | ❌ Não adequado ao perfil de cliente (PME) |

A tabela acima é uma decisão técnica reversível com custo de migração médio
— documentada em `17-technical-decisions.md`.

## 2. Tenant context

- Todo request autenticado carrega `company_id` resolvido no momento do
  login/seleção de empresa ativa (um `User` pode pertencer a mais de uma
  empresa — ex.: consultor).
- O `company_id` ativo fica no JWT/sessão e é injetado pela API Gateway em
  todo request antes de chegar ao App/Runtime Service — nenhum service
  aceita `company_id` vindo do corpo da requisição do cliente para decidir
  isolamento (evita que um bug de frontend permita acessar dados de outra
  empresa).
- Toda conexão de banco usada para servir um request executa
  `SET LOCAL app.current_company_id = '<uuid>'` no início da transação;
  as policies de RLS usam essa variável de sessão.
- Jobs assíncronos (fila) carregam `company_id` explicitamente no payload do
  job — nunca inferem tenant a partir de estado global do worker.

## 3. Autorização (RBAC) dentro do tenant

Papéis por `CompanyMembership` (PRD 02, seção 3 e 21: "permissões baseadas em
responsabilidades de negócio"):

| Papel | Pode |
|---|---|
| Owner | Tudo, incluindo faturamento e remoção de outros membros |
| Admin | Contratar/preparar/ativar funcionários, configurar empresa e integrações, ver tudo |
| Operador | Acompanhar trabalho, intervir em atendimentos, não altera configuração de regras/autonomia |
| Visualizador | Somente leitura de Minha Equipe/Resultados |

RBAC é avaliado na API Gateway (guard) e reforçado nas policies de RLS onde
fizer sentido (ex.: um `Visualizador` não deveria conseguir `UPDATE` mesmo
que um bug de app deixasse passar).

## 4. Segregação e riscos de vazamento

Riscos identificados e mitigação:

| Risco | Mitigação |
|---|---|
| Query sem filtro de `company_id` por erro de desenvolvedor | RLS como última linha de defesa — a query falha/retorna vazio mesmo sem `WHERE company_id = ...` explícito |
| Job assíncrono processando payload de empresa errada | `company_id` explícito e validado no início de todo handler de job; testes automatizados de "cross-tenant leak" no CI |
| Cache (Redis) compartilhando chave entre empresas | Toda chave de cache é prefixada por `company_id` |
| Vazamento via LLM (prompt de uma empresa vazando para outra por bug de concorrência) | Cada chamada ao LLM é isolada por request/job; nenhuma memória compartilhada entre chamadas de empresas diferentes (ver `09-ai-llm.md`) |
| Índice/relatório interno cross-tenant exposto sem querer | Relatórios internos de produto (uso agregado) rodam em papel de serviço separado, nunca no papel usado por request de usuário final |
| Webhook do WhatsApp/Calendar entregue para empresa errada | Mapeamento explícito `phone_number_id → company_id` / `calendar_channel_id → company_id` validado antes de qualquer processamento — ver `05-whatsapp.md` e `06-google-calendar.md` |

## 5. Testes de isolamento

Suíte de testes automatizados dedicada ("tenant isolation tests") deve rodar
no CI a cada PR que toque em query de domínio: criar duas empresas, popular
dados equivalentes, garantir que nenhuma leitura de uma retorna dado da
outra. Isso é tratado como requisito de segurança, não "nice to have" —
listado em `10-security-lgpd.md`.

## 6. Impacto futuro

- **Mais funcionários por empresa** (Fase 3 do roadmap): já suportado pelo
  modelo (`DigitalEmployee` N:1 `Company`), nenhuma mudança de tenancy
  necessária.
- **Planos/tiers com limites** (ex.: nº de funcionários, volume de
  mensagens): adicionar `Company.plan` e checagens de quota — não afeta
  isolamento, é ortogonal.
- **Cliente enterprise exigindo isolamento físico**: migração seletiva desse
  tenant para schema/banco dedicado é possível sem mudar o modelo de
  domínio, só a camada de acesso a dados — motivo pelo qual a fronteira
  repositório/ORM deve ser respeitada desde o início (ver `02-technology-
  stack.md`, seção 4).
