# US82 — Visualizar disponibilidade dos Braços recomendados

**Épico:** E12 — Aquisição e Diagnóstico de Equipe  
**Prioridade:** P1  
**Sprint:** Sprint 02 — Track B Growth  
**Product Ready:** YES  
**Design Ready:** YES  
**Tech Ready:** PENDING ENGINEERING REVIEW

## Contexto

O visitante precisa saber o que pode começar agora sem confundir roadmap com oferta atual.

## História

Como **visitante**, quero **ver quais Braços recomendados estão disponíveis agora**, para saber qual próximo passo é realista.

## Critérios de aceitação

- [ ] Cada recomendação consulta disponibilidade na fonte oficial do catálogo.
- [ ] Atendimento é apresentado Disponível agora enquanto essa for a disponibilidade oficial.
- [ ] Os demais seguem Em breve enquanto essa for a disponibilidade oficial.
- [ ] `Em breve` não possui CTA de contratação.
- [ ] Se o primeiro recomendado estiver disponível, pode receber Comece por aqui.
- [ ] Se todos estiverem Em breve, a experiência não substitui por produto irrelevante.
- [ ] A mensagem Sua equipe ideal pode ter mais de um Braço. Você pode começar com 1 aparece somente quando há um recomendado disponível.

## Regras

- Não duplicar availability em regra de diagnóstico.
- Disponibilidade deve evoluir automaticamente com o catálogo.

## Dependências

- US81.
- Catalog Availability.

## Fora do escopo

- Waitlist específica.
- Promessa de data de lançamento.

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
