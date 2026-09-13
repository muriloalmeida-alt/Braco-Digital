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

Regras e limites de contato fazem parte do Manual de Trabalho.

## Templates de WhatsApp (PD2)

Fora da janela de 24h de atendimento, o contato proativo com o cliente só
pode ocorrer via **template pré-aprovado pela Meta/BSP** — não é texto
livre gerado pelo funcionário digital. MVP com 5 intenções de template:

1. Follow-up de interesse
2. Agendamento incompleto
3. Lembrete de agendamento
4. Reagendamento
5. Recuperação de oportunidade

Cada template tem: texto e variáveis controladas ainda a definir (Design
Ready até o fim da Sprint 02); condições de uso (qual intenção dispara qual
template); fallback (o que o produto faz quando a intenção não tem template
aplicável ou o template foi rejeitado); limites de contato (herdados das
regras de follow-up do Manual de Trabalho); estados de envio — enviando,
enviado, entregue, falha, **rejeitado pela Meta**.

## Estados de envio de template

- enviando;
- enviado;
- entregue;
- falha de envio;
- rejeitado (template não aprovado/rejeitado pela Meta) — deve ser
  distinguível de falha técnica comum e tratado como Atenção necessária.

## M3
- List
- Cards
- Chips quando semanticamente adequados
- Menus
- Snackbar
- Dialog apenas quando necessário
