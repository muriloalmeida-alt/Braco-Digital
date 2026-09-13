# BRAÇO — Product Decisions Required

Itens em que a Technical Discovery encontrou requisito inviável, limitado
por API externa, conflitante ou tecnicamente inconsistente. Nenhum foi
alterado silenciosamente. Cada um segue o formato: requisito atual →
problema → impacto → alternativas → recomendação de Engenharia → decisão
necessária.

---

## PD1 — Não existe fluxo de criação de conta/empresa no backlog

**Requisito atual:** o backlog (76 histórias, 10 épicos) e
`docs/05-customer-journey.md` começam a jornada em "Contratar" — nenhuma
história cobre cadastro de empresa, criação do primeiro usuário Owner ou
onboarding inicial.

**Problema:** tecnicamente, toda história de Sprint 01 pressupõe uma
`Company` e um `User` autenticado existentes. Sem uma história/fluxo
aprovado para esse passo, Engenharia teria que inventar essa experiência
(tela de cadastro, verificação, texto, fluxo de convite de outros usuários
da empresa) sem gate de Design.

**Impacto:** não bloqueia o desenvolvimento da Sprint 01 (Engenharia pode
usar empresa/usuário via seed de demonstração), mas bloqueia qualquer
lançamento real a clientes.

**Alternativas:**
1. PM cria um épico/histórias formais de "Registro e Onboarding de Conta"
   antes da Sprint 02 ou 03.
2. Tratar como responsabilidade operacional manual no curtíssimo prazo
   (equipe BRAÇO provisiona a empresa manualmente para os primeiros
   clientes piloto), adiando o fluxo self-service.

**Recomendação de Engenharia:** opção 2 para viabilizar os primeiros
clientes piloto mais rápido (reduz escopo de UI a construir agora), com
opção 1 planejada explicitamente para antes de qualquer lançamento
self-service.

**Decisão necessária:** Murilo/PM decidir se o piloto inicial será
onboarding manual (equipe cria a empresa) ou self-service desde o início, e
em que sprint o fluxo self-service (se necessário) entra no backlog.

---

## PD2 — Janela de 24h do WhatsApp limita follow-up e lembretes proativos

**Requisito atual:** PRD 01 prevê explicitamente follow-up, recuperação de
oportunidade perdida e lembretes proativos (seções 8, 11; épico E06).

**Problema:** a política do WhatsApp Business Platform só permite iniciar
uma nova mensagem fora da janela de 24h desde a última mensagem do cliente
usando **templates pré-aprovados pela Meta** — texto fixo, com variáveis
limitadas, sujeito a aprovação prévia (que pode levar dias) e a rejeição.
Uma mensagem de follow-up "natural", gerada livremente pelo funcionário
digital fora dessa janela, **não pode ser enviada** dessa forma.

**Impacto:** direto na Sprint 05 (E06 — Follow-up e Recuperação) e em
qualquer lembrete espontâneo fora da janela ativa. Sem gerenciamento de
templates, essas histórias não podem ser implementadas como "o funcionário
escreve o que for preciso" — precisam operar sobre um conjunto pré-aprovado
e limitado de mensagens.

**Alternativas:**
1. Catalogar, desde já, os tipos de follow-up/lembrete previstos e
   submetê-los como templates aprovados na Meta/BSP com antecedência
   (processo de aprovação leva dias, deve começar antes da Sprint 05).
