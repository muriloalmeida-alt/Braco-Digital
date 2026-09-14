# BRAÇO — Technical Decisions

Decisões puramente técnicas (não exigem aprovação de Produto/Design, mas
são registradas para rastreabilidade e para que mudanças futuras entendam o
raciocínio original).

---

## TD1 — Multi-tenancy: banco único com RLS por `company_id`

**Contexto:** produto multiempresa desde o MVP, equipe pequena.
**Opções:** banco único + RLS · schema por tenant · banco por tenant.
**Decisão:** banco único + RLS.
**Justificativa:** menor custo operacional e de migração para o volume
esperado de PMEs; RLS dá isolamento em nível de banco, não só de aplicação.
**Trade-offs:** tenants compartilham recursos de banco (sem isolamento de
performance entre empresas).
**Reversibilidade:** média — migrar um tenant específico para schema/banco
dedicado depois é possível sem mudar o domínio, desde que a camada de
repositório permaneça isolada do ORM (ver TD3).
**Impacto futuro:** sustenta a expansão para mais Braços por empresa sem
mudança estrutural.

---

## TD2 — Monólito modular no início, não microserviços

**Contexto:** equipe pequena, MVP com três domínios claros (gerencial,
runtime de atendimento, integrações).
**Opções:** monólito modular · microserviços desde o início.
**Decisão:** monólito modular (módulos NestJS com fronteiras de código
claras), com Runtime e App Service podendo rodar como processos separados
(mesma base de código, entrypoints diferentes) desde já para permitir
escala independente sem reescrita.
**Justificativa:** evita overhead operacional (deploy, observabilidade,
comunicação entre serviços) desnecessário no volume atual.
**Trade-offs:** requer disciplina de módulo para não acoplar domínios;
sem essa disciplina, separar em microserviços depois fica mais caro.
**Reversibilidade:** alta, se a disciplina de módulos for mantida.
**Impacto futuro:** caminho claro para extrair o Runtime Service como
processo/serviço independente quando o volume de atendimento justificar.

---

## TD3 — ORM: Prisma, isolado por camada de repositório

**Contexto:** equipe pequena sem DBA dedicado, TypeScript full-stack.
**Opções:** Prisma · Drizzle · SQL cru com query builder leve.
**Decisão:** Prisma, acessado só através de repositórios de domínio.
**Justificativa:** melhor ergonomia de migration e type-safety para o
perfil de equipe.
**Trade-offs:** menor controle fino de SQL que Drizzle/cru; mitigado por
permitir SQL raw pontual via Prisma quando necessário (ex.: queries de
agregação para métricas).
**Reversibilidade:** média-alta, graças ao isolamento por repositório.
**Impacto futuro:** troca de ORM não deveria exigir mudança em regras de
negócio.

---

## TD4 — LLM: Anthropic Claude atrás de `LLMProvider` próprio

**Contexto:** dependência crítica de um único provedor de IA.
**Opções:** acoplar diretamente ao SDK do provedor · camada de abstração
própria.
**Decisão:** camada de abstração própria.
**Justificativa:** modelos e provedores de IA evoluem rápido; o domínio
(Runtime, Policy Engine) não deve conhecer detalhes do provedor.
**Trade-offs:** pequeno custo de manutenção da camada de abstração.
**Reversibilidade:** alta.
**Impacto futuro:** permite trocar modelo/provedor, ou usar múltiplos
modelos por custo/latência, sem tocar em regras de negócio.

---

## TD5 — WhatsApp: BSP no MVP, não Cloud API direta

**Contexto:** necessidade de onboarding rápido de múltiplos números para
múltiplas empresas, equipe pequena sem operação dedicada de compliance de
mensageria.
**Opções:** WhatsApp Cloud API direta (Meta) · BSP (360dialog/Twilio/
Gupshup).
**Decisão:** BSP no MVP.
**Justificativa:** reduz tempo até o primeiro cliente ativo; abstrai parte
da complexidade operacional.
**Trade-offs:** custo por mensagem/assinatura mais alto que API direta em
escala.
**Reversibilidade:** média — mitigada pelo `MessagingAdapter` no
Integration Hub, que isola o domínio do provedor específico.
**Impacto futuro:** migração para Cloud API direta é uma otimização de
custo pura, avaliável quando o volume justificar.

---

## TD6 — Sincronização de Calendar: push notification + polling de reconciliação

**Contexto:** push notifications do Google Calendar expiram e não trazem
diff completo.
**Opções:** só polling · só push · híbrido.
**Decisão:** híbrido (push como gatilho primário, polling de baixa
frequência como rede de segurança).
**Justificativa:** equilibra custo de API, atualidade e resiliência a
canais de webhook perdidos/expirados.
**Trade-offs:** mais complexidade que uma única estratégia.
**Reversibilidade:** alta — é detalhe de implementação do
`ScheduleAdapter`.
**Impacto futuro:** nenhum bloqueio.

---

## TD7 — Frontend M3: Material Web Components + wrapper React + primitivos próprios para adaptativo

**Contexto:** M3 é Design System canônico obrigatório; ecossistema React
maduro de M3 "puro" ainda em evolução.
**Opções:** Material Web Components · MUI · construção própria sobre
tokens.
**Decisão:** Material Web Components como base, com wrapper React fino e
primitivos próprios apenas para padrões adaptativos ainda não bem cobertos.
**Justificativa:** maximiza fidelidade ao M3 real (requisito de Design)
sem recriar componentes que o M3 já resolve.
**Trade-offs:** mais esforço de integração inicial que adotar MUI direto.
**Reversibilidade:** média, isolada pela camada de wrapper.
**Impacto futuro:** detalhado em `13-frontend-m3-implementation.md`.

---

## TD8 — Observabilidade de domínio via `WorkEvent` append-only, não apenas logs técnicos

