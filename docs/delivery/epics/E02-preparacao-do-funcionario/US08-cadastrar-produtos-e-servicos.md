# US08 — Cadastrar produtos e serviços

**Épico:** E02 — Preparação do Funcionário  
**Prioridade:** P0  
**Sprint planejada:** Sprint 02  
**Product Ready:** YES  
**Design Ready:** YES  
**Tech Ready:** TECH READY WITH CAVEATS

## Contexto

O Braço precisa conhecer o que a empresa oferece e exatamente o que pode
explicar sobre cada oferta.

## História de usuário

Como **gestor**, quero **cadastrar produtos e serviços**, para que **meu
Braço apresente ofertas, preços e condições sem inventar informações**.

## Critérios de aceitação

- [ ] Existe lista de produtos/serviços.
- [ ] O gestor pode adicionar, editar e excluir itens.
- [ ] Cada item exige Nome, Tipo, Descrição para o cliente e regra de preço.
- [ ] As opções de preço são Fixo, A partir de, Sob consulta e Não informar.
- [ ] Valor é obrigatório somente em Fixo/A partir de.
- [ ] Serviço pode ser agendável; quando agendável, Duração é obrigatória.
- [ ] A etapa exige pelo menos um item válido.
- [ ] Preço não cadastrado não autoriza inventar informação.
- [ ] Excluir item persistido exige confirmação.
- [ ] A etapa conclui via Continuar e mantém autosave.

## Regras de negócio

- Conteúdo é compartilhado.
- Item Sob consulta/Não informar nunca recebe preço inventado.
- Duração é requisito de serviço agendável.

## Dependências

- Contexto de empresa existente.
- Permissão de edição.

## Fora do escopo

- Estoque.
- ERP/CRM.
- Preço dinâmico.
- Múltiplas tabelas comerciais.

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
