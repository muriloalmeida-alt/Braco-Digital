# BRAÇO — Work Manual Content Model

**Status:** Approved — Product Ready + Design Ready  
**Owner:** GPT — Product Manager + Product Designer  
**Sprint:** 02  
**Histórias:** US07–US17

## 1. Objetivo

Definir o conteúdo funcional do Manual de Trabalho do Braço Atendimento.

O Manual não é um prompt. É uma representação em linguagem de negócio de:
- contexto;
- responsabilidades;
- regras;
- autonomia;
- pessoas;
- recursos;
- comunicação.

## 2. Estrutura

**8 etapas de conteúdo + Revisão:**

1. Empresa
2. Produtos e serviços
3. Responsabilidades
4. Regras e limites
5. Autonomia
6. Pessoas e responsáveis
7. Comunicação
8. Recursos de trabalho
9. Revisão

A barra de progresso considera as **8 etapas de conteúdo**.

Exemplo:

> **5 de 8 etapas completas**

Quando as oito estão completas:

> **Pronto para revisar**

## 3. Regra de conclusão de etapa

Estados:
- Não iniciada
- Em andamento
- Completa

Comportamento:
- alterações válidas são salvas automaticamente;
- o CTA principal é **Continuar**;
- `Continuar` valida os obrigatórios;
- se houver erro, a etapa não conclui e o foco vai ao primeiro erro;
- se estiver válida, passa para `Completa` e segue;
- campos opcionais vazios não impedem conclusão;
- editar uma etapa completa mantém `Completa` se continuar válida;
- invalidar obrigatório faz voltar para `Em andamento`.

## 4. Empresa

**Ownership:** contexto compartilhado da empresa.

Mensagem:

> **Estas informações podem ser usadas por todos os seus Braços.**

| Campo | Obrigatório | Regra |
|---|---:|---|
| Nome para atendimento | Sim | Nome público usado com clientes |
| Sobre a empresa | Sim | Descrição curta do que a empresa faz |
| Forma de atendimento | Sim | Presencial / Online / Ambos |
| Endereço principal | Condicional | Obrigatório em Presencial/Ambos |
| Horários de atendimento | Sim | Pelo menos um período |
| Fuso horário | Sim | Confirmado pelo gestor |
| Site | Não | URL quando existir |
| Instagram/rede principal | Não | Perfil público |
| Observações gerais | Não | Informação institucional útil |

Fora do escopo: fiscal/societário, múltiplas unidades, cadastro jurídico completo.

## 5. Produtos e serviços

**Ownership:** contexto compartilhado.

Requisito mínimo: pelo menos **1 item válido**.

| Campo | Obrigatório | Regra |
|---|---:|---|
| Nome | Sim | Nome apresentado ao cliente |
| Tipo | Sim | Produto / Serviço |
| Descrição para o cliente | Sim | Explicação autorizada |
| Como informar preço | Sim | Fixo / A partir de / Sob consulta / Não informar |
| Valor | Condicional | Obrigatório em Fixo/A partir de |
| Pode ser agendado | Condicional | Disponível para Serviço |
| Duração | Condicional | Obrigatória quando agendável |
| Condições/observações | Não | Condições autorizadas |

Regras:
- preço não cadastrado não pode ser inventado;
- `Sob consulta` não autoriza criar valor;
- `Não informar` impede exposição de preço;
- excluir item salvo exige confirmação.

## 6. Responsabilidades

Responsabilidades são capacidades de trabalho, não configurações técnicas.

Não existe responsabilidade arbitrária/customizada no MVP.

### Essenciais — não removíveis

- Receber clientes
- Identificar a necessidade do cliente
- Encaminhar para uma pessoa quando necessário

### Configuráveis

- Responder dúvidas
- Explicar produtos e serviços
- Informar preços e condições autorizadas
- Agendar
- Confirmar agendamento
- Reagendar
- Cancelar
- Fazer follow-up
- Recuperar contatos/oportunidades abandonadas
- Enviar lembretes
- Identificar insatisfação

Dependências:
- agenda habilitada → Google Calendar obrigatório;
- follow-up/recuperação/lembrete → Google Tasks obrigatório;
- WhatsApp → sempre obrigatório.

## 7. Regras e limites

### Limites de sistema

Visíveis e não editáveis:
- não fingir ser humano;
- não inventar informação;
- não informar preço/condição não autorizada;
- não negociar fora das regras;
- não fazer promessa não autorizada;
- não tomar decisão excepcional fora da autonomia;
- não emitir diagnóstico/orientação profissional regulada;
- chamar humano em risco, exceção, pedido explícito ou julgamento humano.

Mensagem:

> **Estes limites protegem sua empresa e seus clientes e não podem ser desativados.**

### Regras da empresa

Campos:
- Regra — obrigatório
- Quando se aplica — opcional

Para concluir:
- revisar limites; e
- escolher `Não tenho regras adicionais` ou cadastrar ao menos uma regra válida.

## 8. Autonomia

Definida **por responsabilidade habilitada**.

Níveis:

- 🟢 **Pode decidir**
- 🟡 **Pode decidir sob regras**
- 🔴 **Precisa de humano**

