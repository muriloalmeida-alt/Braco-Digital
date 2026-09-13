# Fluxo 02 — Preparação do Funcionário

## Objetivo

Transformar contexto da empresa em um Manual de Trabalho utilizável e revisado.

## Estrutura

```text
Preparação
├── Empresa
├── Produtos e serviços
├── Responsabilidades
├── Regras e limites
├── Autonomia
├── Pessoas e responsáveis
├── Comunicação
├── Recursos de trabalho
└── Revisão
```

As oito primeiras etapas contêm conteúdo. `Revisão` é o gate final e não
entra no denominador do progresso.

## Princípios

- progressão clara;
- autosave;
- permitir retornar;
- obrigatório vs. opcional explícito;
- explicar por que cada informação importa;
- mostrar incompletude;
- linguagem de trabalho, não tecnologia;
- proteger limites de sistema;
- concluir preparação não é ativar.

## Overview

Mostrar:
- nome/função;
- Employee Status;
- `X de 8 etapas completas`;
- próximo item recomendado;
- estado de cada etapa;
- Revisão.

### Status de etapa
- Não iniciada
- Em andamento
- Completa

### Revisão
- Bloqueada
- Disponível
- Concluída

## Continuidade

US06 (Sprint 01) entregou:
- entrada;
- overview;
- estrutura vazia.

US07–US16 tornam a preparação funcional.
US17, no E03, fecha a ponte de status para `Pronto`.

## Fluxo principal

```text
Overview
→ Empresa
→ Produtos e serviços
→ Responsabilidades
→ Regras e limites
→ Autonomia
→ Pessoas e responsáveis
→ Comunicação
→ Recursos de trabalho
→ Revisão
→ Concluir preparação
→ Status: Pronto
```

## Autosave

Alterações válidas são salvas progressivamente.

Feedback:
- Salvando…
- Salvo
- Não foi possível salvar

Não existe botão `Salvar`.

## Conclusão de etapa

CTA:

> **Continuar**

Se válida:
- etapa = Completa;
- navegar para próxima.

Se inválida:
- permanecer;
- exibir erros;
- foco no primeiro erro.

## Conteúdo

- `docs/design/22-work-manual-content-model.md`
- `docs/design/23-preparation-experience-spec.md`
- `docs/design/24-work-resources-ui-spec.md`

## Autonomia

- 🟢 Pode decidir
- 🟡 Pode decidir sob regras
- 🔴 Precisa de humano

Não depender de cor.

Toda opção 🟡 exige condição.

## Revisão

Antes de Pronto:
- resumo;
- pendências;
- atalhos;
- confirmação explícita.

CTA:

> **Concluir preparação**

Mensagem deixa claro que ficará Pronto, mas ainda não começará a trabalhar.

## Compact / Medium
Uma etapa por vez.

## Expanded
Navegação interna persistente + conteúdo.

## Estados
- loading;
- não iniciada;
- em andamento;
- completa;
- erro de validação;
- erro de salvamento;
- integração precisa de atenção;
- pronto para revisão;
- preparação concluída.

## Regra de segurança

Se configuração obrigatória for invalidada antes da ativação:

> `Pronto` → `Preparando`
