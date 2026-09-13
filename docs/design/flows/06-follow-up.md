# Fluxo 06 — Follow-up e Recuperação

## Objetivo
Garantir continuidade do trabalho sem contato excessivo.

## Fluxo

```text
Atendimento incompleto
→ Identificar follow-up
→ Definir próxima ação
→ Criar tarefa
→ Aguardar momento
→ Executar contato
→ Registrar resultado
→ Concluir ou programar próxima ação
```

## Visibilidade
O gestor deve saber:
- por que existe follow-up;
- quando será executado;
- estado;
- resultado.

## Estados
- programado;
- em execução;
- aguardando cliente;
- concluído;
- cancelado;
- precisa de atenção.

## Recuperação
O produto deve diferenciar trabalho ativo de spam.

Regras e limites de contato fazem parte do Manual de Trabalho e dos
guardrails do canal.

## Templates de WhatsApp (PD2)

Fora da janela ativa permitida pelo WhatsApp, o contato proativo com o
cliente só pode ocorrer via **template pré-aprovado pela Meta/BSP** — não é
texto livre gerado pelo funcionário digital.

MVP com 5 intenções:
1. Follow-up de interesse
2. Agendamento incompleto
3. Lembrete de agendamento
4. Reagendamento
5. Recuperação de oportunidade

Conteúdo v1, variáveis, guardrails e fallback:

- `docs/design/19-whatsapp-template-library.md`

### Decisão v1

Os templates são inicialmente **body-only**, sem botões.

A ação principal é o cliente responder à mensagem, reabrindo a conversa
para continuidade do atendimento.

## Guardrails do MVP

Resumo; a especificação oficial está em
`docs/design/19-whatsapp-template-library.md`.

- no máximo 1 mensagem proativa por cliente em 24h;
- follow-up/recuperação: no máximo 2 tentativas automáticas por oportunidade,
  com intervalo mínimo recomendado de 48h;
- agendamento incompleto: 1 retomada automática;
- lembrete: 1 lembrete automático no MVP;
- reagendamento: envio event-driven, sem repetição automática em sequência;
- opt-out interrompe follow-up e recuperação proativos;
- conteúdo sensível não deve ser exposto em template proativo.

## Fallback

Quando não existe template aplicável aprovado:

- **não enviar texto livre**;
- manter a ação como não executada;
- gerar `Precisa de atenção — template de WhatsApp indisponível`.

Quando um template for rejeitado:

- não substituir automaticamente por outra copy;
- registrar estado;
- devolver para Produto/Design se houver necessidade de revisão.

## Estados de envio de template

Estados técnicos podem existir internamente, mas a visão principal do
gestor usa linguagem de produto:

- Programado
- Enviando
- Enviado
- Entregue
- Não enviado
- Precisa de atenção

`Precisa de atenção` deve distinguir no detalhe:
- template indisponível/rejeitado;
- integração;
- falha técnica persistente.

## M3
- List
- Cards
- labels/status informativos
- Menus
- Snackbar
- Dialog apenas quando necessário
