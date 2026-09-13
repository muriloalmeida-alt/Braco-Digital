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

- GPT = **Product Manager + Product Designer**.
- Google **Material Design 3** é a fonte de verdade do Design System.
- Guia de Identidade Visual BRAÇO é fonte de verdade da expressão de marca.
- **M3 define como funciona; BRAÇO define como se expressa.**
- Experiência responsiva: **Simples no celular. Completo no desktop.**
- Histórias com UI exigem **Product Ready + Design Ready + Tech Ready**.

### Catalog Availability
- `Disponível` / `Em breve` separados de Employee Status.
- `Em breve` é informativo/navegável, não disabled.
- Referência: `docs/design/18-catalog-availability-ui-spec.md`.

### WhatsApp Template Library v1
- 5 intenções definidas.
- Content Design Ready.
- Aprovação Meta/BSP permanece gate externo.
- Referência: `docs/design/19-whatsapp-template-library.md`.

### Identidade Visual v1
- Primary `#0B4F86`.
- Secondary `#66717D`.
- Tertiary `#32B44A`.
- Azul Profundo `#07345A`.
- Manrope + Inter.
- Lucide outline.
- Referências:
  - `docs/design/20-brand-ui-integration.md`
  - `docs/design/21-logo-usage.md`

### Sprint 02 — Manual de Trabalho

Decisões de Produto/Product Design:

- preparação = **8 etapas de conteúdo + Revisão**;
- progresso = `X de 8 etapas completas`;
- autosave substitui botão Salvar;
- `Continuar` valida/conclui cada etapa;
- Empresa e Produtos/Serviços são contexto compartilhado;
- responsabilidades são selecionadas dentro da função, sem builder genérico;
- responsabilidades essenciais não podem ser removidas;
- limites de sistema são visíveis e não editáveis;
- autonomia é por responsabilidade;
- 🟡 `Pode decidir sob regras` exige condição;
- responsável principal é obrigatório;
- transparência digital é fixa;
- comunicação é configurada em linguagem de negócio, não prompt;
- WhatsApp é obrigatório;
- Calendar é obrigatório quando houver responsabilidade de agenda;
- Tasks é obrigatório quando houver follow-up/recuperação/lembrete;
- recursos são conectados/configurados na Sprint 02;
- uso operacional ocorre nas sprints específicas;
- Revisão é gate final;
- `Concluir preparação` muda `Preparando` para `Pronto`;
- concluir preparação **não ativa**;
- requisito obrigatório invalidado antes da ativação faz `Pronto → Preparando`.

Referências:
- `docs/design/22-work-manual-content-model.md`
- `docs/design/23-preparation-experience-spec.md`
- `docs/design/24-work-resources-ui-spec.md`


### Sprint 02 — Track B Growth / Monte sua equipe

Decisões aprovadas:

- Sprint 02 passa a ter dois tracks:
  - **Track A — Core Product:** US07–US17;
  - **Track B — Growth:** E12 / US77–US83.
- Track A permanece o objetivo principal da sprint.
- A experiência pública é chamada **Monte sua equipe**.
- Hero principal: **Sua empresa precisa de mais um braço? Agora tem.**
- diagnóstico não exige login;
- recomendação do MVP é determinística e auditável, sem LLM;
- retorno máximo de 3 Braços;
- disponibilidade vem da mesma fonte de verdade do catálogo;
- resultado é exibido antes da captura de contato;
- o diagnóstico não força Braço Atendimento quando não há aderência;
- Nome, Empresa e WhatsApp são obrigatórios no lead; E-mail é opcional;
- o lead preserva inputs, recomendação, disponibilidade observada, origem e versão das regras;
- E12 não cria User, Company ou contratação;
- E12 não substitui E11/PRD 03;
- não existe pricing/checkout no Track B;
- public launch com captação real depende de validação jurídico/compliance
  da camada de privacidade;
- o funil deve ser mensurável sem enviar PII para analytics.

Referências:
- `docs/prd/04-aquisicao-e-diagnostico-de-equipe.md`
- `docs/design/26-growth-landing-experience.md`
- `docs/design/27-team-diagnostic-model.md`
- `docs/design/28-growth-wireframes.md`


### PD6 — Privacidade do lead da Landing

**Status de Produto:** PRODUCT DIRECTION CONFIRMED / LEGAL VALIDATION REQUIRED.

Decisão:
- Track B pode ser desenvolvido integralmente;
- a arquitetura deve suportar aviso, link e registro da manifestação aplicável;
- Produto e Engenharia não inventam texto jurídico ou base legal;
- lançamento público com captação real fica bloqueado até validação
  jurídico/compliance;
- enquanto o gate não estiver concluído, ambientes de teste devem usar dados
  sintéticos/de teste, não leads reais de produção.

PD6 deixa de ser uma decisão de PO/Product em aberto e permanece como:

> **Launch Gate / Legal**

### PD7 — Teto de autonomia por responsabilidade

**Status:** RESOLVED.

Decisão:
- recomendação inicial e teto máximo permitido são conceitos distintos;
- o teto é regra própria e deve ser validado também no backend;
- no Braço Atendimento v1, recomendação e teto possuem os mesmos valores;
- responsabilidades recomendadas em 🟢 possuem teto 🟢;
- responsabilidades recomendadas em 🟡 possuem teto 🟡;
- o gestor sempre pode escolher nível mais conservador;
- opção mais permissiva que o teto fica indisponível e explicada na UI e é
  rejeitada no backend;
- versões futuras podem mudar recomendação sem necessariamente mudar o teto.

Tabela oficial:
`docs/design/22-work-manual-content-model.md`.

## Product Decisions Required — resolução (Technical Discovery v1)

### PD1 — Registro e Onboarding — **RESOLVED**
Piloto usa onboarding manual/provisionado nas Sprints 01–06. Self-service
futuro em PRD 03/E11.

### PD2 — WhatsApp Templates — **RESOLVED**
Conteúdo definido; submissão/aprovação Meta/BSP pendente.

### PD3 — Retenção/LGPD — **LEGAL VALIDATION REQUIRED**
Direção definida; política final antes da Sprint 03/dados reais.

### PD4 — Google Tasks — **RESOLVED**
Gestão sempre dentro do BRAÇO.

### PD5 — Catálogo — **RESOLVED**
Atendimento Disponível; demais Em breve.

### US06 — Escopo confirmado
US06 cobre overview/entrada. US07–US17 completam o ciclo da Sprint 02.
