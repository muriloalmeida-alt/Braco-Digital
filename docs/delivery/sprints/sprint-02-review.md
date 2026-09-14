# BRAÇO — Sprint 02 Review

**Status:** ver Decisão (§11)
**Review owner (Engenharia/Tech Lead):** Claude
**Data:** 2026-09-14
**Base SHA:** `127163e` (main)
**PRs de implementação:** #20 (Track A), #21 (Track B), #24, #32-#36, #33/#34 (Zernio real), #37 (Google real), #42 (UI real de Recursos), #43 (KMS production-grade)

## 1. Executive Summary

A Sprint 02 entregou o essencial dos dois tracks planejados:

- **Track A** transformou a estrutura vazia do Manual de Trabalho (Sprint
  01) num fluxo completo de 8 etapas + Revisão, com autosave, obrigatoriedade
  derivada por responsabilidade, e conexão **real** (não só simulada) de
  WhatsApp (Zernio) e Google Calendar/Tasks — incluindo UI real de conectar/
  desconectar e criptografia production-grade das credenciais.
- **Track B** entregou a landing pública, o diagnóstico determinístico, a
  recomendação de equipe e a captação de lead — com o gate jurídico de
  privacidade (PD6) preservado: desenvolvimento liberado, captação **real**
  de lead continua bloqueada até validação jurídica.

**O objetivo de Produto da sprint foi atingido**, com uma ressalva
importante: **US14 continua Parcial**, não Done — o motivo exato está em
§3. Isso por si só impede o fechamento "sem ressalva" da sprint; ver §11
para a decisão explícita.

Nenhuma mudança silenciosa de requisito ou de Design foi feita ao longo da
sprint (inclusive nas extensões pedidas depois do escopo inicial — Zernio
real, Google real, UI real, KMS — cada uma chegou como uma issue própria,
nunca embutida silenciosamente em outra).

## 2. Escopo

Igual ao definido em `sprint-02.md`: Track A (US07–US17, E02+E03) como
prioridade, Track B (US77–US83, E12) sem reduzir Track A. Ao longo da
sprint, o escopo de US14 foi estendido três vezes por decisão explícita de
Produto/PO, cada vez como issue própria, nunca reaproveitando outra:

- issue #30 — WhatsApp real via Zernio (substitui o simulador para esse recurso);
- issue #31 — Google Calendar/Tasks real via OAuth (idem);
- issue de UI real de Recursos + issue de KMS production-grade (esta
  revisão) — fecham a lacuna entre "backend real existe" e "US14
  realmente Done".

## 3. Histórias — Track A

| Story | Título | Status | Evidência |
|---|---|---|---|
| US07 | Informar dados da empresa | **Done** | `EmpresaStep.tsx` + `companies` API, testado |
| US08 | Cadastrar produtos e serviços | **Done** | `ProdutosStep.tsx` + CRUD `products`, testado |
| US09 | Definir responsabilidades | **Done** | Catálogo funcional (`responsibility-catalog.ts`), `ResponsabilidadesStep.tsx` |
| US10 | Definir regras e limites | **Done** | Limites read-only + regras customizadas, `RegrasStep.tsx` |
| US11 | Definir autonomia | **Done** | Por responsabilidade, recomendado vs. teto (PD7 resolved), `AutonomiaStep.tsx` |
| US12 | Informar equipe e responsáveis | **Done** | Responsável principal obrigatório, `PessoasStep.tsx` |
| US13 | Definir estilo de comunicação | **Done** | `ComunicacaoStep.tsx` + preview |
| US14 | Configurar recursos de trabalho | **Parcial** | Ver detalhamento abaixo — não é Done |
| US15 | Revisar Manual de Trabalho | **Done** | `ReviewStep.tsx`, revisão explícita antes de Concluir |
| US16 | Identificar preparação incompleta | **Done** | `PreparationReadinessService` (TD19), pendências acionáveis |
| US17 | Visualizar status de preparação | **Done** | `EmployeeStatusBadge`, PREPARANDO→PRONTO |