**Contexto:** necessidade de responder "o que o funcionário tentou fazer e
o que realmente aconteceu" como requisito de produto e auditoria.
**Opções:** log técnico genérico · tabela de domínio dedicada.
**Decisão:** tabela de domínio dedicada (`WorkEvent`), separada da stack de
observabilidade técnica.
**Justificativa:** é dado de produto (Work Timeline, relatórios) e de
compliance (auditoria), não apenas debug de engenharia — não pode viver só
em uma ferramenta de terceiros com retenção/formato fora do nosso controle.
**Trade-offs:** mais uma tabela de alto volume para gerenciar (índices,
particionamento).
**Reversibilidade:** baixa depois de populada em produção (mudar o schema
de auditoria histórica é custoso) — por isso desenhada com cuidado desde
`03-data-model.md`.
**Impacto futuro:** é a base de qualquer relatório e de qualquer futura
auditoria externa/LGPD.

---

## TD9 — Infraestrutura: PaaS/containers, não Kubernetes, no MVP

**Contexto:** equipe pequena sem SRE dedicado.
**Opções:** Kubernetes autogerenciado · PaaS orientado a container.
**Decisão:** PaaS (Fly.io/Render/ECS Fargate).
**Justificativa:** menor custo operacional, containers já preparam
migração futura se necessário.
**Trade-offs:** menos controle fino de infraestrutura.
**Reversibilidade:** alta — unidade de deploy (container) não muda.
**Impacto futuro:** nenhum bloqueio para escalar dentro de uma única
região.

---

## TD10 — Autenticação própria mínima no MVP, não provedor gerenciado de terceiro

**Contexto:** custo e velocidade para RBAC simples por empresa.
**Opções:** Auth0/Clerk gerenciado · implementação própria mínima.
**Decisão:** implementação própria mínima (e-mail+senha + OAuth Google
reaproveitado), atrás de uma fronteira `AuthProvider`.
**Justificativa:** suficiente para o RBAC do MVP, evita custo recorrente de
um provedor de auth desde o primeiro cliente.
**Trade-offs:** funcionalidades avançadas (MFA robusto, SSO enterprise)
exigiriam mais esforço próprio depois.
**Reversibilidade:** média-alta, se a fronteira `AuthProvider` for
respeitada.
**Impacto futuro:** migração para provedor gerenciado é possível quando
exigências de segurança/enterprise crescerem (ver R14 em
`15-technical-risks.md`).

---

## TD11 — Brand UI Foundation: `primary` do M3 fixado no hex de marca, demais tons algorítmicos

**Contexto:** aplicação da identidade visual oficial (Guia de Identidade
Visual BRAÇO Digital v1.0) antes da Sprint 02 — `docs/design/03-theme-
strategy.md`, `04-color-system.md`. Os critérios de aceite exigem que "Azul
BRAÇO é o CTA principal" de forma reconhecível, mas o algoritmo M3
(`@material/material-color-utilities`) deriva o tom 40 (role `primary`) a
partir do HCT do seed, que só coincide com o hex de entrada quando o
próprio seed já tem tom (L*) 40 — não é o caso de `#0B4F86`. Gerar o tom 40
puro do seed produzia `#286199`, visivelmente mais claro/saturado que a
marca.
**Opções:** (a) usar o tom 40 algorítmico, aceitando o desvio visual; (b)
fixar `--md-sys-color-primary` (light) literalmente em `#0B4F86` e deixar
só os tons derivados (container, dark scheme) algorítmicos; (c) reconstruir
a paleta inteira para que o tom 40 caia exatamente no seed.
**Decisão:** (b) — `primary` (light) é fixado no hex de marca;
`primaryContainer`/`onPrimaryContainer` e todo o Dark Scheme continuam
gerados pelo algoritmo a partir da mesma `TonalPalette` (mesmo hue/chroma).
**Justificativa:** contraste de `#0B4F86` com `onPrimary` branco é 8.5:1
(WCAG AAA) — fixar o tom não tem custo de acessibilidade, e é o único role
citado nominalmente como "CTA principal" nos critérios de aceite. (c) foi
descartado por exigir reimplementar a geração de tons, contrariando "M3
continua responsável pelos roles e estados" (`03-theme-strategy.md`).
**Por que `tertiary` (Verde Capacidade) NÃO recebeu o mesmo tratamento:**
o hex cru do seed (`#32B44A`) usado como texto sobre superfícies claras dá
~2.5:1 de contraste (reprova WCAG AA); o tom 40 algorítmico (`#006e22`) dá
~5.8:1. `tertiaryContainer` (fundo, não texto) já usa o hex de marca exato
(`#DDF5E2`, "success-background") porque ali o contraste é resolvido pelo
`onTertiaryContainer` escuro gerado pelo algoritmo.
**Trade-offs:** o mapeamento hue/chroma → tom deixa de ser 100% derivado
para o role mais visível (`primary`); qualquer reajuste de seed exige
conferir o hex fixo manualmente.
**Reversibilidade:** alta — é uma única linha no gerador
(`apps/web/scripts/generate-theme.mjs`); remover o override volta ao
comportamento 100% algorítmico.
**Impacto futuro:** nenhum bloqueio; documentado para que o próximo ajuste
de paleta (nova seed) reavalie se o desvio tom-40-vs-seed ainda existe
antes de decidir fixar ou não.

---

## TD12 — Manrope via Google Fonts (CDN) e Lucide via `lucide-react`, sem self-hosting

