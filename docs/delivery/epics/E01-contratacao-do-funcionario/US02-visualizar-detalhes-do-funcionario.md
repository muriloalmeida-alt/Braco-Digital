# US02 — Visualizar detalhes do funcionário

**Épico:** E01 — Contratação do Funcionário  
**Prioridade:** P0  
**Sprint planejada:** Sprint 01

## Contexto
Esta história detalha a capacidade **visualizar detalhes do funcionário**.

## História de usuário
Como **gestor**, quero **visualizar detalhes do funcionário**, para **iniciar a contratação e entender o próximo passo**.

## Critérios de aceitação
- [ ] Todos os 5 funcionários do catálogo podem ter o detalhe visualizado, independentemente da disponibilidade.
- [ ] Apenas Braço Atendimento (Disponível) exibe CTA de contratação no detalhe.
- [ ] Os 4 funcionários "Em breve" exibem missão, responsabilidades e resultado esperado normalmente, mais uma mensagem objetiva de indisponibilidade (ex.: "Em breve. Este funcionário ainda não está disponível para contratação."), sem CTA de contratação.
- [ ] Nenhuma lista de espera/cadastro de interesse ("Avise-me") é exibida nesta fase.
- [ ] Impedimentos são apresentados de forma compreensível e acionável.
- [ ] Regras, limites e permissões são respeitados.

## Regras de negócio
- A contratação deve usar linguagem de equipe e função, não de tecnologia.
- O próximo passo deve ser sempre claro.
- Disponibilidade no catálogo (Disponível/Em breve) é um conceito separado de Employee Status.

## Dependências
- PRD aplicável.
- E01 — Contratação do Funcionário.
- Configurações e permissões necessárias.

## Fora do escopo
- Mudanças de produto não aprovadas.
- Decisões técnicas de implementação.
- Customização específica sem decisão de produto.

## Design

        Esta história está sujeita ao gate:

        > **Product Ready + Design Ready + Tech Ready**

        ### Referências

        - `docs/design/flows/01-hiring.md`
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
- `docs/delivery/epics/E01-contratacao-do-funcionario/epic.md`
