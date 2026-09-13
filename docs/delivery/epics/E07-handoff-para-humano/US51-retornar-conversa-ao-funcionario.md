# US51 — Retornar conversa ao funcionário

**Épico:** E07 — Handoff para Humano  
**Prioridade:** P1  
**Sprint planejada:** Sprint 05

## Contexto
Esta história detalha a capacidade **retornar conversa ao funcionário**.

## História de usuário
Como **funcionário digital**, quero **retornar conversa ao funcionário**, para **encaminhar situações que exigem uma pessoa**.

## Critérios de aceitação
- [ ] A capacidade 'Retornar conversa ao funcionário' pode ser executada no fluxo previsto.
- [ ] O resultado fica persistido e visível quando aplicável.
- [ ] Impedimentos são apresentados de forma compreensível e acionável.
- [ ] Regras, limites e permissões são respeitados.

## Regras de negócio
- Handoff preserva contexto.
- O cliente deve saber que foi encaminhado.
- Intervenção humana é parte da operação.

## Dependências
- PRD aplicável.
- E07 — Handoff para Humano.
- Configurações e permissões necessárias.

## Fora do escopo
- Mudanças de produto não aprovadas.
- Decisões técnicas de implementação.
- Customização específica sem decisão de produto.

## Design

        Esta história está sujeita ao gate:

        > **Product Ready + Design Ready + Tech Ready**

        ### Referências

        - `docs/design/flows/07-human-handoff.md`
- `docs/design/09-product-patterns.md`

        ### Design Ready

        - [ ] fluxo e interação definidos;
        - [ ] padrão M3/padrão BRAÇO identificado;
        - [ ] estados relevantes considerados;
        - [ ] comportamento responsivo considerado;
        - [ ] acessibilidade considerada.

## Definition of Done
- critérios atendidos;
- testes adequados;
- comportamento validado;
- documentação atualizada quando necessário;
- nenhuma mudança de produto feita silenciosamente.

## Referências
- `docs/prd/01-braco-atendimento.md`
- `docs/prd/02-plataforma-gerencial.md`
- `docs/delivery/epics/E07-handoff-para-humano/epic.md`