### US14 — por que continua Parcial

Backend real está completo e testado para os dois recursos (WhatsApp via
Zernio, issue #30; Google Calendar/Tasks via OAuth, issue #31/TD23) e a UI
real de conectar/configurar/desconectar também (issue de UI real de
Recursos, PR #42) — incluindo desconexão *provider-aware* real (não só
local) para os dois. A criptografia das credenciais Google tem uma
implementação production-grade (`GoogleCloudKmsCipher`, issue de KMS, PR
#43). Mesmo assim, **US14 não pode ser marcada Done** porque:

1. **Nenhum cenário foi validado contra um provedor real** (conta de
   teste Zernio, conta de teste Google Cloud) — só contra HTTP mockado em
   testes automatizados. `docs/technical/23-integrations-homologation.md`
   registra o roteiro completo, mas nenhuma linha da tabela está PASS
   ainda (issue de homologação, aberta, sem credenciais disponíveis neste
   ambiente).
2. **`REAL` + `CONNECTED` nunca foi observado de fato** — só simulado via
   fake HTTP. "US14 só pode ser Done se REAL + CONNECTED observado" é
   um critério explícito desta revisão que não está satisfeito.
3. O provider `gcp-kms` da criptografia também não foi validado contra um
   projeto GCP real pela mesma razão.

O que **está** garantido, e testado: simulação nunca satisfaz o
obrigatório em produção (TD19, preservado sem alteração em toda a sprint);
a UI nunca declara sucesso antes de confirmação real do backend; nenhum
segredo é exposto ao frontend em nenhum momento.

## 4. Histórias — Track B

| Story | Título | Status | Evidência |
|---|---|---|---|
| US77 | Visualizar Landing Page | **Done** | `LandingPage.tsx`, redesign PR #35/#36, responsiva 360–1440 |
| US78 | Iniciar diagnóstico de equipe | **Done** | `DiagnosticPage.tsx`, sobrevive a hard reload (issue #28, PR #32) |
| US79 | Informar necessidades da empresa | **Done** | Formulário de diagnóstico, persistido em `sessionStorage` |
| US80 | Priorizar problemas da empresa | **Done** | Etapa de priorização do diagnóstico |
| US81 | Gerar equipe recomendada | **Done** | `recommendation-engine.ts`, determinístico e versionado (`ruleVersion`) |
| US82 | Visualizar disponibilidade dos Braços recomendados | **Done** | Fonte única de Catalog Availability reaproveitada |
| US83 | Registrar lead interessado | **Aceito, com ressalva de PD6** | Ver abaixo |

### US83 — aceito, mas REAL continua bloqueado por PD6

A implementação está aceita: captura de lead sem criar conta/tenant,
persistência fora do tenant autenticado, funil mensurável via
`GrowthAnalytics` sem PII em eventos. `public-launch-gate.spec.ts` testa
explicitamente que o modo de captação (`DISABLED`/`SYNTHETIC`/`REAL`)
respeita o gate: **captação `REAL` de lead permanece bloqueada até
validação jurídica/compliance** (PD6 — "PRODUCT DIRECTION CONFIRMED /
LEGAL VALIDATION REQUIRED" em `sprint-02.md`). Isso não é uma dívida de
Engenharia — é um gate de Produto/Jurídico explicitamente fora do
controle desta entrega.

## 5. Carry-over

Nenhuma história planejada da Sprint 02 foi carregada para a Sprint 03
sem implementação. A única pendência formal é a validação de homologação
de US14 (issue dedicada, §3) — não uma história em si, mas um requisito
de evidência para fechar uma história já implementada.

## 6. Decisões técnicas (TD19–TD24)

Registradas em `docs/technical/17-technical-decisions.md`:

- **TD19** — guard de produção: `SIMULATED` nunca satisfaz Recursos em
  produção. Preservada sem alteração durante toda a sprint, inclusive nas
  quatro extensões de escopo de US14.
- **TD20/TD21** — RLS de lookup público (renumeração de decisões
  anteriores da própria sprint, sem mudança de conteúdo).
- **TD22** — WhatsApp real via Zernio: módulo isolado, só escreve na
  `Integration` que TD19 já protege.
- **TD23** — Google: `GoogleConnection` compartilhada (uma autorização
  OAuth), nunca duas fontes de verdade do mesmo refresh token.
- **TD24** — KMS production-grade: Google Cloud KMS via cliente REST+JWT
  próprio (sem SDK oficial novo), ciphertext versionado (nunca migração
  "big bang").

## 7. Dívidas conhecidas

1. **Homologação real não executada** (WhatsApp e Google) — sem
   credenciais de provedor neste ambiente de desenvolvimento. Issue
   dedicada aberta, com roteiro completo documentado.
2. **KMS não validado contra GCP real** — mesma causa raiz do item 1.
   Nenhum dado de produção foi migrado (não há dados reais a migrar
   ainda).
3. **Acessibilidade** — padrões semânticos (`aria-*`/`role`) aplicados em
   19 arquivos do frontend, mas **sem auditoria automatizada** (axe/
   Lighthouse) integrada à suíte. Não é um "Done" completo do critério de
   sucesso de acessibilidade da sprint — é aceitável como dívida não-
   bloqueante, não como concluído.
4. **Segurança de sessão** (herdada da Sprint 01, nunca endereçada nesta
   sprint): JWT em `localStorage`, bcryptjs para hashing — gate já
   registrado no `sprint-01-review.md` §8 como pendente "antes de piloto
   externo ou produção real com dados de clientes", continua pendente.
5. **`npm run lint`** continua indisponível no workspace `apps/api`
   (ESLint não instalado) — débito pré-existente, não introduzido nem
   resolvido nesta sprint, documentado desde os PRs de Zernio/Google.

## 8. Launch Gates

| Gate | Estado |
|---|---|
| PD6 — Privacidade do lead | **PRODUCT DIRECTION CONFIRMED / LEGAL VALIDATION REQUIRED** — desenvolvimento liberado e entregue; captação `REAL` segue bloqueada até validação jurídica |
| PD7 — Autonomia (recomendação vs. teto) | **RESOLVED** — tratados como propriedades distintas, mesmo com valores coincidentes no Braço Atendimento v1 |
| TD19 — guard de produção | **Preservado**, sem exceção, em toda a sprint |
| Security Hardening (herdado Sprint 01) | **Ainda pendente** — não é gate desta sprint, mas continua bloqueando piloto externo/dados reais |

## 9. Evidências

- **Backend (`apps/api`):** 177 testes unitários (21 suítes) + 78 testes
  e2e contra PostgreSQL real com RLS (5 suítes) — todos passando no SHA
  base desta revisão. `tsc --noEmit` e `nest build` limpos.
- **Frontend (`apps/web`):** 35 testes automatizados (vitest) passando.
  `tsc -b` e `vite build` limpos.
- **Visual:** Track A e Track B validados em Compact (360/380px) e
  Expanded (1440px) ao longo da sprint (PRs #20, #21, #35, #36, #42) —
  a UI real de Recursos foi revalidada nesta revisão especificamente
  (screenshots Playwright, 1440px e 380px, estado obrigatório/conectado/
  erro gracioso).
- **RLS/multi-tenancy:** testado com negativos reais (duas empresas,
  tentativa de acesso cruzado) em todos os módulos novos da sprint
  (Zernio, Google, GCP KMS não se aplica — não tem estado por tenant).

## 10. Homologação

**Nenhum cenário foi executado contra um provedor real** — ver
`docs/technical/23-integrations-homologation.md` para o roteiro completo
(14 cenários Zernio, 13 cenários Google) e a issue dedicada para
acompanhamento. Esta é a principal razão pela qual US14 permanece Parcial
apesar do trabalho de implementação estar completo.

## 11. Decisão

US07–US13 e US15–US17: **8/11 histórias Track A Done**, sem ressalva.
US14: **Parcial** (não Done — ver §3). US77–US82: **6/7 histórias Track B
Done**, sem ressalva. US83: **aceito, com o gate de PD6 explícito, não
resolvido por esta sprint**.

Como nem todas as histórias planejadas estão genuinamente Done (US14 em
Track A, o recurso obrigatório da própria sprint), o critério de sucesso
"US07–US17 Tech Ready" (Tech Ready, não Done) segue satisfeito, mas
alguns critérios de sucesso de produto/qualidade da sprint (`sprint-
02.md`, "Critérios de sucesso") — nomeadamente "recursos obrigatórios
bloqueiam corretamente" (satisfeito) versus a expectativa implícita de
conexão real ponta a ponta — dependem da homologação pendente.

> **SPRINT 02 NÃO PODE SER DECLARADA "ACCEPTED AND CLOSED" AINDA.**

A recomendação de Engenharia é:

> **SPRINT 02 ACCEPTED WITH ONE OPEN ITEM (US14 homologação)**

isto é: aceitar o trabalho entregue como correto e completo em tudo que
depende só de Engenharia, mas manter formalmente aberto o fechamento de
US14 — e por extensão o fechamento total da sprint — até a issue de
homologação ser executada com credenciais reais (issue dedicada,
acompanhamento fora desta sprint se necessário, já que depende de
provisionamento externo, não de mais trabalho de código).

## 12. Aprendizados

- Separar "backend real" (issues #30/#31) de "UI real" (issue desta
  revisão) de "criptografia production-grade" (issue desta revisão) em
  issues distintas, cada uma com PR próprio pequeno, permitiu revisão
  incremental sem nenhuma PR gigante — e deixou claro, em cada etapa,
  exatamente o que ainda faltava para Done real (nunca "parece pronto,
  mas não é").
- O padrão de módulo isolado por integração (`integrations/<provider>/`,
  cliente HTTP próprio, config própria, DI tokens próprios) se replicou
  sem atrito da terceira vez (Zernio → Google → GCP KMS) — vale manter
  como convenção padrão do repositório para qualquer integração externa
  futura.
- "REAL + CONNECTED observado de fato" precisa ser um critério de
  aceite explícito desde o início de qualquer issue de integração —
  senão o trabalho de implementação (genuinamente completo) pode ser
  confundido com a história estar Done.
- O gate de PD6 (privacidade do lead) funcionando como um *fail-closed*
  testado automaticamente (`public-launch-gate.spec.ts`) — não só uma
  política documentada — evitou qualquer risco de captação real
  acidental antes da validação jurídica.

## 13. Sprint 03 — Recomendação

**Recomendo iniciar o refinamento da Sprint 03**, com duas ressalvas
explícitas de sequenciamento:

1. A homologação de US14 (issue dedicada) não bloqueia o *refinamento*
   de Sprint 03 — é um item de acompanhamento externo (credenciais),
   não uma dependência técnica do próximo trabalho de Engenharia — mas
   deveria ser resolvida antes de qualquer *piloto externo* que dependa
   de WhatsApp/Google reais.
2. Security Hardening (JWT/hashing, herdado da Sprint 01) segue como
   gate explícito antes de qualquer dado real de cliente — deve entrar
   no refinamento de Sprint 03 ou ser endereçado antes dela, a critério
   do PO.

Nenhuma work-in-progress de Runtime/Policy Engine foi iniciada nesta
sprint (fora de escopo confirmado em todas as issues de integração) — a
Sprint 03 é o primeiro ponto natural para essa decisão de Produto, se
for a prioridade.
