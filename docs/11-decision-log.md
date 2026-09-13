# BRAÇO — Decision Log

## Decisões aprovadas
- Produto: **BRAÇO**
- Posicionamento: **Mais capacidade para sua empresa.**
- Categoria: funcionários digitais.
- Unidade de venda: funcionário.
- Primeiro funcionário: Braço Atendimento.
- Todos os Braços que falam com clientes usam WhatsApp.
- Gestão, logs e relatórios ficam no BRAÇO.
- Google Calendar = agenda.
- Google Tasks = tarefas e follow-ups.
- O gestor configura tudo pelo BRAÇO.
- Atendimento é explicitamente digital.
- Princípio: **Digital na identidade. Humano na experiência.**
- Toda decisão relevante é formalizada em Markdown.
- Governança: **Docs definem. Issues operacionalizam. Código implementa.**
- Murilo = PO/Sponsor.
- GPT = PM + Product Designer.
- Claude = Engineering.
- Engenharia não altera comportamento aprovado silenciosamente.

## Decisões de Product Design

- GPT acumula os papéis de **Product Manager + Product Designer**.
- Google **Material Design 3** é a fonte de verdade do Design System.
- BRAÇO não criará Design System concorrente ao M3.
- Componentes próprios devem preferencialmente ser composições M3.
- M3 Expressive pode ser adotado seletivamente quando melhorar hierarquia e compreensão.
- Experiência responsiva segue o princípio **Simples no celular. Completo no desktop.**
- Histórias com interface exigem **Product Ready + Design Ready + Tech Ready**.
- Arquitetura de informação, fluxos, estados e padrões estão em `docs/design/`.

### Catalog Availability — fechamento visual

- `Catalog Availability` permanece separado de `Employee Status`.
- `Em breve` é estado informativo/navegável, não estado disabled.
- Card `Em breve` mantém contraste e conteúdo normais, possui `Ver detalhes`
  e não possui CTA de contratação.
- Card `Disponível` possui `Ver detalhes` e `Contratar funcionário`.
- Não usar botão de contratação desabilitado para `Em breve`.
- Não usar lista de espera/"Avise-me" nesta fase.
- Especificação visual aprovada:
  `docs/design/18-catalog-availability-ui-spec.md`.

### WhatsApp Template Library v1 — Content Design

- Conteúdo v1 dos 5 templates de PD2 foi definido em
  `docs/design/19-whatsapp-template-library.md`.
- Todos preservam transparência digital com a expressão
  **"Aqui é o atendimento digital da {{empresa}}."**
- Templates são inicialmente body-only, sem botões.
- Variáveis são controladas e não podem ser inventadas livremente pelo LLM.
- Em contexto sensível (ex.: clínicas), o template não deve expor
  diagnóstico/condição/procedimento sensível.
- Guardrail global do MVP: no máximo 1 mensagem proativa por cliente em 24h.
- Follow-up/recuperação: máximo de 2 tentativas automáticas por oportunidade,
  com intervalo mínimo recomendado de 48h.
- Agendamento incompleto: 1 retomada automática.
- Lembrete: 1 lembrete automático no MVP.
- Falta/rejeição de template nunca autoriza fallback para texto livre.
- Status de conteúdo: **Content Design Ready**; disponibilidade operacional
  depende de aprovação/configuração Meta/BSP.

### Identidade Visual v1 — aplicação no produto

- O Guia de Identidade Visual BRAÇO Digital v1.0 passa a ser a fonte de
  verdade da expressão visual da marca.
- M3 continua sendo a fonte de verdade do Design System.
- Regra: **M3 define como funciona; BRAÇO define como se expressa.**
- Seeds provisórias anteriores são substituídas por:
  - Primary `#0B4F86`
  - Secondary `#66717D`
  - Tertiary `#32B44A`
- Azul Profundo `#07345A` é a superfície de marca preferencial para
  navegação expandida e áreas escuras.
- Verde Capacidade `#32B44A` é acento funcional positivo, não CTA padrão.
- Tipografia principal: **Manrope**, fallback **Inter**.
- Cards: 12px; campos/botões: 8–10px; badges: pill.
- Iconografia preferencial do produto: **Lucide**, outline e consistente.
- App Shell deve ser humano, simples e atraente, com Off White como fundo,
  Branco em cards e Azul BRAÇO em ações principais.
- Assets oficiais de logo devem ser usados sem alteração.
- Regras completas:
  - `docs/design/20-brand-ui-integration.md`
  - `docs/design/21-logo-usage.md`

