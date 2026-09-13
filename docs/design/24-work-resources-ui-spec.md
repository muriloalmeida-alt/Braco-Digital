# BRAÇO — Work Resources UI Spec

**Status:** Approved — Product Ready + Design Ready  
**Owner:** GPT — Product Manager + Product Designer  
**Story:** US14

## 1. Objetivo

Dar ao funcionário os recursos necessários sem obrigar o gestor a
administrar integrações fora do BRAÇO.

> **O gestor configura no BRAÇO. O funcionário trabalha. As integrações fazem o restante.**

## 2. Escopo da Sprint 02

Cobre:
- conectar/configurar recursos;
- visualizar estado;
- selecionar conta/calendário/lista;
- indicar obrigatório/não necessário;
- detectar configuração incompleta.

Não cobre uso operacional:
- atendimento WhatsApp → Sprint 03;
- operação de agenda → Sprint 04;
- follow-up via Tasks → Sprint 05.

## 3. Requiredness

### WhatsApp
Obrigatório para Braço Atendimento.

### Google Calendar
Obrigatório quando habilitado:
- Agendar
- Confirmar agendamento
- Reagendar
- Cancelar

### Google Tasks
Obrigatório quando habilitado:
- Follow-up
- Recuperação
- Lembretes

## 4. Estados

- Não configurado
- Conectando
- Conectado
- Precisa de atenção
- Desconectado
- Não necessário

Sempre em texto.

## 5. WhatsApp

### Não configurado

> Conecte o WhatsApp usado pela empresa para que este funcionário possa atender clientes.

CTA:

> **Conectar WhatsApp**

### Conectado

Mostrar número/identificação.

Ações secundárias:
- Ver configuração
- Desconectar

Desconectar recurso obrigatório torna preparação incompleta.

### Precisa de atenção

Explicar motivo acionável; não expor código bruto do BSP.

## 6. Google

Calendar e Tasks podem compartilhar autorização técnica quando possível,
mas o usuário percebe recursos separados.

Não exigir abrir Calendar/Tasks para concluir.

OAuth pode sair para autorização e deve voltar ao BRAÇO.

## 7. Calendar

### Não necessário

> **Não necessário para as responsabilidades atuais**

### Obrigatório / não configurado

> Seu Braço precisa de uma agenda para oferecer e gerenciar horários.

CTA:

> **Conectar Google**

Após autorização:
- selecionar calendário;
- validar acesso.

## 8. Tasks

### Não necessário
Quando não houver follow-up/recuperação/lembrete.

### Obrigatório

> Seu Braço usa tarefas para acompanhar pendências e próximos contatos.

CTA:

> **Conectar Google**

Após autorização:
- selecionar/configurar lista;
- validar acesso.

## 9. Dependência dinâmica

Ao habilitar responsabilidade:
- recurso pode virar obrigatório;
- se não conectado, Recursos fica incompleta;
- Revisão aponta pendência.

Ao desabilitar todas:
- deixa de bloquear;
- não desconectar automaticamente.

## 10. Segurança

A UI:
- não exibe token;
- não pede credencial Google diretamente;
- não mostra segredo BSP;
- explica conexões;
- permite desconectar com confirmação.

## 11. Erros

Autorização cancelada:

> A conexão não foi concluída.

CTA:

> Tentar novamente

Sem acesso:

> Não conseguimos acessar este recurso com a conta conectada.

Ação:

> Revisar conexão

Estado degradado:

> Precisa de atenção

## 12. Completion

US14 completa quando:
- WhatsApp conectado;
- Calendar conectado/selecionado se obrigatório;
- Tasks conectado/configurado se obrigatório;
- não necessário explicitamente identificado;
- nenhum obrigatório em atenção/desconectado.

## 13. Tech Ready

Engenharia deve avaliar:
- BSP;
- credenciais/ambientes;
- OAuth Google;
- scopes;
- callbacks;
- persistência segura;
- viabilidade de conexão agora sem antecipar operação.

Se houver bloqueio, retornar em `Product Decisions Required`.

Não reduzir silenciosamente o escopo.
