# BRAÇO — Sprint 02 Wireframes

**Status:** Approved — Design Ready  
**Fidelidade:** estrutural / comportamento  
**Design System:** M3 + Brand UI Foundation

Estes wireframes definem hierarquia e composição. Não substituem os tokens,
componentes e responsividade documentados.

## 1. Overview — Expanded

```text
┌───────────────────────────────────────────────────────────────────────────┐
│ Preparar Ana                                      [Preparando]            │
│ Recepcionista Digital                                                    │
│ 5 de 8 etapas completas                                                  │
│                                                                           │
│ ┌─ ETAPAS ─────────────────┐  ┌─ PRÓXIMO PASSO ────────────────────────┐ │
│ │ ✓ Empresa               │  │ Regras e limites                       │ │
│ │ ✓ Produtos e serviços   │  │ Defina o que Ana deve sempre respeitar│ │
│ │ ✓ Responsabilidades     │  │                           [Continuar]   │ │
│ │ ○ Regras e limites      │  └────────────────────────────────────────┘ │
│ │ ○ Autonomia             │                                             │
│ │ ○ Pessoas               │  Revisão                                   │
│ │ ○ Comunicação           │  Bloqueada — faltam 3 etapas               │
│ │ ○ Recursos              │                                             │
│ │─────────────────────────│                                             │
│ │ 🔒 Revisão              │                                             │
│ └─────────────────────────┘                                             │
└───────────────────────────────────────────────────────────────────────────┘
```

## 2. Overview — Compact

```text
┌────────────────────────────────┐
│ ‹ Funcionário                  │
│ Preparar Ana                   │
│ [Preparando]                   │
│ 5 de 8 etapas completas        │
│                                │
│ Próximo item recomendado       │
│ Regras e limites               │
│ [Continuar preparação]         │
│                                │
│ ETAPAS                         │
│ ✓ Empresa             Completa │
│ ✓ Produtos            Completa │
│ ✓ Responsabilidades  Completa │
│ ○ Regras          Não iniciada │
│ ○ Autonomia       Não iniciada │
│ ...                            │
│                                │
│ Revisão              Bloqueada │
└────────────────────────────────┘
```

## 3. Formulário padrão — Expanded

```text
┌─ ETAPAS ───────────────┐  ┌──────────────────────────────────────────────┐
│ ✓ Empresa              │  │ Empresa                                     │
│ ○ Produtos             │  │ Compartilhado com sua equipe digital        │
│ ○ Responsabilidades    │  │                                              │
│ ...                    │  │ Nome para atendimento *                       │
│                        │  │ [ Clínica Vida________________________ ]      │
│                        │  │                                              │
│                        │  │ Sobre a empresa *                             │
│                        │  │ [_______________________________________]     │
│                        │  │                                              │
│                        │  │ Forma de atendimento *                        │
│                        │  │ (•) Presencial ( ) Online ( ) Ambos           │
│                        │  │                                              │
│                        │  │ ...                                          │
│                        │  │                    Salvo                       │
│                        │  │                         [Continuar]            │
└────────────────────────┘  └──────────────────────────────────────────────┘
```

## 4. Produtos e serviços

```text
Produtos e serviços
Compartilhado com sua equipe digital

┌──────────────────────────────────────────────────────────────┐
│ Consulta inicial                      Serviço                │
│ Valor fixo · R$ 150 · Agendável · 60 min                    │
│                                             Editar · Excluir │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ Retorno                               Serviço                │
│ Não informar preço · Agendável · 30 min                     │
│                                             Editar · Excluir │
└──────────────────────────────────────────────────────────────┘

[+ Adicionar produto ou serviço]

                                                [Continuar]
```

### Modal/Drawer de item

```text
Adicionar serviço

Nome *
[________________________________]

Tipo *
( ) Produto   (•) Serviço

Descrição para o cliente *
[________________________________]
[________________________________]

Como informar preço *
[ Valor fixo ▼ ]

Valor *
[R$ __________]

Pode ser agendado?
[✓]

Duração *
[60] minutos

Condições/observações
[________________________________]

[Cancelar]                         [Adicionar]
```

## 5. Responsabilidades

```text
Responsabilidades

ESSENCIAIS
✓ Receber clientes                     Obrigatória
✓ Identificar a necessidade             Obrigatória
✓ Encaminhar para humano                Obrigatória

CONFIGURÁVEIS
[✓] Responder dúvidas
[✓] Explicar produtos e serviços
[✓] Informar preços autorizados
[✓] Agendar                         → exige Calendar
[✓] Confirmar                       → exige Calendar
[ ] Reagendar
[ ] Cancelar
[✓] Fazer follow-up                 → exige Tasks
[ ] Recuperar contatos
[✓] Enviar lembretes                → exige Tasks
[✓] Identificar insatisfação

                                                [Continuar]
```

## 6. Regras e limites