## Product Decisions Required — resolução (pós Technical Discovery v1)

Decisões tomadas por Murilo (PO) em resposta a
`docs/technical/16-product-decisions-required.md`. Histórico preservado —
nada foi apagado, apenas resolvido.

### PD1 — Registro e Onboarding de Conta — **RESOLVED**
- O piloto inicial do BRAÇO usa **onboarding manual/provisionado pela
  equipe BRAÇO**: sem criação self-service de conta e empresa nas Sprints
  01–06.
- Empresa e primeiro usuário Owner são provisionados administrativamente
  (seed/admin tooling). Nenhuma UI self-service é necessária agora.
- O fluxo self-service será formalizado como **PRD 03 — Registro e
  Onboarding** / **E11 — Registro e Onboarding**, planejamento inicial em
  **Sprint 07**, obrigatório antes de lançamento público/self-service.
- Detalhe em `docs/05-customer-journey.md`, `docs/06-mvp.md`,
  `docs/10-product-roadmap.md`, `docs/delivery/backlog.md`.

### PD2 — WhatsApp: Follow-up e Templates — **RESOLVED**
- Aprovada a submissão antecipada de templates oficiais de WhatsApp.
  Mensagens proativas fora da janela permitida não são geradas livremente
  pelo LLM.
- MVP com 5 intenções de template: (1) Follow-up de interesse,
  (2) Agendamento incompleto, (3) Lembrete de agendamento,
  (4) Reagendamento, (5) Recuperação de oportunidade.
- Conteúdo v1 agora está **Content Design Ready** em
  `docs/design/19-whatsapp-template-library.md`.
- Próximo gate externo: preparar placeholders/exemplos no formato do BSP e
  submeter à Meta/BSP antes do início da Sprint 03.
- E06 permanece na Sprint 05; follow-up proativo fora da janela fica
  condicionado ao template aprovado aplicável.
- Detalhe em `docs/prd/01-braco-atendimento.md`,
  `docs/delivery/epics/E06-follow-up-e-recuperacao/epic.md`, US40–US45,
  `docs/delivery/sprints/sprint-05.md`, `docs/design/flows/06-follow-up.md`,
  `docs/design/13-content-design.md`, `docs/technical/05-whatsapp.md`.

### PD3 — Retenção, Exclusão e LGPD — **PRODUCT DIRECTION DEFINED / LEGAL VALIDATION REQUIRED**
- Sem retenção indefinida por padrão e sem número arbitrário (ex.: 24
  meses) adotado agora. Arquitetura suporta políticas configuráveis de
  retenção, exclusão sob demanda, exclusão no encerramento de empresa
  cliente, retenção diferenciada por categoria de dado, e conservação
  restrita quando houver obrigação legal legítima.
- Período definitivo por categoria exige **validação jurídica**, gate
  **antes do início da Sprint 03** — nenhum dado real de cliente final entra
  em produção antes disso.
- Novo documento: `docs/13-data-privacy-and-retention.md` (Status: Pending
  Legal Validation).
- **Não bloqueia Sprint 01.**

### PD4 — Google Tasks — **RESOLVED**
- Confirmado: toda experiência de gestão de tarefas acontece dentro do
  BRAÇO. Google Tasks é recurso operacional integrado, não superfície de
  gestão. O produto não garante contexto estruturado do BRAÇO ao abrir o
  Google Tasks diretamente.
- Princípio: **o gestor configura e acompanha no BRAÇO; as integrações
  trabalham nos bastidores.**

### PD5 — Catálogo de Funcionários — **RESOLVED**
- Sprint 01 exibe os **5 funcionários** do portfólio no catálogo. Somente
  **Braço Atendimento** está **Disponível** (contratável); os outros 4
  (Vendas, Orçamentos, Pós-venda, Financeiro) estão **Em breve**.
- **Em breve não é Employee Status** — é um conceito novo e separado,
  **Catalog Availability** (`Disponível` / `Em breve`), documentado em
  `docs/design/09-product-patterns.md`.
- Especificação visual completa aprovada em
  `docs/design/18-catalog-availability-ui-spec.md`.
- Aplicado antes do início de US01/US02/US03.

### US06 — Iniciar preparação — escopo confirmado
- Confirmada a interpretação de Engenharia: US06 cobre apenas entrar na
  preparação, ver a visão geral, a estrutura de seções e o estado inicial/
  incompleto, e identificar o próximo passo. Não inclui preencher nenhuma
  seção (isso pertence a US07–US15, Sprint 02).
- Após atualização documental: **Product Ready: Sim / Design Ready: Sim.**