Cor nunca substitui label.

Ordem de permissividade:

> 🟢 Pode decidir → 🟡 Pode decidir sob regras → 🔴 Precisa de humano

### Recomendação inicial vs. teto máximo

**Decisão PD7:** são conceitos distintos.

- **Recomendação inicial** é o nível sugerido ao gestor.
- **Teto máximo permitido** é o nível mais permissivo que o produto autoriza.
- O gestor pode escolher o teto ou qualquer nível mais conservador.
- O gestor nunca pode escolher um nível mais permissivo que o teto.
- No Braço Atendimento v1, recomendação e teto possuem os mesmos valores.
- Essa coincidência vale para o catálogo v1; versões futuras podem recomendar
  um nível mais conservador que o teto sem alterar a regra estrutural.

| Responsabilidade | Recomendação inicial | Teto máximo permitido |
|---|---|---|
| Receber clientes | 🟢 Pode decidir | 🟢 Pode decidir |
| Identificar necessidade | 🟢 Pode decidir | 🟢 Pode decidir |
| Encaminhar para humano | 🟢 Pode decidir | 🟢 Pode decidir |
| Responder dúvidas cadastradas | 🟢 Pode decidir | 🟢 Pode decidir |
| Explicar produtos/serviços | 🟢 Pode decidir | 🟢 Pode decidir |
| Informar preços autorizados | 🟢 Pode decidir | 🟢 Pode decidir |
| Agendar | 🟢 Pode decidir | 🟢 Pode decidir |
| Confirmar | 🟢 Pode decidir | 🟢 Pode decidir |
| Reagendar | 🟡 Pode decidir sob regras | 🟡 Pode decidir sob regras |
| Cancelar | 🟡 Pode decidir sob regras | 🟡 Pode decidir sob regras |
| Follow-up | 🟡 Pode decidir sob regras | 🟡 Pode decidir sob regras |
| Recuperação | 🟡 Pode decidir sob regras | 🟡 Pode decidir sob regras |
| Lembretes | 🟡 Pode decidir sob regras | 🟡 Pode decidir sob regras |
| Identificar insatisfação | 🟢 Pode decidir | 🟢 Pode decidir |

### Comportamento

- toda responsabilidade habilitada deve possuir nível válido;
- toda opção 🟡 exige **Condição**;
- opções mais permissivas que o teto devem permanecer compreensíveis na UI,
  mas indisponíveis para seleção;
- a UI deve explicar:
  **"Este nível de autonomia não está disponível para esta responsabilidade."**
- o backend também deve rejeitar valor acima do teto;
- limites de sistema continuam prevalecendo sobre qualquer escolha do gestor.

## 9. Pessoas e responsáveis

Escopo MVP: selecionar **usuários ativos da empresa no BRAÇO**.

### Responsável principal
Obrigatório.

Mostrar:
- nome;
- role;
- e-mail.

### Responsável reserva
Opcional e diferente do principal.

Fora do escopo:
- criar/convidar usuário;
- plantão;
- roteamento por departamento;
- distribuição avançada de handoff.

## 10. Comunicação

Transparência digital é fixa:

> **O funcionário nunca finge ser humano.**

### Tom base — obrigatório
- Profissional e próximo
- Acolhedor
- Direto e objetivo
- Formal

### Forma de tratamento — obrigatório
- Primeiro nome
- Senhor/Senhora
- Neutro sem nome

### Tamanho — obrigatório
- Curtas e objetivas
- Equilibradas
- Detalhadas quando necessário

### Emojis — obrigatório
- Não usar
- Usar com moderação
- Usar quando fizer sentido

Opcionais:
- termos preferidos;
- termos a evitar.

A UI mostra preview sem exigir LLM.

Recomendado:
- Profissional e próximo;
- Primeiro nome;
- Equilibradas;
- Usar com moderação.

## 11. Recursos

Detalhe:
`docs/design/24-work-resources-ui-spec.md`

Resumo:
- WhatsApp obrigatório;
- Calendar condicional a agenda;
- Tasks condicional a follow-up/recuperação/lembrete.

## 12. Revisão

Não entra no denominador de 8 etapas.

Estados:
- Bloqueada
- Disponível
- Concluída

### Bloqueada
Mostrar pendências + `Corrigir`.

### Disponível
Mostrar resumo completo + CTA:

> **Concluir preparação**

Confirmação:

> **Concluir preparação de [nome]?**

> O Manual de Trabalho está completo. O funcionário ficará **Pronto para ativação**, mas ainda não começará a trabalhar.

Ações:
- Voltar e revisar
- Concluir preparação

Resultado:
- Manual revisado;
- Employee Status = `PRONTO`;
- sem ativação.

## 13. Edição após conclusão

Antes da ativação, o Manual pode ser editado.

Se requisito obrigatório ficar inválido:
- etapa deixa de ser Completa;
- funcionário volta a `PREPARANDO`;
- motivo fica visível.

## 14. Ownership

### Compartilhado
- Empresa
- Produtos e serviços

### Específico do funcionário
- Responsabilidades
- Regras específicas
- Autonomia
- Responsáveis atribuídos
- Comunicação
- Recursos necessários
