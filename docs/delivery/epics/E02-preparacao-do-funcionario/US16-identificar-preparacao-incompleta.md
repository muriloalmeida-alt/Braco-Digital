# US16 — Identificar preparação incompleta

**Épico:** E02 — Preparação do Funcionário  
**Prioridade:** P0  
**Sprint planejada:** Sprint 02  
**Product Ready:** YES  
**Design Ready:** YES  
**Tech Ready:** TECH READY

## Contexto

O gestor precisa localizar rapidamente o que impede o Manual de ficar
pronto.

## História de usuário

Como **gestor**, quero **ver quais etapas ainda estão incompletas e o que
falta**, para que **eu consiga terminar a preparação sem procurar erros
escondidos**.

## Critérios de aceitação

- [ ] O Overview mostra X de 8 etapas completas.
- [ ] Cada etapa mostra Não iniciada, Em andamento ou Completa em texto.
- [ ] O próximo item recomendado é a primeira etapa incompleta.
- [ ] A Revisão aparece Bloqueada enquanto houver incompletude.
- [ ] A origem de toda pendência bloqueante é identificável.
- [ ] Pendência de recurso aponta para Recursos.
- [ ] Campo opcional vazio nunca bloqueia.
- [ ] Nenhuma pendência depende só de cor.
- [ ] Com 8 completas, mostra Seu Manual está pronto para revisão.

## Regras de negócio

- Não esconder requisito obrigatório.
- Progresso usa contagem, não percentual.
- Review permanece explícito.

## Dependências

- US07–US14 definem completude.

## Fora do escopo

- Métricas de produtividade.
- Gamificação.

## Design

Gate:

> **Product Ready + Design Ready + Tech Ready**

### Referências

- `docs/design/flows/02-preparation.md`
- `docs/design/22-work-manual-content-model.md`
- `docs/design/23-preparation-experience-spec.md`

### Design Ready

- [x] fluxo definido;
- [x] campos/conteúdo definidos;
- [x] obrigatoriedade definida;
- [x] validação definida;
- [x] estados definidos;
- [x] responsividade definida;
- [x] acessibilidade considerada;
- [x] Brand UI Foundation aplicável.

## Definition of Done

- critérios atendidos;
- testes adequados;
- autosave/estado validados quando aplicável;
- Compact/Medium/Expanded validados;
- acessibilidade validada;
- documentação atualizada quando necessário;
- nenhuma mudança de produto feita silenciosamente.

## Referências de Produto

- `docs/prd/01-braco-atendimento.md`
- `docs/prd/02-plataforma-gerencial.md`
