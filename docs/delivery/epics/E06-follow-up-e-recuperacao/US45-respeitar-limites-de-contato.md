# US45 — Respeitar limites de contato

**Épico:** E06 — Follow-up e Recuperação  
**Prioridade:** P1  
**Sprint planejada:** Sprint 05

## Contexto
Esta história detalha a capacidade **respeitar limites de contato**.

## História de usuário
Como **funcionário digital**, quero **respeitar limites de contato**, para **garantir continuidade e recuperar oportunidades**.

## Critérios de aceitação
- [ ] A capacidade 'Respeitar limites de contato' pode ser executada no fluxo previsto.
- [ ] O resultado fica persistido e visível quando aplicável.
- [ ] Impedimentos são apresentados de forma compreensível e acionável.
- [ ] Regras, limites e permissões são respeitados.

## Regras de negócio
- Follow-ups devem respeitar limites de contato.
- Toda tentativa relevante deve ser registrada.
- Limites de contato se aplicam também à frequência de envio de templates de WhatsApp fora da janela de 24h (PD2) — ver `docs/design/flows/06-follow-up.md`.

## Dependências
- PRD aplicável.
- E06 — Follow-up e Recuperação.
- Configurações e permissões necessárias.

## Fora do escopo
- Mudanças de produto não aprovadas.
- Decisões técnicas de implementação.
- Customização específica sem decisão de produto.

## Design

        Esta história está sujeita ao gate:

        > **Product Ready + Design Ready + Tech Ready**

        ### Referências

        - `docs/design/flows/06-follow-up.md`
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
- `docs/delivery/epics/E06-follow-up-e-recuperacao/epic.md`
