# BRAÇO — WhatsApp Template Library v1

**Status:** Content Design Ready — candidato para submissão Meta/BSP  
**Owner:** GPT — Product Manager + Product Designer  
**Relacionado a:** PD2 / E05 / E06  
**Canal:** WhatsApp

## 1. Objetivo

Definir o conteúdo v1 dos templates usados quando o BRAÇO precisa iniciar
um contato fora da janela ativa permitida pelo WhatsApp.

Princípio:

> Mensagem proativa fora da janela não é texto livre gerado pelo LLM.

O funcionário digital escolhe uma **intenção aprovada**, preenche apenas
variáveis controladas e utiliza o template previamente aprovado.

A aprovação final do texto, categoria e variáveis é da Meta/BSP. Uma
reclassificação ou rejeição externa não autoriza Engenharia a alterar copy
ou comportamento de produto silenciosamente.

## 2. Princípios de conteúdo

Todos os templates devem ser:

- claros;
- curtos;
- contextuais;
- transparentes sobre a natureza digital do atendimento;
- sem pressão comercial agressiva;
- sem linguagem que sugira urgência inexistente;
- sem promessas não autorizadas;
- sem conteúdo sensível desnecessário.

Expressão-padrão de transparência:

> **Aqui é o atendimento digital da {{empresa}}.**

## 3. Variáveis

Na documentação de Produto usamos nomes semânticos.

Na submissão ao provedor, Engenharia pode convertê-los para placeholders
posicionais exigidos pelo BSP, preservando exatamente a semântica definida.

Variáveis nunca são preenchidas com texto livre inventado pelo LLM.

Devem vir de dados validados:

- nome do cliente;
- nome público da empresa;
- serviço/assunto seguro;
- data;
- horário.

## 4. Regra especial — dados sensíveis

No vertical de clínicas, templates proativos não devem revelar diagnóstico,
condição de saúde, procedimento sensível ou qualquer outro dado que possa
expor informação pessoal sensível em uma notificação.

Quando `{{servico}}` puder revelar informação sensível, usar uma descrição
genérica aprovada pela empresa, por exemplo:

- `seu atendimento`;
- `seu agendamento`;
- `o atendimento solicitado`.

## 5. Template T01 — Follow-up de interesse

**Template key:** `follow_up_interest`  
**Intenção:** retomar uma conversa iniciada pelo cliente que ficou em aberto.  
**Categoria de submissão:** a confirmar com Meta/BSP no momento da submissão.

### Texto

> Olá, {{nome}}. Aqui é o atendimento digital da {{empresa}}. Você falou com a gente sobre {{assunto}}. Se ainda quiser continuar, responda esta mensagem e eu retomo o atendimento.

### Variáveis

- `{{nome}}` — primeiro nome ou forma de tratamento segura;
- `{{empresa}}` — nome público da empresa;
- `{{assunto}}` — descrição curta e não sensível.

### Condições de uso

- existe contato anterior relacionado ao assunto;
- conversa não foi concluída;
- cliente não pediu para interromper contatos;
- limite de contato ainda permite nova tentativa.

## 6. Template T02 — Agendamento incompleto

**Template key:** `follow_up_incomplete_booking`  
**Intenção:** retomar um agendamento iniciado mas não concluído.  
**Categoria de submissão:** a confirmar com Meta/BSP.

### Texto

> Olá, {{nome}}. Aqui é o atendimento digital da {{empresa}}. Seu agendamento de {{servico}} não foi concluído. Se quiser continuar, responda esta mensagem e eu mostro os horários disponíveis.

### Variáveis

- `{{nome}}`;
- `{{empresa}}`;
- `{{servico}}` — usar nomenclatura segura; aplicar regra da seção 4.

### Condições de uso

- houve tentativa real de agendamento;
- nenhum agendamento equivalente já foi concluído;
- disponibilidade de agenda continua válida para iniciar nova consulta.

## 7. Template T03 — Lembrete de agendamento

**Template key:** `appointment_reminder`  
**Intenção:** lembrar um compromisso já confirmado.  
**Categoria de submissão:** a confirmar com Meta/BSP.

### Texto

> Olá, {{nome}}. Aqui é o atendimento digital da {{empresa}}. Lembrete: seu agendamento de {{servico}} está marcado para {{data}} às {{horario}}. Se precisar alterar, responda esta mensagem.

### Variáveis

- `{{nome}}`;
- `{{empresa}}`;
- `{{servico}}` — nomenclatura segura;
- `{{data}}` — data local legível;
- `{{horario}}` — horário local legível.

### Condições de uso

- agendamento continua ativo;
- data/horário foram revalidados antes do envio;
- não enviar após cancelamento/reagendamento.

## 8. Template T04 — Reagendamento

**Template key:** `appointment_reschedule`  
**Intenção:** solicitar ao cliente a escolha de um novo horário.  
**Categoria de submissão:** a confirmar com Meta/BSP.

