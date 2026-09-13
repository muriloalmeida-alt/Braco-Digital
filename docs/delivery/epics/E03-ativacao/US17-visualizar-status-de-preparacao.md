# US17 — Visualizar status de preparação

**Épico:** E03 — Ativação  
**Prioridade:** P0  
**Sprint planejada:** Sprint 02  
**Product Ready:** YES  
**Design Ready:** YES  
**Tech Ready:** TECH READY

## Contexto

US17 é a ponte entre preparação e ativação. A Sprint 02 torna claro quando
o funcionário ainda está sendo preparado e quando está Pronto.

## História de usuário

Como **gestor**, quero **visualizar o status e o progresso da preparação**,
para que **eu saiba se o funcionário ainda precisa de configuração ou já
está pronto para ativação**.

## Critérios de aceitação

- [ ] Enquanto a preparação não foi concluída explicitamente, Employee Status permanece PREPARANDO.
- [ ] Minha Equipe pode complementar PREPARANDO com X de 8 etapas.
- [ ] O detalhe mostra status e próximo passo Continuar preparação enquanto incompleto.
- [ ] Após Concluir preparação, Employee Status muda para PRONTO.
- [ ] PRONTO é exibido em texto e semântica positiva.
- [ ] Na Sprint 02, PRONTO não apresenta CTA quebrado de ativação.
- [ ] A UI informa que ativação é o próximo passo sem iniciar US18/US19.
- [ ] Se requisito obrigatório for invalidado antes da ativação, volta a PREPARANDO.
- [ ] Status é consistente em Minha Equipe, detalhe e preparação.

## Regras de negócio

- Pronto exige oito etapas + revisão explícita.
- Pronto não equivale a Trabalhando.
- Ativação permanece Sprint 03.

## Dependências

- US15 — concluir preparação.
- US16 — incompletude.
- Employee Status existente.

## Fora do escopo

- Checklist de ativação.
- Ativação.
- Trabalho por WhatsApp.

## Design

Gate:

> **Product Ready + Design Ready + Tech Ready**

### Referências

- `docs/design/flows/02-preparation.md`
- `docs/design/22-work-manual-content-model.md`
- `docs/design/23-preparation-experience-spec.md`
- `docs/design/12-status-and-states.md`

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
