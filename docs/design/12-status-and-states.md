# BRAÇO — Status & States

## 1. Status do funcionário

### Contratado
Existe na equipe antes do início efetivo da preparação quando aplicável.

### Preparando
Manual/configurações ainda não foram concluídos e revisados.

Durante Sprint 02, pode ser enriquecido:

> **Preparando · 5 de 8 etapas**

### Pronto
As oito etapas foram concluídas e o gestor executou **Concluir preparação**.

Significa: pronto para entrar no fluxo de ativação.

Não significa Trabalhando.

### Trabalhando
Ativo e autorizado a executar sua função.

### Pausado
Contratado, mas não trabalha.

### Precisa de atenção
Condição exige intervenção/configuração.

### Desativado
Não participa da operação ativa.

## 2. Preparando → Pronto

Não é automático ao salvar o último campo.

```text
8 etapas completas
→ Revisão disponível
→ Gestor revisa
→ Concluir preparação
→ Pronto
```

## 3. Pronto → Preparando

Antes da ativação, se edição/desconexão tornar requisito obrigatório
incompleto:

> **Pronto → Preparando**

A interface explica o que falta.

## 4. Estados da etapa

- Não iniciada
- Em andamento
- Completa

## 5. Estado da Revisão

- Bloqueada
- Disponível
- Concluída

## 6. Estados de integração

- Não configurado
- Conectando
- Conectado
- Precisa de atenção
- Desconectado
- Não necessário

## 7. Regras gerais

Status possui:
- texto;
- semântica;
- ação;
- cor apenas como reforço.

## 8. Estados de interface

- loading;
- empty;
- populated;
- partial;
- success;
- error;
- offline/degraded;
- permission denied;
- integration disconnected;
- attention required.

## 9. Estados assíncronos

Nunca apresentar como concluída ação ainda não confirmada.
