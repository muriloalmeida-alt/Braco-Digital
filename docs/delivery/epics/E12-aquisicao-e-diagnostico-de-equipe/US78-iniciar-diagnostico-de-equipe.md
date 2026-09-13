# US78 — Iniciar diagnóstico de equipe

**Épico:** E12 — Aquisição e Diagnóstico de Equipe  
**Prioridade:** P1  
**Sprint:** Sprint 02 — Track B Growth  
**Product Ready:** YES  
**Design Ready:** YES  
**Tech Ready:** TECH READY WITH CAVEATS

## Contexto

O CTA principal deve abrir uma experiência curta e focada.

## História

Como **visitante**, quero **iniciar o diagnóstico sem criar conta**, para descobrir minha equipe recomendada com pouca fricção.

## Critérios de aceitação

- [ ] CTA Montar minha equipe inicia o diagnóstico.
- [ ] O diagnóstico informa progresso por passo.
- [ ] Não exige login, e-mail ou WhatsApp para começar.
- [ ] O usuário pode voltar sem perder respostas da sessão atual.
- [ ] Foco é movido adequadamente entre passos.
- [ ] Diagnostic Start é mensurável.

## Regras

- Lead form só aparece após o resultado.
- Uma pergunta principal por passo no mobile.

## Dependências

- US77.
- Estado temporário do diagnóstico.

## Fora do escopo

- Persistência entre dispositivos.
- Conta anônima.

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
