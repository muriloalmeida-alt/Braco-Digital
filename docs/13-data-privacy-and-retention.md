# BRAÇO — Data Privacy & Retention

**Status: Pending Legal Validation**

Este documento formaliza a direção de produto para retenção, exclusão e
tratamento de dados pessoais no BRAÇO, em resposta a PD3
(`docs/technical/16-product-decisions-required.md`). O período definitivo
de retenção por categoria de dado **ainda não está definido** — depende de
validação jurídica. Nenhum dado real de cliente final deve entrar em
produção antes desse gate (obrigatório antes do início da Sprint 03).

## 1. Princípios adotados

- **Sem retenção indefinida como padrão.** Todo dado pessoal tem uma
  política de retenção associada, mesmo que o valor final do período ainda
  não esteja fixado.
- **Sem número arbitrário adotado agora** (ex.: não se assume "24 meses"
  por padrão). O período por categoria será definido com apoio jurídico.
- **Retenção configurável**, não hardcoded — a arquitetura suporta políticas
  diferentes por categoria de dado e, potencialmente, por empresa.
- **Exclusão sob demanda** (direito de apagamento) é suportada
  tecnicamente desde o desenho, independentemente de quando o período
  padrão for definido.
- **Exclusão associada ao encerramento de uma empresa cliente** é um fluxo
  de primeira classe, não um efeito colateral manual.
- **Conservação por obrigação legal legítima** é permitida como exceção
  explícita, com finalidade e acesso restritos — nunca como regra geral.

## 2. Categorias de dado e status de retenção

| Categoria | Retenção | Exclusão | Exceções |
|---|---|---|---|
| Conteúdo de conversas | A definir | Sim | Base/obrigação legal |
| Clientes | A definir | Sim | Base/obrigação legal |
| Agendamentos | A definir | Sim | Base/obrigação legal |
| Tarefas/follow-ups | A definir | Sim | Base/obrigação legal |
| Logs de auditoria | A definir | Conforme necessidade | Segurança/legal |
| Dados anonimizados | Conforme finalidade | N/A | Sem reidentificação |

"A definir" significa: suportado tecnicamente como período configurável,
aguardando o valor final da validação jurídica — não significa "sem
controle".

## 3. O que a arquitetura já suporta (independente do valor final do período)

- **Retention policies** por categoria de dado, parametrizáveis sem
  deploy de código (configuração, não constante fixa).
- **Soft delete e hard delete** como mecanismos disponíveis — qual se
  aplica a cada categoria é decisão de produto/jurídica futura, não
  travada pela implementação.
- **Exclusão por tenant** (quando uma empresa cliente encerra o contrato),
  isolada pelo mesmo mecanismo de `company_id` usado para multi-tenancy
  (`docs/technical/04-multi-tenancy.md`).
- **Segregação de dados preservados por obrigação legal**: um registro
  marcado como retido por exceção legal fica logicamente isolado do fluxo
  normal de exclusão, com acesso restrito e finalidade registrada.
- **Auditoria**: toda execução de política de retenção/exclusão (incluindo
  o motivo — expiração de prazo, solicitação do titular, encerramento de
  empresa) é registrada, nunca uma operação silenciosa.
- **Tratamento de backups**: backups seguem o mesmo compromisso de
  exclusão dentro de um prazo definido após a exclusão lógica dos dados
  originais (o prazo exato depende da política final e da ferramenta de
  backup do provedor gerenciado escolhido).
- **Execução de solicitações de exclusão**: fluxo operacional (mesmo que
  inicialmente manual/assistido por ferramenta interna) para atender pedido
  de um titular de dado, com prazo de execução e confirmação registrados.

## 4. O que depende de validação jurídica

- Período de retenção definitivo por categoria (tabela da seção 2).
- Quais categorias justificam retenção por obrigação legal e por quanto
  tempo (ex.: dados fiscais/financeiros podem ter prazo legal mínimo
  diferente de conteúdo de conversa comercial).
- Texto da política de privacidade voltada ao cliente final (titular
  indireto, que nunca é usuário do BRAÇO) e ao gestor/usuário do BRAÇO.
- Processo formal de atendimento a uma solicitação de exclusão externa
  (prazo de resposta, canal, verificação de identidade do solicitante).

## 5. Gate

> Nenhum dado real de cliente final deve entrar em produção antes da
> validação jurídica desta política.

Isso é um gate **antes do início da Sprint 03** (quando o WhatsApp/
atendimento real com clientes finais começa) — **não bloqueia a Sprint 01**,
que não processa dado de cliente final.

## 6. Referências

- `docs/technical/16-product-decisions-required.md` (PD3)
- `docs/technical/03-data-model.md`
- `docs/technical/10-security-lgpd.md`
- `docs/technical/12-infrastructure.md`
- `docs/12-development-governance.md`
- `docs/prd/01-braco-atendimento.md`
- `docs/prd/02-plataforma-gerencial.md`
