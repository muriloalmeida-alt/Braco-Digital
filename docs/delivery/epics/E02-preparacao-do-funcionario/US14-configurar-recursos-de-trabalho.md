# US14 — Configurar recursos de trabalho

**Épico:** E02 — Preparação do Funcionário  
**Prioridade:** P1  
**Sprint planejada:** Sprint 02  
**Product Ready:** YES  
**Design Ready:** YES  
**Tech Ready:** PENDING ENGINEERING REVIEW

## Contexto

A preparação conecta recursos necessários à função antes da ativação,
sem antecipar o uso operacional completo desses recursos.

## História de usuário

Como **gestor**, quero **conectar os recursos necessários ao trabalho**,
para que **meu Braço possa ser ativado com as ferramentas de que precisa**.

## Critérios de aceitação

- [ ] WhatsApp aparece obrigatório para Braço Atendimento.
- [ ] Calendar é obrigatório apenas quando houver responsabilidade de agenda.
- [ ] Tasks é obrigatório apenas quando houver follow-up, recuperação ou lembrete.
- [ ] Cada recurso mostra estado textual aprovado.
- [ ] O gestor inicia conexão pelo BRAÇO e retorna ao BRAÇO após autorização externa.
- [ ] Calendar permite selecionar o calendário.
- [ ] Tasks permite selecionar/configurar a lista.
- [ ] Recursos não necessários não bloqueiam.
- [ ] Recurso obrigatório desconectado/Precisa de atenção bloqueia.
- [ ] Nenhum token/segredo é exibido.
- [ ] Sprint 02 não precisa executar atendimento, agendamento ou follow-up real para concluir US14.

## Regras de negócio

- WhatsApp é obrigatório para Atendimento.
- Google é infraestrutura; gestão continua no BRAÇO.
- Requiredness deriva das responsabilidades.
- Desabilitar responsabilidade pode remover bloqueio sem desconectar automaticamente.

## Dependências

- Configuração BSP/WhatsApp.
- OAuth Google + Calendar/Tasks.
- US09 — responsabilidades.
- `docs/design/24-work-resources-ui-spec.md`.

## Fora do escopo

- Atendimento real.
- Operação real da agenda.
- Execução real de follow-up.
- Gestão pelo app nativo do Google.

## Design

Gate:

> **Product Ready + Design Ready + Tech Ready**

### Referências

- `docs/design/flows/02-preparation.md`
- `docs/design/22-work-manual-content-model.md`
- `docs/design/23-preparation-experience-spec.md`
- `docs/design/24-work-resources-ui-spec.md`

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