**Contexto:** `docs/design/05-typography.md` define Manrope (fallback
Inter) como tipografia oficial e deixa a forma de carregamento como decisão
de Engenharia; `docs/design/06-shape-elevation-iconography.md` define
Lucide como família de ícones preferencial para o produto web.
**Opções tipografia:** self-host dos arquivos de fonte no repositório ·
`<link>` para Google Fonts (mesmo mecanismo já usado para Roboto/Roboto
Flex na Sprint 01).
**Decisão tipografia:** manter Google Fonts via `<link rel="stylesheet">`
com `display=swap`, carregando Manrope (400/500/600/700/800) e Inter
(400/500/600/700) como fallback web antes da pilha de sistema.
**Justificativa:** consistente com o padrão já estabelecido na Sprint 01;
evita versionar/distribuir arquivos de fonte manualmente, que o próprio
PM/Design pediu para evitar ("não versionar nem compartilhar arquivos de
fonte manualmente se não for necessário").
**Opções iconografia:** SVGs próprios recortados manualmente · biblioteca
de ícones como dependência.
**Decisão iconografia:** `lucide-react` (`^1.45.0`) como dependência de
produção — ícones importados sob demanda como componentes React
tree-shakeable, tamanho controlado via prop (`size`), sempre com
`aria-hidden="true"` porque o label textual do status/ação já é o elemento
acessível (ícone nunca substitui o label, `06-shape-elevation-
iconography.md` §7).
**Trade-offs:** dependência de uma CDN externa em runtime para fontes (sem
fallback offline); uma dependência de terceiro a mais no bundle do
frontend para ícones (mitigado por ser tree-shakeable e ter apenas
`react` como peer dependency).
**Reversibilidade:** alta nos dois casos — trocar o `<link>` por self-host
não muda a variável `--md-ref-typeface`; trocar de biblioteca de ícones
fica isolado aos `import` de cada tela, sem API própria por cima.
**Impacto futuro:** nenhum bloqueio.

---

## TD13 — WorkManual: tabelas relacionais por domínio + autoridade de completude recomputada no backend

**Contexto:** Sprint 02 (Track A, US07-US17) — Technical Readiness em
`docs/technical/20-sprint-02-tech-readiness.md` §4/§10. O schema da
Sprint 01 modela `WorkManual.sections` como um JSON opaco com só
`status`; US07-US16 exigem conteúdo real (empresa, produtos, regras,
autonomia, pessoas, comunicação, recursos).
**Opções:** (a) continuar em JSON, um blob por seção; (b) tabela
relacional própria por domínio, com um serviço que recomputa a
completude de cada etapa a partir delas.
**Decisão:** (b). `WorkManual` vira um "cabeçalho" (status geral,
timestamps); o conteúdo vive em tabelas próprias (`ProductService`,
`EmployeeResponsibility`, `CompanyRule`, `EmployeeAutonomyPolicy`,
`EmployeeResponsible`, `EmployeeCommunicationStyle`, `Integration`) mais
novos campos em `Company`. Um `PreparationReadinessService` novo
recomputa o status de cada etapa a partir dessas tabelas sempre que algo
muda, e é a única autoridade sobre `PREPARANDO ⇄ PRONTO` — nunca um
campo cacheado isolado, nunca o frontend.
**Justificativa:** instrução explícita do PO/PM ("a autoridade de
readiness precisa existir no backend, não somente no frontend") e
necessidade de o Policy Engine (Sprint 03+) consultar regras/autonomia
com garantias transacionais e índices — não é possível avaliar isso
performaticamente parseando JSON a cada decisão (mesmo raciocínio já
antecipado em `03-data-model.md`, seção WorkManual).
**Trade-offs:** mais migrations/tabelas do que um blob único; exige que
toda mutação em qualquer etapa invoque o mesmo serviço de recomputo
(disciplina de código, não tecnicamente forçado pelo schema).
**Reversibilidade:** média — voltar a um blob JSON exigiria migração de
dados reais depois de a Sprint 02 estar em produção; seguir com tabelas
relacionais desde já evita essa migração futura.
**Impacto futuro:** é a mesma base de dados que o Policy Engine do
Runtime (Sprint 03+, `08-digital-employee-runtime.md`) vai consultar em
tempo real — construir relacional agora evita reescrita depois.

---

## TD14 — Teto de autonomia por responsabilidade: constante de código validada no backend, não só na UI

**Contexto:** Sprint 02, US11 — `docs/design/22-work-manual-content-
model.md` §8 exige "produto pode definir nível máximo permitido; gestor
pode ser mais conservador, nunca mais permissivo". Na versão original
desta TD, o valor exato desse teto por responsabilidade ainda não estava
tabulado separadamente da recomendação inicial (PD7,
`16-product-decisions-required.md`, então **PENDING PO/DESIGN
CONFIRMATION**).
**Opções:** (a) validar o teto só na UI (desabilitar opção mais
permissiva no formulário); (b) validar também no backend, com uma
constante por responsabilidade.
**Decisão:** (b), sempre. A UI pode (e deve) já impedir a seleção
inválida, mas o `PATCH` do backend revalida contra a mesma constante
antes de persistir — mesmo padrão de "nunca confiar só no frontend" já
aplicado a `PreparationReadinessService` (TD13).
**Justificativa:** autonomia é uma garantia de segurança do produto
("nunca mais permissiva que o limite"), não uma conveniência de UX —
merece a mesma defesa em profundidade que RLS já dá ao isolamento de
tenant.
**Trade-offs:** nenhum relevante — é validação de payload, custo
desprezível.
**Reversibilidade:** alta — é uma constante única reaproveitada nos dois
lados (idealmente compartilhada via um pacote/arquivo único para não
divergir UI vs. backend).
**Impacto futuro:** nenhum bloqueio.

**Atualização — PD7 RESOLVED (patch "Sprint 02 PD6/PD7 Closure"):** o
mecanismo acima está confirmado e **não muda** — a novidade é só o valor
de negócio, agora explícito. Duas correções ao desenho original desta
TD, ambas de nomenclatura/modelo, não de arquitetura:
- **Recomendação e teto são duas constantes distintas**
  (`RESPONSIBILITY_RECOMMENDED_AUTONOMY` e
  `RESPONSIBILITY_MAX_AUTONOMY`), não a mesma lida duas vezes — mesmo
  que, para o Braço Atendimento v1, os dois arrays tenham exatamente os
  mesmos valores nas 14 responsabilidades (tabela oficial em
  `docs/design/22-work-manual-content-model.md` §8). Isso já antecipa
  sem custo uma recomendação futura mais conservadora que o teto.
- **Mensagem de UI padronizada** para o nível bloqueado: "Este nível de
  autonomia não está disponível para esta responsabilidade." — a opção
  continua visível (não desaparece do seletor), só fica desabilitada,
  nunca dependendo apenas de opacity/cor.
- **US11 é TECH READY** (não mais "with caveats") — nenhuma parte do
  mecanismo de enforcement precisou mudar, só o dado que faltava.

---

## TD15 — Track B: terceiro modo de acesso a dados (público), com role de banco dedicada

**Contexto:** Sprint 02 (Track B) é o primeiro fluxo público e não
autenticado do produto com escrita de dados
(`20-sprint-02-tech-readiness.md` §7/§16). Hoje só existem dois modos de
acesso ao banco: `withTenant` (empresa ativa) e `withUser` (login, usado
no fluxo de auth). Nenhum dos dois serve para uma requisição sem tenant
e sem usuário.
**Opções:** (a) reaproveitar a role de aplicação existente e confiar
apenas na validação da camada de aplicação para as rotas públicas; (b)
criar uma terceira role de banco, dedicada ao caminho público, com
policies de RLS que só permitem `INSERT` em `leads` e `SELECT` em
`employee_types` — nenhuma outra tabela alcançável, nem em teoria.
**Decisão:** (b).
**Justificativa:** defesa em profundidade — este é o primeiro endpoint
público com escrita do produto; um bug de autorização na camada de
aplicação não deve conseguir, sozinho, ler dado de tenant. A mesma
filosofia que já justifica RLS como "última linha de defesa" para
multi-tenancy (TD1, `04-multi-tenancy.md` §4) se aplica aqui com um risco
ainda maior (a superfície é pública, não só multiempresa).
**Trade-offs:** mais uma role de banco para gerenciar/migrar; o
`PrismaService` ganha um terceiro helper (`withPublicAccess` ou
equivalente).
**Reversibilidade:** alta — é infraestrutura de acesso a dado, não
modelo de domínio; pode ser reforçada ou relaxada sem migração de dados.
**Impacto futuro:** qualquer endpoint público futuro (ex.: outras
landings/growth loops) reaproveita o mesmo mecanismo em vez de inventar
um novo por feature.

---

## TD16 — Motor de recomendação de Track B: função pura versionada em código, computada no servidor

**Contexto:** Sprint 02, US81 — `docs/design/27-team-diagnostic-model.md`
exige um motor determinístico, auditável e reproduzível, sem LLM.
**Opções:** (a) função pura em código, versionada via constante +
histórico do git, computada no cliente; (b) idem, computada no servidor;
(c) motor configurável em banco (tabela de regras/pesos editável sem
deploy).
**Decisão:** (b) — função pura (mesmo padrão de
`digital-employees/next-step.ts`, já testado unitariamente na Sprint 01),
mas **computada no backend**, atrás de `POST /public/diagnostics/
recommendation`, nunca no cliente.
**Justificativa:** computar no servidor evita duplicar a leitura de
Catalog Availability no cliente (reabriria o risco que o PRD 04 pede
para evitar — "o motor não possui sua própria cópia de Disponível/Em
breve") e não expõe a tabela de pesos no bundle JS sem necessidade. (c)
foi descartado por complexidade desnecessária no MVP — não há requisito
de mudar a regra sem deploy nesta sprint.
**Trade-offs:** qualquer ajuste de peso/regra exige deploy (aceitável no
MVP); nenhuma edição de regra pelo PM sem Engenharia.
**Reversibilidade:** alta — migrar de função em código para tabela
configurável é aditivo, não exige reescrever o contrato do endpoint
público.
**Impacto futuro:** a versão da regra (`rule_version`) já é persistida
por lead desde o v1, então uma futura migração para múltiplas versões
simultâneas (ex.: A/B) não perde histórico.

---

## TD17 — Analytics de Track B via eventos relayados pelo servidor, sem SDK de terceiro no MVP

**Contexto:** Sprint 02, PRD 04 §20 exige funil mensurável sem enviar PII
para analytics, sem definir fornecedor (decisão de Engenharia).
**Opções:** (a) SDK de analytics de terceiro carregado direto no
navegador (ex. GA4, Mixpanel); (b) endpoint próprio (`POST /public/
analytics/events`) que relaya para o pipeline de observabilidade já
existente (`11-observability.md`).
**Decisão:** (b) para o MVP da Sprint 02.
**Justificativa:** garante PII-scrubbing por allowlist de propriedades
no servidor (não depende de configurar corretamente um SDK de terceiro
client-side); zero custo/contrato novo; desacopla a escolha final de
fornecedor de funil (pode trocar o destino do relay sem tocar no
contrato de evento do frontend).
**Trade-offs:** sem dashboards prontos de um produto de analytics
dedicado — leitura do funil depende do pipeline de observabilidade
existente até uma ferramenta dedicada ser adotada.
**Reversibilidade:** alta — o contrato de evento (`{ event, sessionId,
properties }`) não muda ao trocar o destino do relay.
**Impacto futuro:** se o funil de Growth crescer em importância, plugar
um produto de analytics dedicado no `AnalyticsRelay` é aditivo.

---

## TD18 — Landing/diagnóstico de Track B como rota CSR da SPA existente (SEO tratado como caveat, não bloqueio)

**Contexto:** Sprint 02, US77 — `apps/web` é uma SPA Vite/React sem SSR.
A landing pública precisa decidir onde/como é servida
(`20-sprint-02-tech-readiness.md` §8/§15).
**Opções:** (a) nova rota client-side na mesma SPA; (b) aplicação
separada com SSR/SSG dedicado só para a landing.
**Decisão:** (a) para a Sprint 02.
**Justificativa:** menor esforço/risco para o MVP; a Sprint 02 não é
ainda uma aposta de aquisição orgânica por SEO (canal inicial é
direto/pago/social) — otimizar SEO agora seria antecipar um requisito
sem evidência de necessidade ainda.
**Trade-offs:** indexabilidade e Core Web Vitals ficam abaixo do que uma
página SSR/SSG entregaria; documentado explicitamente em
`20-sprint-02-tech-readiness.md` §15 como caveat, não bloqueio.
**Reversibilidade:** média — migrar só a rota da landing para
pré-renderização (ex. `vite-plugin-ssg`) no futuro é isolado, não exige
reescrever o restante da SPA autenticada.
**Impacto futuro:** se SEO orgânico virar métrica relevante de Growth,
a evolução natural é pré-renderizar essa rota específica, não migrar o
produto inteiro para SSR.

---

## TD19 — Guard de produção contra conexão simulada satisfazendo PRONTO

**Contexto:** Product + Product Design Review 01. US14 usa uma
confirmação simulada de conexão (`ResourcesService.confirmConnection`)
porque não há credenciais reais de BSP de WhatsApp/OAuth Google neste
ambiente (§24.2 do tech readiness). Sem nenhuma barreira adicional, essa
simulação já é suficiente hoje para `Recursos` ficar completo e o
funcionário chegar a `PRONTO` — aceitável em dev/teste, mas inaceitável
em produção: um funcionário não pode ficar `PRONTO` para atender
clientes reais com um WhatsApp que nunca foi de fato conectado.
**Opções:** (a) confiar só na UI para esconder a simulação em produção;
(b) uma flag de ambiente isolada só para "permitir simulação de
recursos"; (c) um campo de origem da conexão (`connectionMode`:
`SIMULATED`/`REAL`) no próprio `Integration`, combinado com detecção de
ambiente (`NODE_ENV`) consultada tanto no guard de escrita quanto na
autoridade de completude.
**Decisão:** (c).
**Justificativa:** (a) sozinha não resiste a uma chamada direta de API
(o próprio critério de aceite do Review exige isso). Uma flag dedicada
(b) resolveria o guard de escrita, mas não fecharia o caso de uma linha
`CONNECTED`/`SIMULATED` pré-existente (ex.: dado de seed/staging migrado
por engano) continuar contando como válida em produção — só recomputar
a completude a partir do dado persistido, não só bloquear a escrita,
cobre os dois ângulos. Mesmo princípio de "autoridade de backend" já
usado em `PreparationReadinessService` (TD13) e no teto de autonomia
(TD14): a verdade vem do dado relacional revalidado a cada leitura, não
de uma flag de UI.
**Mecanismo:**
- `Integration.connectionMode` (`SIMULATED` por padrão; `REAL`
  reservado para quando um callback de OAuth real existir).
- `ResourcesService.startConnection`/`confirmConnection` recusam com
  403 quando `isProductionEnvironment()` (`NODE_ENV === 'production'`)
  — verificado antes de abrir qualquer transação, então uma tentativa
  direta de API não grava nada.
- `PreparationReadinessService.computeRecursosStatus` exige
  `connectionMode === 'REAL'` quando em produção, além de `status ===
  CONNECTED` — roda em toda leitura/escrita, então cobre também dado
  legado.
- `GET /resources` expõe `canSimulateConnection` (calculado no backend)
  para a UI decidir o que mostrar — o frontend nunca infere sozinho se
  está em produção.
- `disconnect` continua permitido em qualquer ambiente (não é o alvo do
  guard, e uma conexão real futura também precisará ser desconectável
  em produção).
**Trade-offs:** mais um campo no modelo (`connectionMode`) que só ganha
significado quando o fluxo real de OAuth existir; até lá, toda linha
criada por este código é `SIMULATED` por construção.
**Reversibilidade:** alta — quando o fluxo real existir, ele é um
caminho novo (endpoint/callback próprio) que grava `connectionMode:
REAL`; não reaproveita `confirmConnection`.
**Impacto futuro:** qualquer integração real futura (BSP/Google) precisa
gravar `connectionMode: REAL` explicitamente para contar em produção —
isso já está documentado no código como o contrato esperado.

---

## TD20 — Bootstrap da role pública fora das migrações do Prisma; escrita do Lead sem `RETURNING`

**Contexto:** implementação de TD15 (role `braco_public`, Sprint 02
Track A). Dois problemas concretos surgiram só na implementação, não
previstos na análise de tech readiness:

1. `CREATE ROLE`/`GRANT <role> TO <role>` exigem o atributo `CREATEROLE`
   (ou superusuário). A role usada para rodar `prisma migrate deploy`
   (`braco` em dev; o usuário de app do Postgres gerenciado em
   staging/produção) não tem esse atributo — e não deveria precisar ter,
   por menor privilégio. Confirmado no ambiente de dev: `prisma migrate
   dev` falhou com `permission denied to create role`.
2. `tx.lead.create()` do Prisma sempre gera `INSERT ... RETURNING`, e o
   Postgres exige privilégio equivalente a `SELECT` sobre as colunas
   retornadas para aceitar `RETURNING` — mesmo dentro do próprio INSERT.
   Conceder esse `SELECT` a `braco_public` (mesmo com uma policy de RLS
   sem `USING` para SELECT, que corretamente bloqueia um `SELECT`
   avulso) ainda quebra a garantia pretendida: a primeira tentativa,
   com `SELECT` concedido, mudou o erro de "permission denied" para
   "new row violates row-level security policy" no próprio `RETURNING`
   — ou seja, ou se abre uma política de leitura (larga demais) ou o
   `RETURNING` simplesmente não funciona.

**Decisão:**
1. `CREATE ROLE braco_public` + `GRANT braco_public TO <role de app>`
   viram um script separado, **fora** de `prisma/migrations/`
   (`prisma/bootstrap/public-role.sql`), documentado para rodar uma
   única vez por ambiente, à mão, por um superusuário/admin do Postgres,
   **antes** do primeiro `prisma migrate deploy` que referencia a role.
   A migração normal (`sprint02_track_b_public_leads`) só concede
   privilégios sobre objetos que `braco` já possui — isso o dono de uma
   tabela sempre pode fazer, sem `CREATEROLE`.
2. `LeadsService.create` **não** usa `tx.lead.create()`. Gera `id`
   (`crypto.randomUUID()`) e `createdAt` (`new Date()`) na aplicação
   antes do INSERT, e grava a linha via `tx.$executeRaw` com um `INSERT`
   simples parametrizado, sem `RETURNING`. `braco_public` mantém
   exatamente os dois privilégios pretendidos por TD15 — `SELECT` em
   `employee_types`, `INSERT` em `leads` — nada além disso, comprovado
   pelo teste e2e negativo (`test/public-growth.e2e-spec.ts`, describe
   "Isolamento — role pública do banco").
**Justificativa:** manter o princípio de menor privilégio real (não só
"privilégio mínimo exceto quando o ORM pede mais") — abrir `SELECT`
para acomodar `RETURNING` reintroduziria exatamente o vetor que TD15
existe para fechar.
**Trade-offs:** `LeadsService` não pode usar a API idiomática do Prisma
Client para este único INSERT; a resposta ao cliente depende de valores
gerados na aplicação em vez de lidos de volta do banco (aceitável aqui:
`id`/`createdAt` não têm nenhuma lógica gerada só no servidor de banco).
Qualquer novo endpoint público de escrita futuro deve repetir o mesmo
padrão (gerar `id`/timestamps na aplicação, `INSERT` sem `RETURNING`)
enquanto a role pública não tiver `SELECT` em sua própria tabela de
escrita.
**Reversibilidade:** alta — se um dia for aceitável dar `SELECT` restrito
a `braco_public` (ex.: via uma view ou policy mais elaborada), a troca
para `tx.lead.create()` é local a `LeadsService`.
**Impacto futuro:** documentar isso explicitamente evita que uma
refatoração futura "simplifique" para `tx.lead.create()` sem perceber
que isso reabriria a superfície de leitura pública.

## TD21 — Captação de lead: três modos explícitos (DISABLED/SYNTHETIC/REAL), não um booleano

**Contexto:** Product + Product Design Review 01 apontou que
`PUBLIC_LEAD_CAPTURE_REAL=false` (booleano) ainda aceitava e persistia
PII real (nome, empresa, WhatsApp, e-mail), só marcando
`isSynthetic=true` no registro gravado. Um booleano com esse
comportamento não é fail-closed: dado pessoal real não vira sintético
por causa de uma flag, e "desligado" continuava significando "grava do
mesmo jeito, só rotula diferente".

**Decisão:** substituir o booleano por `PUBLIC_LEAD_CAPTURE_MODE` com
três valores (`getPublicLeadCaptureMode()`,
`apps/api/src/public/public-launch-gate.ts`):
- **DISABLED** (default fail-closed — valor ausente, vazio ou não
  reconhecido resolve para este modo): `POST /public/leads` rejeita a
  submissão inteira com 403 **antes** de qualquer normalização de
  WhatsApp, chamada ao motor de recomendação ou gravação — nenhuma PII
  é tocada, não só "não persistida ao final".
- **SYNTHETIC** (aceita o sinônimo `TEST`): formulário habilitado,
  grava `isSynthetic=true`.
- **REAL** (só quando o valor é explicitamente `REAL`): grava
  `isSynthetic=false`.

`GET /public/leads/capture-mode` expõe o modo atual como autoridade de
backend — o frontend nunca infere produção/captação sozinho, mesmo
princípio de `canSimulateConnection` do Track A (TD19 da branch
`feature/sprint-02-track-a-preparation`; ver nota de numeração abaixo).
Em `DiagnosticPage.tsx`, o passo `resultado` troca o CTA de captura por
um estado não capturante sob `DISABLED` (sem prometer contato
posterior), e o passo `contato` tem uma guarda independente que nunca
renderiza o formulário sob `DISABLED` — mesmo que o usuário force a
URL/estado de navegação client-side, sem depender só da decisão já
tomada em `resultado`.

**Justificativa:** fail-closed real precisa impedir a PII de entrar no
sistema, não só rotulá-la depois de já ter entrado. Três modos
nomeados (em vez de um booleano com um "modo verdadeiro implícito" e
um "modo falso que ainda captura") tornam o estado de produção
inequívoco e auditável — o valor da variável de ambiente já diz o que
vai acontecer, sem precisar ler o código para saber que `false` ainda
grava.

**Trade-offs:** mais um valor possível de configurar corretamente por
ambiente (três em vez de dois), mitigado pelo fail-closed no parsing —
qualquer valor não reconhecido cai em `DISABLED`, nunca em `SYNTHETIC`
ou `REAL` por acidente de digitação.

**Reversibilidade:** alta — é uma troca local ao parsing da variável de
ambiente e às leituras de `getPublicLeadCaptureMode()`/
`getLeadCaptureMode()`; nenhum dado gravado depende do mecanismo de
leitura do modo, só do valor de `isSynthetic` já persistido por linha.

**Impacto futuro:** a copy exibida em `SYNTHETIC`
("Ambiente de teste — use apenas dados fictícios.") e em `REAL` (ainda
a mesma frase provisória de antes desta revisão) **não** é aviso
jurídico aprovado e **não** deve ser tratada como a solução final de
PD6 — o aviso/copy/link legal definitivos para `REAL` ficam para
Produto/Design depois do Jurídico, antes de `REAL` ser ativado em
produção.

**Nota de numeração:** esta entrada nasceu como TD20 na branch
`feature/sprint-02-track-b-growth`, numerada antes do rebase sobre
`main` pós-merge de Track A. `feature/sprint-02-track-a-preparation`
tinha sua própria TD19 (guarda de produção contra conexão simulada,
Product Review 01) — as duas branches divergiram antes de qualquer uma
mergear em `main`, então numeraram de forma independente e colidiram
com a TD19 já existente nesta branch (TD15/bootstrap de role pública).
Resolução aditiva aplicada no rebase de Track B sobre a nova `main`
(depois do merge de #20): a TD19 de Track A (guarda de produção) foi
preservada como TD19; a TD19 original desta branch (bootstrap de role
pública/`RETURNING`) foi renumerada para TD20; esta entrada, que tinha
nascido como a segunda TD20 desta branch, virou **TD21** — nenhuma das
três teve seu conteúdo alterado, só o número desta e da de bootstrap de
role.

---

## TD22 — WhatsApp real via Zernio: módulo dedicado que só escreve na mesma `Integration` que TD19 já protege

**Contexto:** issue #30. O PO forneceu o contrato de API do Zernio
diretamente (rede deste ambiente não alcança `docs.zernio.com`) pedindo
a conexão real de WhatsApp por empresa via Meta Cloud API (nunca
WhatsApp Web/scraping). `05-whatsapp.md`/`01-architecture.md` descrevem
um `Integration Hub`/`MessagingAdapter`/`Runtime Service` que não
existe em código — a base real é o monólito NestJS simples já
implementado, com `Integration`/`ResourcesService`/
`PreparationReadinessService` do Track A (TD19) como única autoridade
de completude hoje.
**Opções:** (a) construir o `Integration Hub`/Runtime completo primeiro,
como pré-requisito; (b) encaixar o Zernio dentro de
`ResourcesService`/`confirmConnection`, reaproveitando o fluxo
simulado existente; (c) um módulo novo e isolado
(`integrations/zernio/`) com suas próprias tabelas, que só sincroniza a
mesma linha `Integration` (`type: WHATSAPP`) que TD19 já lê, sempre com
`connectionMode: REAL`.
**Decisão:** (c).
**Justificativa:** (a) inverteria a ordem pedida pela issue (entregar a
conexão real agora) para construir infraestrutura especulativa sem
necessidade comprovada — mesmo raciocínio de TD2/TD9 (não adiantar
infra que o volume atual não exige). (b) misturaria o caminho
`SIMULATED` (que TD19 explicitamente proíbe de contar como pronto em
produção) com o caminho `REAL` na mesma classe, arriscando o guard de
produção de TD19 por acidente de refatoração futura. (c) é exatamente o
"caminho novo (endpoint/callback próprio) que grava `connectionMode:
REAL`" que a seção "Reversibilidade" de TD19 já previa como o contrato
esperado — nenhuma mudança em `ResourcesService`/
`PreparationReadinessService` foi necessária.
**Mecanismo:** ver `docs/technical/21-zernio-whatsapp-integration.md`
para o detalhamento completo (modelo de dados, RLS, fluxos de
onboarding/callback/status/webhook/envio, variáveis de ambiente,
limitações conhecidas). Resumo dos pontos com maior superfície de
decisão:
- Confirmação real do provedor é obrigatória antes de `CONNECTED` — o
  callback do OAuth sozinho nunca marca a conexão como pronta, só uma
  consulta a `GET /whatsapp/number-info` faz isso (mesmo espírito do
  guard de TD19: a verdade vem de uma revalidação, não de um evento
  isolado).
- Duas extensões do padrão de RLS "lookup antes de conhecer o tenant"
  já usado em `company_memberships_self_lookup`: resolver `companyId`
  a partir de `accountId` (webhook) ou de `correlationId` (callback)
  via variáveis de sessão dedicadas, mais um `OR company_id IS NULL`
  explícito para o evento de webhook órfão (accountId desconhecido) —
  sem esse `OR`, o `WITH CHECK` implícito do Postgres rejeitaria a
  gravação de uma linha com `company_id NULL`.
- Idempotência reaproveita o modelo genérico `IdempotencyKey` (mesmo
  contrato já usado em US03/`digital-employees.service.ts`) em vez de
  um mecanismo paralelo só para Zernio.
- Processamento do webhook é síncrono, dentro da própria requisição
  HTTP — não há fila/Redis neste código; o contrato de dedup por
  `eventId` já é o que uma fila exigiria, então mover para assíncrono
  no futuro é uma troca local.
- Métricas são contadores in-process (`ZernioMetrics`), não um backend
  real de observabilidade (`11-observability.md` continua descrevendo
  a visão futura) — nomeados já na convenção que um `prom-client` real
  usaria.
**Trade-offs:** mais um módulo/conjunto de tabelas paralelo ao invés de
reaproveitar `Integration Hub` (que não existe) ou `ResourcesService`
(que existe, mas é o caminho simulado); aceito porque a alternativa era
construir infraestrutura especulativa ou arriscar o guard de produção
de TD19.
**Reversibilidade:** alta para o módulo em si (isolado, sem
dependências de outros domínios além de `Integration`/
`IdempotencyKey`); média para o webhook síncrono (migrar para fila é
local ao `ZernioWebhookService`, mas exige infraestrutura nova).
**Impacto futuro:** qualquer consumidor futuro de `ZernioMessage`
(resposta automática via Runtime/IA) precisa respeitar
`standby === true` (Meta Business Agent no controle da conversa) antes
de responder — a regra já está documentada e teste-coberta
(`shouldAutoRespond()`), mas nenhum consumidor existe ainda; isso é
trabalho futuro, fora desta issue.

---

## TD23 — Google Calendar + Tasks: uma `GoogleConnection` compartilhada, nunca duas fontes de verdade do mesmo refresh token

**Contexto:** issue #31. Produto fechou que Calendar e Tasks usam a
*mesma* autorização OAuth do Google (um único consentimento, um único
`refreshToken`), mas continuam aparecendo para o usuário como dois
recursos independentes (`Integration.type: GOOGLE_CALENDAR` e
`GOOGLE_TASKS`), cada um com seu próprio `connectionMode`/`status` lido
por `PreparationReadinessService` (TD19). Isso cria uma tensão
estrutural que o Zernio (TD22) não tinha: lá, uma linha `Integration`
por tipo já bastava porque cada `Integration` também era o dono técnico
da própria credencial. Aqui, gravar `refreshTokenEncrypted` em duas
linhas `Integration` (uma para Calendar, outra para Tasks) duplicaria a
mesma credencial como duas fontes de verdade — um refresh bem-sucedido
numa teria que ser propagado manualmente para a outra, e uma revogação
poderia deixar uma marcada `CONNECTED` enquanto a outra já está morta.
**Opções:** (a) duplicar o token nas duas linhas `Integration` e
sincronizá-las a cada refresh/revogação; (b) colapsar Calendar e Tasks
em um único recurso `Integration` (`type: GOOGLE_WORKSPACE`) tratado
como uma coisa só; (c) uma entidade técnica nova e compartilhada
(`GoogleConnection`, 1:1 com `Company`) dona exclusiva da credencial
OAuth, RLS-protegida, que as duas linhas `Integration` existentes
apenas *espelham* a cada operação relevante — a mesma separação
"infra de autorização vs. estado de recurso" que TD19 já assume ao
tratar `Integration` como a única fonte de verdade de completude.
**Decisão:** (c).
**Justificativa:** (a) é exatamente a duplicação de fonte de verdade
que a Decisão de Produto do brief da issue #31 proíbe explicitamente
("nunca duplicar refresh token como duas fontes de verdade
independentes") — além de criar uma janela de inconsistência real
entre refresh/revogação de uma cópia e da outra. (b) resolveria a
duplicação, mas quebraria a UI (`24-work-resources-ui-spec.md`) e a
regra de obrigatoriedade por responsabilidade (TD11/`resources.service.ts`),
que tratam Calendar e Tasks como bloqueios independentes — Calendar só
é obrigatório se alguma responsabilidade ativa exige agenda, Tasks só
se alguma exige follow-up; colapsar os dois exigiria reintroduzir essa
distinção em outro lugar, sem ganho real. (c) preserva `Integration`
como a única fonte lida por `PreparationReadinessService`/TD19 (zero
mudança nesse serviço) e isola toda a complexidade de OAuth
compartilhado — tokens, expiração, refresh, revogação — numa única
tabela e serviço, na mesma lógica de isolamento por módulo que TD22 já
estabeleceu para o Zernio.
**Mecanismo:** ver `docs/technical/22-google-workspace-integration.md`
para o detalhamento completo. Resumo dos pontos com maior superfície de
decisão:
- `GoogleConnection` guarda a credencial (`accessTokenEncrypted`,
  `refreshTokenEncrypted`, `tokenExpiresAt`, `grantedScopes`) e o
  estado técnico da autorização; `Integration` continua guardando
  `status`/`connectionMode`/`externalAccountRef` por recurso
  (`calendarId` ou `taskListId`) — nenhum dos dois lê o campo que é
  responsabilidade do outro.
- Um recurso só vira `connectionMode: REAL` + `status: CONNECTED` após
  validação real contra a API do Google (accessRole do calendário
  selecionado; existência confirmada da lista de tarefas) — nunca só
  porque o callback OAuth teve sucesso, mesmo espírito de TD22
  ("confirmação real do provedor é obrigatória antes de `CONNECTED`").
- Falha definitiva de refresh ou revogação degrada a `GoogleConnection`
  e força todo recurso Google ativo (`Integration` correspondente) para
  `NEEDS_ATTENTION` — nunca deixa um recurso `CONNECTED` sem uma
  credencial válida por trás.
- Desconexão é ciente do compartilhamento: desconectar Calendar não
  revoga a `GoogleConnection` enquanto Tasks continuar ativo (e
  vice-versa); só quando nenhum recurso Google permanece conectado o
  serviço tenta revogar (best-effort) e invalida a credencial
  compartilhada.
- RLS de `google_oauth_attempts` estende o padrão "lookup antes de
  conhecer o tenant" de TD22/`company_memberships_self_lookup`
  (`company_id = current tenant OR id = attempt em lookup`);
  `google_connections` não precisa dessa extensão porque o Google nunca
  entrega nada — nem o callback — sem um `state` já correlacionado a um
  `companyId` conhecido.
- Criptografia de credencial usa uma abstração (`CredentialsCipher`)
  com um campo explícito `isProductionGrade: boolean` — a implementação
  disponível hoje (`EnvKeyAesGcmCipher`, chave simétrica via variável de
  ambiente) é real (AES-256-GCM, nunca texto plano em banco/log) mas
  deliberadamente marcada `isProductionGrade: false`, para nunca ser
  confundida com a exigência de KMS gerenciado de
  `10-security-lgpd.md` §4.
**Trade-offs:** mais uma tabela e mais uma camada de indireção
(`GoogleConnection` → duas `Integration`) do que o modelo mais simples
do Zernio (uma `Integration` = uma credencial); aceito porque é a única
opção que respeita simultaneamente "um OAuth só" (Produto) e "uma única
fonte de verdade de completude" (TD19) sem duplicar token.
**Reversibilidade:** alta — `GoogleConnection` é aditiva e isolada
(nenhuma mudança em `ResourcesService`/`PreparationReadinessService`);
trocar `EnvKeyAesGcmCipher` por um KMS real é local à implementação de
`CredentialsCipher`, sem mudar o contrato usado pelo resto do módulo.
**Impacto futuro:** qualquer trabalho futuro de uso operacional real
(criar/reagendar/cancelar evento via Runtime, execução de follow-up via
Tasks, sincronização periódica, canais push/watch do Calendar) fica
fora do escopo da issue #31 por decisão de Produto, mas pode ser
construído sobre `GoogleConnection`/`GoogleApiClient` sem precisar
tocar no fluxo de OAuth/seleção de recurso aqui descrito.
