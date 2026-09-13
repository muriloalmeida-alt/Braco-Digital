# BRAÇO — Content Design

## 1. Voz

BRAÇO fala de forma:

- clara;
- direta;
- humana;
- profissional;
- simples.

## 2. Vocabulário preferido

Usar:
- funcionário;
- equipe;
- preparar;
- trabalhar;
- acompanhar;
- resultado;
- conversa;
- tarefa;
- agenda;
- responsável;
- regra;
- limite;
- autonomia.

Evitar na experiência principal:
- prompt;
- token;
- LLM;
- agente;
- webhook;
- API;
- automação;
- modelo.

## 3. CTAs

CTAs devem descrever ação real.

Preferir:
- Contratar funcionário
- Continuar preparação
- Ativar funcionário
- Assumir conversa
- Reagendar
- Resolver pendência

Evitar:
- Continuar
- Confirmar
- Executar
quando houver alternativa mais específica.

## 4. Erros

Estrutura:
1. o que aconteceu;
2. impacto;
3. o que fazer.

## 5. Alertas

Estrutura:
- título objetivo;
- contexto;
- consequência;
- ação.

## 6. Transparência digital

No canal com cliente, sempre manter identidade digital clara sem repetir de forma robótica a cada mensagem.

## 7. Conteúdo de templates de WhatsApp (PD2)

Fora da janela ativa permitida pelo WhatsApp, mensagens proativas usam
templates pré-aprovados, não texto livre.

Biblioteca oficial v1 de Product Design:

- `docs/design/19-whatsapp-template-library.md`

As 5 intenções do MVP são:
1. follow-up de interesse;
2. agendamento incompleto;
3. lembrete de agendamento;
4. reagendamento;
5. recuperação de oportunidade.

Para cada intenção, a biblioteca define:
- texto v1;
- variáveis controladas;
- transparência digital;
- condição de uso;
- regra para dados sensíveis;
- fallback;
- limites de contato;
- estados visíveis ao gestor.

### Estado

O conteúdo v1 está:

> **Content Design Ready**

A disponibilidade operacional de cada template continua condicionada à
aprovação/configuração no Meta/BSP.

Engenharia não deve alterar texto, variável ou intenção para contornar
rejeição do provedor sem retornar a Produto/Design.
