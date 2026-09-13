# US06 — Iniciar preparação

**Épico:** E02 — Preparação do Funcionário  
**Prioridade:** P0  
**Sprint planejada:** Sprint 01

## Contexto
Esta história detalha a capacidade **iniciar preparação**.

## Escopo confirmado

> Funcionário contratado → CTA "Preparar funcionário" → Entrar na
> preparação → Visualizar visão geral → Visualizar estrutura de seções →
> Visualizar estado inicial/incompleto → Entender próximo passo

US06 **não inclui** o preenchimento das seções. O preenchimento pertence a
US07–US15 (Sprint 02). Fora do escopo desta história: editar dados da
empresa; cadastrar produtos/serviços; definir responsabilidades, regras,
limites ou autonomia; informar responsáveis; configurar comunicação ou
recursos; revisão final do Manual de Trabalho.

## História de usuário
Como **gestor**, quero **iniciar a preparação do funcionário e ver a
estrutura do que preciso preencher**, para **entender o próximo passo sem
precisar preencher tudo de uma vez**.

## Critérios de aceitação
- [ ] O gestor consegue iniciar a preparação a partir do funcionário contratado.
- [ ] A tela inicial da preparação apresenta todas as seções previstas (`docs/design/flows/02-preparation.md`).
- [ ] Cada seção apresenta estado inicial/incompleto.
- [ ] O produto informa claramente qual é o próximo passo.
- [ ] O gestor consegue navegar para a primeira etapa de preenchimento.
- [ ] Nenhuma informação de US07–US15 precisa ser preenchida para concluir US06.
- [ ] O funcionário permanece em estado Preparando.

## Regras de negócio
- A preparação alimenta o Manual de Trabalho.
- Informações incompletas devem permanecer identificáveis.
- Iniciar a preparação não exige preencher nenhuma seção (ver "Escopo confirmado" acima).

## Dependências
- PRD aplicável.
- E02 — Preparação do Funcionário.
- Configurações e permissões necessárias.

## Fora do escopo
- Mudanças de produto não aprovadas.
- Decisões técnicas de implementação.
- Customização específica sem decisão de produto.

## Design

        Esta história está sujeita ao gate:

        > **Product Ready + Design Ready + Tech Ready**

        ### Referências

        - `docs/design/flows/02-preparation.md`
- `docs/design/09-product-patterns.md`
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
- `docs/delivery/epics/E02-preparacao-do-funcionario/epic.md`
