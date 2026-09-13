# US07 — Informar dados da empresa

**Épico:** E02 — Preparação do Funcionário  
**Prioridade:** P0  
**Sprint planejada:** Sprint 02  
**Product Ready:** YES  
**Design Ready:** YES  
**Tech Ready:** TECH READY WITH CAVEATS

## Contexto

A etapa Empresa dá ao Braço contexto institucional compartilhado. O gestor
responde informações que um novo funcionário precisa saber.

## História de usuário

Como **gestor**, quero **informar como minha empresa funciona**, para que
**meu Braço consiga orientar clientes com informações corretas**.

## Critérios de aceitação

- [ ] Existe uma etapa Empresa acessível pela preparação.
- [ ] A interface informa que os dados são compartilhados com a equipe digital.
- [ ] O gestor informa Nome para atendimento, Sobre a empresa, Forma de atendimento, Horários e Fuso horário.
- [ ] Endereço principal é obrigatório em Presencial/Ambos.
- [ ] Site, rede social e observações são opcionais.
- [ ] Alterações válidas são salvas automaticamente com feedback.
- [ ] A etapa só fica Completa após obrigatórios válidos e Continuar.
- [ ] Erros ficam junto ao campo e o primeiro erro recebe foco.
- [ ] Os dados persistem ao sair e retornar.

## Regras de negócio

- Dados pertencem ao contexto compartilhado da empresa.
- Não solicitar dados fiscais/jurídicos sem necessidade.
- Campos opcionais vazios não impedem conclusão.
- Invalidar obrigatório reabre a etapa.

## Dependências

- US06 — overview.
- Company/tenant existente.
- Permissão de edição.

## Fora do escopo

- Múltiplas filiais.
- Cadastro fiscal/societário.
- Onboarding self-service.

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
