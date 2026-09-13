# Sprint 02 — Manual de Trabalho + Growth Foundation

**Status:** READY FOR DEVELOPMENT — Product Ready + Design Ready + Tech Ready  
**Owner Produto/Design:** GPT  
**Owner Tech Ready:** Claude / Engineering

## Objetivo principal — Track A

> **Preparar completamente o funcionário para trabalhar.**

## Objetivo complementar — Track B Growth

> **Criar uma experiência pública capaz de transformar necessidades do negócio em uma equipe BRAÇO recomendada e gerar um lead qualificado.**

## Contexto

Sprint 01 entregou contratação, Minha Equipe, início da preparação e
overview com seções vazias.

Sprint 02 transforma essa estrutura em um **Manual de Trabalho completo,
revisável e seguro**.

## Resultado esperado

Ao final:
- as 8 etapas de conteúdo podem ser preenchidas;
- progresso e pendências são visíveis;
- recursos necessários podem ser configurados;
- o gestor revisa o Manual;
- escolhe `Concluir preparação`;
- o funcionário passa de `Preparando` para `Pronto`;
- o funcionário **ainda não trabalha**.

## Tracks

### Track A — Core Product

Prioridade da Sprint.

#### E02 — Preparação
- US07 — Informar dados da empresa
- US08 — Cadastrar produtos e serviços
- US09 — Definir responsabilidades
- US10 — Definir regras e limites
- US11 — Definir autonomia
- US12 — Informar equipe e responsáveis
- US13 — Definir estilo de comunicação
- US14 — Configurar recursos de trabalho
- US15 — Revisar Manual de Trabalho
- US16 — Identificar preparação incompleta

#### E03 — Ativação (ponte)
- US17 — Visualizar status de preparação


### Track B — Growth

#### E12 — Aquisição e Diagnóstico de Equipe
- US77 — Visualizar Landing Page
- US78 — Iniciar diagnóstico de equipe
- US79 — Informar necessidades da empresa
- US80 — Priorizar problemas da empresa
- US81 — Gerar equipe recomendada
- US82 — Visualizar disponibilidade dos Braços recomendados
- US83 — Registrar lead interessado

Track B não cria conta/tenant e não substitui E11/PRD 03.

Referências:
- `docs/prd/04-aquisicao-e-diagnostico-de-equipe.md`
- `docs/design/26-growth-landing-experience.md`
- `docs/design/27-team-diagnostic-model.md`
- `docs/design/28-growth-wireframes.md`


## Experiência definida — Track A

**8 etapas + Revisão**

1. Empresa
2. Produtos e serviços
3. Responsabilidades
4. Regras e limites
5. Autonomia
6. Pessoas e responsáveis
7. Comunicação
8. Recursos de trabalho
9. Revisão

Progresso:

> **X de 8 etapas completas**

## Decisões de Produto/Design

- autosave; sem botão Salvar;
- `Continuar` valida/conclui etapa;
- contexto compartilhado identificado;
- responsabilidades são catálogo funcional, não prompt livre;
- limites de sistema são read-only;
- autonomia é por responsabilidade;
- 🟡 exige condição;
- responsável principal obrigatório;
- transparência digital fixa;
- WhatsApp obrigatório;
- Calendar/Tasks condicionais às responsabilidades;
- revisão explícita;
- `Concluir preparação` → `Pronto`;
- `Pronto` não ativa;
- invalidar requisito antes da ativação → `Preparando`.

## Product Ready

> **YES**

## Design Ready

> **YES**

Referências:
- `docs/design/flows/02-preparation.md`
- `docs/design/09-product-patterns.md`
- `docs/design/12-status-and-states.md`
- `docs/design/22-work-manual-content-model.md`
- `docs/design/23-preparation-experience-spec.md`
- `docs/design/24-work-resources-ui-spec.md`
- `docs/design/25-sprint-02-wireframes.md`
- `docs/design/20-brand-ui-integration.md`
- `docs/design/21-logo-usage.md`

## Product Ready — Track B Growth

> **YES**

## Design Ready — Track B Growth

> **YES**

### Política de prioridade

Track A é o objetivo principal da Sprint 02.