2. Restringir follow-up proativo a variáveis dentro de um template
   aprovado (ex.: "Olá {{nome}}, ainda tem interesse em agendar {{serviço}}?
   Responda para continuarmos.") em vez de texto livre gerado pelo LLM.
3. Aceitar que, sem uma resposta do cliente reabrindo a janela, follow-up
   proativo simplesmente não ocorre no MVP (reduz escopo de E06).

**Recomendação de Engenharia:** opção 1 combinada com 2 — é o único caminho
compatível com a política da plataforma sem eliminar a funcionalidade;
requer que PM/Design definam o conteúdo de 3–5 templates de follow-up antes
do início da Sprint 05, dado o lead time de aprovação.

**Decisão necessária:** PM aprovar o conjunto inicial de templates e o
processo de submissão; confirmar se E06 pode ser adiado até a aprovação dos
templates estar concluída.

---

## PD3 — Retenção e exclusão de dados de conversa do cliente final (LGPD)

**Requisito atual:** nenhum documento de produto define por quanto tempo
conversas, dados de agendamento e histórico de atendimento do cliente final
devem ser retidos, nem o que acontece a esses dados quando uma empresa
cancela o BRAÇO.

**Problema:** isso não é uma lacuna técnica — é uma decisão de negócio e
compliance que a arquitetura precisa de qualquer forma implementar. Sem
decisão, Engenharia teria que escolher um período de retenção sem mandato
de produto/jurídico.

**Impacto:** médio-alto a partir da Sprint 03 (quando dados reais de
clientes finais começam a existir).

**Alternativas:**
1. Retenção indefinida até solicitação de exclusão (mínimo esforço de
   implementação, maior exposição a risco de compliance).
2. Retenção por período fixo configurável (ex.: 24 meses) com exclusão
   automática programada.
3. Retenção diferenciada por tipo de dado (ex.: eventos de auditoria por
   mais tempo que conteúdo de mensagem).

**Recomendação de Engenharia:** opção 3, com período inicial conservador
definido em conjunto com jurídico/PM, e suporte técnico a exclusão sob
demanda (direito de apagamento) desde a Sprint que introduzir dados reais
de cliente final.

**Decisão necessária:** Murilo/PM (com apoio jurídico) definir período de
retenção por tipo de dado e política de exclusão no cancelamento de uma
empresa cliente.

---

## PD4 — Google Tasks não suporta campos customizados (vínculo cliente/atendimento)

**Requisito atual:** PRD e histórias (E08, E06) pressupõem visibilidade de
tarefas vinculadas a cliente/atendimento na interface do BRAÇO.

**Problema:** a API do Google Tasks não permite anexar metadados
estruturados (ex.: `customer_id`) a uma tarefa nativa do Google. O vínculo
só existe no banco do BRAÇO; se o gestor abrir o Google Tasks diretamente
(fora do BRAÇO), verá a tarefa sem esse contexto estruturado.

**Impacto:** baixo, **desde que** a experiência gerencial nunca dependa de o
gestor operar diretamente no Google Tasks (o que já parece ser a intenção
do PRD 02 §15: "visibilidade operacional sem exigir uso direto de sistemas
externos"). Registrado aqui para confirmação explícita, não porque haja
conflito ativo hoje.

**Alternativas:** nenhuma technical alternative resolve a limitação da API;
a única "alternativa" é de produto — confirmar que o Google Tasks é usado
apenas como motor de persistência/lembrete, nunca como superfície de
gestão.

**Recomendação de Engenharia:** confirmar por escrito esse pressuposto no
PRD/Design para eliminar qualquer expectativa futura de que abrir o Google
Tasks mostraria contexto do BRAÇO.

**Decisão necessária:** PM confirmar que a experiência de tarefas do
gestor é sempre dentro do BRAÇO (bloqueio de baixo risco, apenas
confirmação).

---

## PD5 — Catálogo de funcionários na Sprint 01: mostrar só Atendimento ou os 5 tipos (com bloqueio)?

**Requisito atual:** `docs/04-employee-catalog.md` já descreve 5
funcionários; `docs/06-mvp.md` limita o MVP a Braço Atendimento.

**Problema:** o fluxo de contratação (`flows/01-hiring.md`) não especifica
se o catálogo da Sprint 01 deve exibir só o funcionário disponível para
contratação ou os 5 com 4 marcados como indisponíveis/"em breve" (o que
também comunicaria o roadmap de expansão ao cliente, alinhado à estratégia
de "unidade de expansão: mais funcionários").

**Impacto:** baixo — decisão de conteúdo/apresentação, não estrutural.
Engenharia adotou a assunção mais simples (só Atendimento) para não
bloquear a Sprint 01 (ver `14-sprint-01-tech-readiness.md` §2), mas
qualquer mudança de decisão aqui é de baixo custo de implementação em
ambas as direções.

**Alternativas:** (a) só Atendimento; (b) os 5, com 4 bloqueados/"em breve".

**Recomendação de Engenharia:** (b) tem valor comercial (comunica expansão
desde o primeiro contato), mas exige que Design defina o estado "bloqueado"
do Employee Card, hoje não coberto em `09-product-patterns.md`.

**Decisão necessária:** PM/Design confirmar (a) ou (b) antes do
desenvolvimento de US01.
