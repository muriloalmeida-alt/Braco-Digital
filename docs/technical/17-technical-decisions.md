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
