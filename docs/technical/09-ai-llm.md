# BRAÇO — IA / LLM

## 1. Provider

**Anthropic Claude**, via API oficial. Modelo específico é parametrizável
por ambiente/funcionário (não hardcoded), pois modelos evoluem mais rápido
que o ciclo de release do produto.

## 2. Camada de abstração

Todo acesso ao LLM passa por uma interface interna própria
(`LLMProvider.complete(prompt, tools, schema)`), nunca chamado diretamente
pelo domínio (`08-digital-employee-runtime.md`). Objetivo: trocar modelo,
ajustar parâmetros de custo/latência ou (no limite) trocar de provedor sem
tocar em nenhum módulo de negócio. Isso é decisão técnica de baixo custo
agora e alto custo de corrigir depois se pulada.

## 3. Tool/function calling

O Runtime usa function calling nativo do modelo para propor ações
estruturadas (seção 6 de `08-digital-employee-runtime.md`). O modelo nunca
recebe permissão irrestrita de tools — o conjunto exposto varia por
`EmployeeType` e é filtrado antes mesmo de chegar ao Policy Engine.

## 4. Prompts e contexto de sistema

- **System prompt** é montado dinamicamente a partir do `WorkManual`
  estruturado (não um texto único editado à mão por empresa) — isso garante
  que mudanças nas telas de preparação (US07–US15) se refletem
  automaticamente no comportamento, e que o mesmo dado usado para validar
  Regras/Limites no Policy Engine é o dado usado para instruir o modelo (uma
  única fonte de verdade).
- Versionamento do **template** de construção do prompt (não do conteúdo por
  empresa) é necessário para poder correlacionar mudanças de comportamento
  a mudanças de prompt em observabilidade.

## 5. RAG — não necessário no MVP

O Manual de Trabalho de um funcionário é um documento estruturado pequeno
(poucos KB), cabe inteiro no contexto do modelo. RAG (busca vetorial)
resolveria um problema que o produto não tem ainda: uma base de
conhecimento grande demais para caber em contexto (ex.: um catálogo com
milhares de produtos, uma base extensa de FAQ). **Decisão: adiar RAG.**
Reavaliar quando um cliente tiver catálogo de produtos/serviços grande o
suficiente para não caber no contexto de forma eficiente — well-defined
gatilho, não “quando parecer sofisticado”.

## 6. Memória

Ver `08-digital-employee-runtime.md`, seção 7: memória de curto prazo é o
histórico da conversa; memória operacional de longo prazo é dado estruturado
no Postgres (perfil do cliente, histórico), não memória vetorial do modelo.
Evita o anti-padrão de "memória mágica" que dificulta auditoria e LGPD
(dado pessoal armazenado de forma opaca dentro de embeddings).

## 7. Structured outputs e validação

Toda saída do modelo que vira ação (tool call) é validada contra um schema
(Zod/JSON Schema) antes de chegar ao Policy Engine. Saída fora do schema é
tratada como falha do modelo (retry com instrução mais estrita, ou
fallback), nunca é executada "melhor esforço".

## 8. Guardrails

- Conjunto de tools restrito por `EmployeeType` (arquitetural, não apenas
  por prompt).
- Policy Engine determinístico como autoridade final (não confia no
  julgamento do modelo sobre autonomia).
- **Variáveis de template de WhatsApp nunca são geradas livremente pelo
  LLM** (`docs/design/19-whatsapp-template-library.md`, PD2): o modelo pode
  identificar a intenção (ex.: "este é um caso de recuperação de
  oportunidade"), mas o preenchimento de `{{nome}}`, `{{empresa}}`,
  `{{servico}}`, `{{data}}`, `{{horario}}` etc. vem sempre de dados
  estruturados e validados (`Customer`, `Appointment`, `Product/Service`),
  nunca de texto inventado pelo modelo — reforço direto do princípio de
  Guardrails determinísticos já descrito acima.
- Filtro de conteúdo para tópicos explicitamente fora do escopo (PRD 01,
  seção 20 — diagnóstico, decisão médica, condição não autorizada): tratado
  como `Rule` de bloqueio, não como instrução de prompt isolada — reforço em
  duas camadas (prompt + policy) para reduzir risco de "jailbreak" via
  conversa do cliente.
- Toda resposta ao cliente passa por verificação de que não menciona
  infraestrutura/IA de forma que contradiga a política de transparência
  (ex.: nunca afirmar ser humano) — parte do prompt de sistema, reforçada
  por revisão amostral em observabilidade.

## 9. Fallback

| Falha | Comportamento |
|---|---|
| Timeout/erro do provider LLM | Retry com backoff curto; se persistir, mensagem de espera ao cliente + `Alert`; nunca falha silenciosamente sem responder |
| Resposta fora de schema | Uma tentativa de correção automática; se falhar de novo, escalar para humano (🔴 por padrão de segurança) |
| Modelo indisponível (outage do provider) | Circuit breaker; atendimento entra em modo "aguardando humano" com aviso claro ao cliente, evitando silêncio |

## 10. Custos

Custo por chamada (tokens de entrada/saída) é registrado por chamada no
`WorkEvent` (`llm_cost_usd`), agregável por empresa e por funcionário — é a
base tanto de observabilidade financeira interna quanto de eventual modelo
de precificação por volume no futuro (`docs/07-business-model.md` já prevê
"níveis de capacidade/volume quando necessário").

Mitigação de custo: contexto minimalista (seção 4), sem RAG desnecessário,
sem reprocessamento redundante — o desenho do Runtime já evita os principais
vetores de custo excessivo.

## 11. Latência

Meta: resposta ao cliente em segundos (não é chat instantâneo tipo digitação
ao vivo — é assíncrono via WhatsApp). Chamadas ao LLM e a integrações
externas (checar agenda) podem ser paralelizadas quando não há dependência
entre elas (ex.: gerar texto de saudação enquanto valida disponibilidade).

## 12. Observabilidade de IA

Ver `11-observability.md` — toda chamada ao LLM é uma linha auditável, nunca
uma caixa preta.

## 13. Por que isso não expõe IA como modelo mental do produto

A UI nunca apresenta "prompt", "modelo" ou "IA" como conceito central (regra
de `docs/design/01-design-principles.md` e `13-content-design.md`). O
Runtime, tecnicamente, tampouco trata o LLM como o "cérebro" com autoridade
final — o Policy Engine é. Isso mantém consistência entre a experiência
percebida ("estou administrando uma função") e a arquitetura real.