```text
Regras e limites

REGRAS DO BRAÇO
┌─────────────────────────────────────────────────────────────┐
│ 🛡 Não inventar informações                                │
│ Regra do BRAÇO · não pode ser desativada                   │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│ 🛡 Chamar uma pessoa em exceções                           │
│ Regra do BRAÇO · não pode ser desativada                   │
└─────────────────────────────────────────────────────────────┘

REGRAS DA EMPRESA

( ) Não tenho regras adicionais
(•) Quero adicionar regras

┌─────────────────────────────────────────────────────────────┐
│ Cancelamento perto do horário                              │
│ Menos de 2h → chamar uma pessoa                            │
│                                             Editar · Excluir│
└─────────────────────────────────────────────────────────────┘

[+ Adicionar regra]

                                                [Continuar]
```

## 7. Autonomia

```text
Autonomia

Responder dúvidas
Recomendado: Pode decidir
(•) Pode decidir
( ) Pode decidir sob regras
( ) Precisa de humano

Reagendar
Recomendado: Sob regras
( ) Pode decidir
(•) Pode decidir sob regras
( ) Precisa de humano

Condição *
[ Pode reagendar quando houver horário disponível e... ]

Cancelar
( ) Pode decidir
(•) Pode decidir sob regras
( ) Precisa de humano

Condição *
[ Cancelar sozinho com mais de 2 horas de antecedência ]

                                                [Continuar]
```

No Compact, cada responsabilidade vira um card vertical.

## 8. Pessoas e responsáveis

```text
Pessoas e responsáveis

Responsável principal *
┌─────────────────────────────────────────────────────────────┐
│ Murilo Almeida                                             │
│ Owner · murilo@empresa.com                                 │
│ Recomendado                                                │
└─────────────────────────────────────────────────────────────┘

Responsável reserva
[ Selecionar pessoa ▼ ]

                                                [Continuar]
```

## 9. Comunicação

```text
Comunicação

Seu Braço sempre se identifica como atendimento digital.

Tom
[ Profissional e próximo ] [ Acolhedor ]
[ Direto e objetivo      ] [ Formal     ]

Forma de tratamento
(•) Primeiro nome
( ) Senhor/Senhora
( ) Neutro sem nome

Tamanho
( ) Curtas e objetivas
(•) Equilibradas
( ) Detalhadas quando necessário

Emojis
( ) Não usar
(•) Usar com moderação
( ) Usar quando fizer sentido

┌─ EXEMPLO ──────────────────────────────────────────────────┐
│ Olá, João! Eu sou a Ana, assistente digital da Clínica    │
│ Vida. Posso ajudar com informações e agendamentos.        │
└────────────────────────────────────────────────────────────┘

                                                [Continuar]
```

## 10. Recursos

```text
Recursos de trabalho

┌──────────────────────────────────────────────────────────────┐
│ WhatsApp                                      Não configurado│
│ Obrigatório para atendimento                                 │
│                                      [Conectar WhatsApp]     │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ Google Calendar                                     Conectado│
│ Agenda necessária porque Agendar está habilitado             │
│ agenda@empresa.com · Agenda principal                        │
│                                      [Ver configuração]      │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ Google Tasks                                     Não necessário│
│ Nenhuma responsabilidade atual exige tarefas                 │
└──────────────────────────────────────────────────────────────┘

                                         [Ir para revisão]
```

## 11. Revisão — bloqueada

```text
Revisar Manual de Trabalho

6 de 8 etapas completas

✓ Empresa                         [Revisar]
✓ Produtos e serviços            [Revisar]
✓ Responsabilidades              [Revisar]
✓ Regras e limites               [Revisar]
✓ Autonomia                      [Revisar]
✓ Pessoas                        [Revisar]
! Comunicação
  Escolha como os emojis devem ser usados.          [Corrigir]
! Recursos
  Conecte o WhatsApp.                               [Corrigir]

[Concluir preparação] — indisponível
```

## 12. Revisão — pronta

```text
Revisar Manual de Trabalho

8 de 8 etapas completas
Tudo pronto para a revisão final.

✓ Empresa                         [Revisar]
✓ Produtos e serviços            [Revisar]
✓ Responsabilidades              [Revisar]
✓ Regras e limites               [Revisar]
✓ Autonomia                      [Revisar]
✓ Pessoas                        [Revisar]
✓ Comunicação                    [Revisar]
✓ Recursos                       [Revisar]

                              [Concluir preparação]
```

## 13. Confirmação

```text
Concluir preparação de Ana?

O Manual de Trabalho está completo.

Ana ficará PRONTA PARA ATIVAÇÃO, mas ainda não começará a trabalhar.

[Voltar e revisar]                 [Concluir preparação]
```

## 14. Success

```text
✓ Preparação concluída

Ana está Pronta para a próxima etapa.

[Pronto]

[Ver Manual de Trabalho]
[Voltar para o funcionário]
```

Não mostrar botão de ativação até a Sprint 03 fornecer a capacidade real.

## 15. Estados de salvamento

No topo/rodapé contextual da etapa:

```text
Salvando…
```

ou

```text
✓ Salvo
```

Erro:

```text
Não foi possível salvar esta alteração. [Tentar novamente]
```

Não avançar fingindo que o dado está persistido.
