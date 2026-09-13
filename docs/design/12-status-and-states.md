# BRAÇO — Status & States

## 1. Status do funcionário

### Contratado
Existe na equipe, mas preparação ainda não começou ou está no início.

### Preparando
Manual de Trabalho/configurações estão sendo preenchidos.

### Pronto
Pré-requisitos concluídos; pode ser ativado.

### Trabalhando
Ativo e autorizado a executar sua função.

### Pausado
Continua contratado, mas não executa trabalho.

### Precisa de atenção
Existe condição que exige intervenção/configuração.

### Desativado
Não participa mais da operação ativa.

## 2. Regras

Status deve sempre possuir:
- texto;
- semântica;
- ação aplicável;
- cor acessível como reforço, nunca como único indicador.

## 3. Estados de interface

Toda tela deve considerar quando aplicável:

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

## 4. Empty states

Devem:
- explicar o estado;
- dizer por que importa;
- oferecer próximo passo quando existir.

Exemplo Minha Equipe vazia:
> Sua equipe digital ainda está vazia. Contrate seu primeiro funcionário para começar.

CTA:
**Conhecer funcionários**

## 5. Estados irreversíveis/destrutivos

Ações de impacto relevante devem usar confirmação proporcional ao risco.

## 6. Estados assíncronos

Integrações e mensagens podem possuir estado pendente.

A interface nunca deve apresentar como concluída uma ação ainda não confirmada.
