# US10 — Definir regras e limites

**Épico:** E02 — Preparação do Funcionário  
**Prioridade:** P0  
**Sprint planejada:** Sprint 02  
**Product Ready:** YES  
**Design Ready:** YES  
**Tech Ready:** PENDING ENGINEERING REVIEW

## Contexto

O gestor precisa distinguir limites impostos pelo produto de regras
específicas da empresa.

## História de usuário

Como **gestor**, quero **revisar limites de segurança e cadastrar regras da
empresa**, para que **meu Braço saiba até onde pode ir**.

## Critérios de aceitação

- [ ] Limites de sistema aparecem legíveis e não editáveis.
- [ ] A UI explica por que não podem ser desativados.
- [ ] Transparência digital, não inventar, não prometer/negociar fora e handoff em exceções estão cobertos.
- [ ] O gestor pode adicionar/remover regras da empresa.
- [ ] Cada regra exige Regra; Quando se aplica é opcional.
- [ ] O gestor pode selecionar Não tenho regras adicionais.
- [ ] A etapa não conclui sem revisão e decisão sobre regras adicionais.
- [ ] Autosave e feedback de erro são aplicados.

## Regras de negócio

- Limite de sistema prevalece sobre regra da empresa.
- Regra não amplia autonomia além do permitido.
- Não expor prompt/modelo.

## Dependências

- US09.
- US11.

## Fora do escopo

- Editar/remover limite de sistema.
- Rule engine genérica.

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
