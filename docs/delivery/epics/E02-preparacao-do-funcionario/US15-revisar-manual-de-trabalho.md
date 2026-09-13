# US15 — Revisar Manual de Trabalho

**Épico:** E02 — Preparação do Funcionário  
**Prioridade:** P0  
**Sprint planejada:** Sprint 02  
**Product Ready:** YES  
**Design Ready:** YES  
**Tech Ready:** TECH READY

## Contexto

A revisão é o gate explícito entre preencher informações e declarar que
o funcionário está preparado.

## História de usuário

Como **gestor**, quero **revisar o Manual de Trabalho e concluir a
preparação**, para que **eu saiba exatamente o que o Braço aprendeu antes de
levá-lo à ativação**.

## Critérios de aceitação

- [ ] Revisão fica bloqueada enquanto alguma das oito etapas estiver incompleta.
- [ ] A revisão apresenta resumo de todas as etapas.
- [ ] Etapa incompleta exibe pendência e Corrigir.
- [ ] Etapa completa oferece Revisar.
- [ ] Com tudo completo, Concluir preparação é habilitado.
- [ ] A confirmação diz que ficará Pronto mas ainda não começará a trabalhar.
- [ ] Concluir preparação muda Employee Status para PRONTO.
- [ ] A ação não ativa nem inicia WhatsApp.
- [ ] Após sucesso, há confirmação de Preparação concluída.
- [ ] Se dado obrigatório for invalidado antes da ativação, status volta a PREPARANDO.

## Regras de negócio

- Conclusão é explícita, não automática.
- Revisão não conta nas 8 etapas.
- `PRONTO` não é operação.

## Dependências

- US07–US14.
- US16 — pendências.
- US17 — status.

## Fora do escopo

- Checklist de ativação US18.
- Ativação US19.
- Atendimento real.

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
