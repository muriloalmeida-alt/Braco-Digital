# US09 — Definir responsabilidades

**Épico:** E02 — Preparação do Funcionário  
**Prioridade:** P0  
**Sprint planejada:** Sprint 02  
**Product Ready:** YES  
**Design Ready:** YES  
**Tech Ready:** TECH READY

## Contexto

Responsabilidade define o trabalho que pertence ao funcionário. O produto
oferece uma lista coerente com a função Recepcionista Digital.

## História de usuário

Como **gestor**, quero **definir quais responsabilidades pertencem ao meu
Braço**, para que **fique claro o trabalho que ele deve executar**.

## Critérios de aceitação

- [ ] Responsabilidades essenciais aparecem obrigatórias e não removíveis.
- [ ] Receber clientes, Identificar necessidade e Encaminhar para humano são essenciais.
- [ ] As demais responsabilidades podem ser habilitadas/desabilitadas.
- [ ] Não existe responsabilidade customizada no MVP.
- [ ] A UI explica dependências de recursos.
- [ ] Habilitar agenda torna Calendar obrigatório.
- [ ] Habilitar follow-up/recuperação/lembrete torna Tasks obrigatório.
- [ ] WhatsApp permanece obrigatório.
- [ ] A seleção usa autosave.
- [ ] Continuar conclui quando válida.

## Regras de negócio

- Responsabilidade, regra, limite e autonomia são distintos.
- Responsabilidades permanecem dentro da função Atendimento.
- Handoff é obrigatório de segurança.

## Dependências

- Catálogo funcional do Braço Atendimento.
- US14 consome dependências.

## Fora do escopo

- Responsabilidade livre.
- Workflow builder.
- Novas funções.

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
