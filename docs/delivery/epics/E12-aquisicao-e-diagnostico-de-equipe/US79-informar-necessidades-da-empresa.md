# US79 — Informar necessidades da empresa

**Épico:** E12 — Aquisição e Diagnóstico de Equipe  
**Prioridade:** P1  
**Sprint:** Sprint 02 — Track B Growth  
**Product Ready:** YES  
**Design Ready:** YES  
**Tech Ready:** PENDING ENGINEERING REVIEW

## Contexto

O motor precisa de dados estruturados e simples.

## História

Como **visitante**, quero **informar meu perfil e o trabalho que está ficando para depois**, para receber uma recomendação relevante.

## Critérios de aceitação

- [ ] O visitante informa Segmento e Tamanho da equipe.
- [ ] O visitante seleciona uma ou mais necessidades aprovadas no PRD.
- [ ] Não é possível avançar sem pelo menos uma necessidade.
- [ ] Volume é coletado em faixas aprovadas.
- [ ] Respostas são estruturadas, sem campo aberto obrigatório.
- [ ] Cada passo concluído pode ser medido sem enviar PII aos eventos.

## Regras

- Segmento/tamanho/volume qualificam, mas não inventam recomendação no MVP.
- As opções de necessidade são controladas por Produto.

## Dependências

- US78.
- Modelo de diagnóstico.

## Fora do escopo

- Pesquisa longa.
- Campos financeiros.
- Diagnóstico via chat.

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
