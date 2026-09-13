# US22 — Retomar funcionário

**Épico:** E03 — Ativação  
**Prioridade:** P1  
**Sprint planejada:** Sprint 05

## Contexto
Esta história detalha a capacidade **retomar funcionário**.

## História de usuário
Como **gestor**, quero **retomar funcionário**, para **controlar com segurança o ciclo de vida do funcionário**.

## Critérios de aceitação
- [ ] A capacidade 'Retomar funcionário' pode ser executada no fluxo previsto.
- [ ] O resultado fica persistido e visível quando aplicável.
- [ ] Impedimentos são apresentados de forma compreensível e acionável.
- [ ] Regras, limites e permissões são respeitados.

## Regras de negócio
- Estados do funcionário devem ser explícitos.
- Funcionário incompleto não pode entrar em operação.

## Dependências
- PRD aplicável.
- E03 — Ativação.
- Configurações e permissões necessárias.

## Fora do escopo
- Mudanças de produto não aprovadas.
- Decisões técnicas de implementação.
- Customização específica sem decisão de produto.

## Design

        Esta história está sujeita ao gate:

        > **Product Ready + Design Ready + Tech Ready**

        ### Referências

        - `docs/design/flows/03-activation.md`
- `docs/design/12-status-and-states.md`

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
- `docs/delivery/epics/E03-ativacao/epic.md`