### Texto

> Olá, {{nome}}. Aqui é o atendimento digital da {{empresa}}. Precisamos ajustar seu agendamento de {{servico}} marcado para {{data_horario}}. Responda esta mensagem e eu ajudo você a escolher um novo horário.

### Variáveis

- `{{nome}}`;
- `{{empresa}}`;
- `{{servico}}` — nomenclatura segura;
- `{{data_horario}}` — referência ao compromisso atual.

### Condições de uso

- existe agendamento real que precisa ser alterado;
- motivo interno da alteração não precisa ser exposto no template;
- resposta do cliente conduz ao fluxo de escolha de novo horário.

## 9. Template T05 — Recuperação de oportunidade

**Template key:** `opportunity_recovery`  
**Intenção:** retomar uma oportunidade comercial que ficou aberta.  
**Categoria de submissão:** a confirmar com Meta/BSP.

### Texto

> Olá, {{nome}}. Aqui é o atendimento digital da {{empresa}}. Você demonstrou interesse em {{assunto}} e a conversa ficou em aberto. Se ainda quiser seguir, responda esta mensagem e eu continuo de onde paramos.

### Variáveis

- `{{nome}}`;
- `{{empresa}}`;
- `{{assunto}}` — descrição curta, segura e contextual.

### Condições de uso

- existe oportunidade anterior identificável;
- não há conclusão, cancelamento ou opt-out;
- envio respeita limite de contato.

## 10. Botões

**Decisão v1:** os cinco templates serão inicialmente **body-only**.

Não usar nesta primeira submissão:

- quick reply button;
- CTA externo;
- link;
- telefone.

Objetivo:

- reduzir complexidade da primeira aprovação;
- manter a resposta do cliente como ação principal;
- reabrir naturalmente a conversa para o funcionário continuar.

Botões podem ser avaliados em versão futura, após aprendizado real.

## 11. Guardrails de contato — MVP

### Regra global
- máximo de **1 mensagem proativa por cliente em 24 horas**.

### Follow-up de interesse / oportunidade
- máximo de **2 tentativas automáticas por oportunidade**;
- intervalo mínimo recomendado de **48 horas** entre as tentativas;
- sem resposta após a segunda tentativa:
  - encerrar automação;
  - registrar resultado;
  - não continuar insistindo automaticamente.

### Agendamento incompleto
- máximo de **1 retomada automática** para o mesmo intento de agendamento;
- um novo contato posterior exige nova interação do cliente ou regra futura aprovada.

### Lembrete de agendamento
- MVP: **1 lembrete automático**, preferencialmente próximo de 24h antes do compromisso;
- horário exato deve respeitar configuração/agenda e timezone da empresa.

### Reagendamento
- envio acionado por necessidade real de alteração;
- não repetir automaticamente em sequência;
- sem resposta, criar pendência/follow-up respeitando as demais regras.

### Opt-out
Se o cliente solicitar que contatos proativos parem:

- interromper follow-up e recuperação automáticos;
- registrar preferência;
- não contornar a preferência por outro template.

Comunicações estritamente necessárias para um compromisso existente devem
ser tratadas conforme política/consentimento aplicável e validação jurídica,
sem Engenharia inventar exceções.

## 12. Fallback

### Template não aprovado / inexistente
Não enviar texto livre.

Criar estado:

> **Precisa de atenção — template de WhatsApp indisponível**

O follow-up permanece registrado como não executado.

### Template rejeitado na submissão
- marcar template como `rejected`;
- não substituir automaticamente por outro texto;
- criar alerta para revisão de Produto/Design.

### Falha técnica de envio
- manter distinção entre falha técnica e template rejeitado;
- retry é responsabilidade de Engenharia;
- copy não muda durante retry.

## 13. Estados apresentados ao gestor

Preferir linguagem de produto:

- Programado
- Enviando
- Enviado
- Entregue
- Não enviado
- Precisa de atenção

Detalhe de `Precisa de atenção` pode explicar:

- template indisponível;
- template rejeitado;
- integração desconectada;
- falha técnica persistente.

Não expor códigos de API na visão principal.

## 14. Critérios para submissão

Antes de enviar à Meta/BSP:

- [x] texto v1 definido;
- [x] variáveis semânticas definidas;
- [x] transparência digital preservada;
- [x] fallback definido;
- [x] limites de contato do MVP definidos;
- [x] regra de dados sensíveis definida;
- [ ] categoria final validada com BSP;
- [ ] placeholders convertidos para formato exigido pelo BSP;
- [ ] exemplos de variável preparados;
- [ ] submissão realizada;
- [ ] status de aprovação registrado.

## 15. Status de Product Design

A biblioteca está:

> **CONTENT DESIGN READY**

Ela só se torna:

> **OPERATIONALLY AVAILABLE**

quando o template correspondente estiver aprovado e configurado no
provedor de WhatsApp utilizado pelo BRAÇO.
