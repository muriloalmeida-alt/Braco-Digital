# BRAÇO — Information Architecture

## 1. Objetivo

Organizar o produto ao redor de gestão de equipe e trabalho.

## 2. Arquitetura principal

```text
BRAÇO
├── Minha Equipe
│   ├── Funcionário
│   │   ├── Visão geral
│   │   ├── Trabalho
│   │   ├── Conversas
│   │   ├── Agenda
│   │   ├── Tarefas
│   │   ├── Manual de Trabalho
│   │   └── Resultados
│   │
│   └── Contratar funcionário
│
├── Trabalho
│   ├── Conversas
│   ├── Agenda
│   ├── Tarefas
│   └── Alertas
│
├── Resultados
│
└── Empresa
    ├── Dados da empresa
    ├── Produtos e serviços
    ├── Pessoas e responsáveis
    ├── Integrações
    └── Permissões
```

## 3. Minha Equipe

É a home conceitual do produto.

Primeira pergunta:
> Como está minha equipe?

## 4. Funcionário

A página de funcionário concentra tudo relacionado à função daquela pessoa digital.

## 5. Trabalho

Área transversal para o gestor acompanhar o que está acontecendo independentemente do funcionário.

## 6. Empresa

Configura contexto compartilhado.

Evitar duplicar configurações comuns dentro de cada funcionário.

## 7. Resultados

Mostra valor gerado pela equipe.

## 8. Alertas

Devem ser acessíveis contextual e transversalmente.

## 9. Regra

Arquitetura deve continuar válida quando existirem vários tipos de Braço.
