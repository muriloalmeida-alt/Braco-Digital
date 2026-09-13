# BRAÇO — Product Design

Esta pasta contém a fundação e as regras oficiais de Product Design do BRAÇO.

## Responsabilidade

No BRAÇO, o GPT exerce papel duplo:

- **Product Manager**
- **Product Designer**

Portanto, requisitos funcionais e experiência de produto são definidos de forma integrada antes do handoff para Engenharia.

## Fonte de verdade

O **Google Material Design 3 (M3)** é o Design System canônico do BRAÇO.

O BRAÇO não mantém um Design System paralelo ao M3.

A camada própria do produto serve para:

1. tematizar o M3 com a identidade BRAÇO;
2. definir princípios de experiência;
3. criar padrões específicos do domínio;
4. definir arquitetura de informação;
5. definir navegação;
6. definir fluxos;
7. documentar estados e regras responsivas;
8. preparar histórias para desenvolvimento.

## Hierarquia

```text
Material Design 3
        ↓
Tema BRAÇO
        ↓
Padrões de Produto BRAÇO
        ↓
Arquitetura de Informação
        ↓
Fluxos
        ↓
Telas
        ↓
Implementação
```

## Regra

> **Material 3 define a linguagem do sistema. BRAÇO define a experiência do trabalho.**

Quando o M3 já resolve corretamente um problema de interface, o padrão M3 deve ser utilizado.

Componentes próprios são exceção e devem preferencialmente ser composições de componentes M3.

## Gate

Nenhuma história com impacto de interface entra em desenvolvimento sem:

> **Product Ready + Design Ready + Tech Ready**
