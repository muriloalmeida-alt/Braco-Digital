# US81 — Gerar equipe recomendada

**Épico:** E12 — Aquisição e Diagnóstico de Equipe  
**Prioridade:** P1  
**Sprint:** Sprint 02 — Track B Growth  
**Product Ready:** YES  
**Design Ready:** YES  
**Tech Ready:** PENDING ENGINEERING REVIEW

## Contexto

O valor central do diagnóstico é converter respostas em uma equipe coerente.

## História

Como **visitante**, quero **receber uma equipe recomendada**, para entender quais funções digitais podem resolver meus problemas.

## Critérios de aceitação

- [ ] O motor usa exclusivamente regras determinísticas documentadas.
- [ ] O resultado contém no máximo 3 Braços com score maior que zero.
- [ ] O ranking segue as regras e desempates aprovados.
- [ ] Cada Braço possui motivo textual determinístico.
- [ ] Scores internos não são exibidos.
- [ ] O resultado não força Atendimento quando ele não possui aderência.
- [ ] A versão da regra usada pode ser persistida com o diagnóstico.

## Regras

- LLM não decide recomendação.
- Resultado é reproduzível para os mesmos inputs.

## Dependências

- US79.
- US80.
- Catálogo de tipos.

## Fora do escopo

- IA/ML.
- Pricing.
- Quantidade de instâncias por função.

## Design

- `docs/prd/04-aquisicao-e-diagnostico-de-equipe.md`
- `docs/design/26-growth-landing-experience.md`
- `docs/design/27-team-diagnostic-model.md`
- `docs/design/28-growth-wireframes.md`

## Definition of Done

- critérios atendidos;
- responsive 380/768/1440;
- Light/Dark quando aplicável;
- acessibilidade;
- analytics de funil previstos pela história;
- testes adequados;
- nenhuma mudança silenciosa.