Track B está planejado na mesma sprint, mas não pode causar redução silenciosa
do escopo ou qualidade do Track A.

Se capacidade técnica exigir negociação de escopo:

> retornar ao PO/PM; não mover histórias automaticamente.

## Tech Ready

> **YES — TRACK A + TRACK B**

Technical Readiness aceito, com caveats não bloqueantes documentados em
`docs/technical/20-sprint-02-tech-readiness.md`.

### Readiness consolidado após resolução de PD7

Track A:
- TECH READY: US09, US10, US11, US12, US13, US15, US16, US17
- TECH READY WITH CAVEATS: US07, US08, US14

Track B:
- TECH READY: US79, US80, US81, US82
- TECH READY WITH CAVEATS: US77, US78, US83

Nenhuma história está `NOT TECH READY`.

Engenharia deve validar especialmente:

1. evolução do modelo WorkManual/sections;
2. autosave e concorrência;
3. shared company context;
4. produtos/serviços;
5. dependências responsabilidades/autonomia/recursos;
6. PREPARANDO ↔ PRONTO;
7. WhatsApp BSP setup;
8. Google OAuth + Calendar + Tasks;
9. ambientes/credenciais/callbacks;
10. RLS/testes para todos os novos dados.

Para Track B, validar adicionalmente:

11. arquitetura pública da landing/diagnóstico;
12. persistência de diagnóstico e lead fora de tenant autenticado;
13. rate limit / anti-spam / abuso;
14. fonte única de Catalog Availability;
15. analytics do funil sem PII;
16. privacidade e proteção dos dados do lead;
17. mecanismo determinístico/versionado de recomendação.

## Critérios de sucesso

- [ ] US07–US17 Tech Ready;
- [ ] fluxo completo executável;
- [ ] autosave confiável;
- [ ] 8 etapas concluíveis;
- [ ] pendências acionáveis;
- [ ] recursos obrigatórios bloqueiam corretamente;
- [ ] revisão final funcional;
- [ ] PREPARANDO → PRONTO funcional;
- [ ] nenhuma ativação antecipada;
- [ ] RLS preservado;
- [ ] Compact 380 / Medium 768 / Expanded 1440;
- [ ] Light/Dark;
- [ ] acessibilidade;
- [ ] testes sem regressão da Sprint 01;
- [ ] US77–US83 Tech Ready;
- [ ] landing responsiva;
- [ ] diagnóstico determinístico reproduzível;
- [ ] disponibilidade sincronizada com catálogo;
- [ ] lead persistido sem criação de conta;
- [ ] funil mensurável;
- [ ] public launch protegido pelo gate jurídico de privacidade.

## Riscos específicos

### US14
Dependências externas de BSP/OAuth podem afetar Tech Ready.

Se Engenharia não conseguir US14 sem mudar produto:

> registrar `Product Decisions Required`.

Não reduzir silenciosamente a placeholder visual.

### Estado Pronto
Não confundir preparação com ativação.

### PD7 — Autonomia
**RESOLVED.**

Recomendação e teto são propriedades distintas. No Braço Atendimento v1,
os valores coincidem. Engenharia deve tratar o teto como regra própria,
sem assumir equivalência estrutural para futuras versões.

### PD6 — Privacidade do lead
**PRODUCT DIRECTION CONFIRMED / LEGAL VALIDATION REQUIRED.**

Desenvolvimento do Track B está autorizado. Publicação com captação real de
lead permanece bloqueada até validação jurídico/compliance.

### Track B — Privacidade pública
Desenvolvimento pode seguir, mas publicação com captação real depende de
validação jurídico/compliance da camada de privacidade e contato do lead.

### Track B — Capacidade
E12 é P1 e Track A é a prioridade da sprint. Qualquer necessidade de
replanejamento deve voltar ao PO/PM.

## Definition of Done

- código implementado;
- testes;
- critérios atendidos;
- visual validado;
- acessibilidade;
- docs técnicas;
- issues;
- nenhuma mudança silenciosa.

## Encerramento

### Resultado
_A preencher._

### Histórias concluídas
_A preencher._

### Histórias carregadas
_A preencher._

### Decisões
_A preencher._

### Aprendizados
_A preencher._
