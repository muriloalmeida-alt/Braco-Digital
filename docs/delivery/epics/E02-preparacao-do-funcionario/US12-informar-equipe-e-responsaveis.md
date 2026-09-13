# US12 — Informar equipe e responsáveis

**Épico:** E02 — Preparação do Funcionário  
**Prioridade:** P1  
**Sprint planejada:** Sprint 02  
**Product Ready:** YES  
**Design Ready:** YES  
**Tech Ready:** TECH READY

## Contexto

O funcionário precisa saber qual pessoa do negócio é responsável quando
uma decisão precisa sair do Braço.

## História de usuário

Como **gestor**, quero **definir uma pessoa responsável e, opcionalmente,
uma reserva**, para que **o Braço saiba para quem encaminhar situações que
precisam de humano**.

## Critérios de aceitação

- [ ] Responsável principal é selecionado entre usuários ativos da empresa no BRAÇO.
- [ ] Responsável principal é obrigatório.
- [ ] Nome, role e e-mail são apresentados.
- [ ] Um único Owner elegível pode aparecer como recomendação, mas exige confirmação.
- [ ] Responsável reserva é opcional e diferente do principal.
- [ ] A UI informa quando não existe usuário elegível.
- [ ] A etapa fica incompleta sem responsável principal.
- [ ] Autosave e Continuar seguem o padrão.

## Regras de negócio

- Não criar contatos paralelos ao cadastro de usuários.
- O responsável é atribuição específica do funcionário.
- Usuário desativado deixa de satisfazer o requisito.

## Dependências

- Usuários da empresa existentes.
- RBAC/company membership.

## Fora do escopo

- Convidar/criar usuários.
- Plantão.
- Roteamento por departamento.
- Distribuição avançada.

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
