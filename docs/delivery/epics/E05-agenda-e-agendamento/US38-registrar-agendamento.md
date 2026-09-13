# US38 — Registrar agendamento

**Épico:** E05 — Agenda e Agendamento  
**Prioridade:** P0  
**Sprint planejada:** Sprint 04

## Contexto
Esta história detalha a capacidade **registrar agendamento**.

## História de usuário
Como **funcionário digital**, quero **registrar agendamento**, para **transformar atendimento em agendamento confiável**.

## Critérios de aceitação
- [ ] A capacidade 'Registrar agendamento' pode ser executada no fluxo previsto.
- [ ] O resultado fica persistido e visível quando aplicável.
- [ ] Impedimentos são apresentados de forma compreensível e acionável.
- [ ] Regras, limites e permissões são respeitados.

## Regras de negócio
- Usar disponibilidade da agenda configurada.
- Não criar conflito de agenda.
- Calendar é recurso operacional.

## Dependências
- PRD aplicável.
- E05 — Agenda e Agendamento.
- Configurações e permissões necessárias.

## Fora do escopo
- Mudanças de produto não aprovadas.
- Decisões técnicas de implementação.
- Customização específica sem decisão de produto.

## Design

        Esta história está sujeita ao gate:

        > **Product Ready + Design Ready + Tech Ready**

        ### Referências

        - `docs/design/flows/05-scheduling.md`
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
- `docs/delivery/epics/E05-agenda-e-agendamento/epic.md`
