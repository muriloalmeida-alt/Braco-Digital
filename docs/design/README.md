# BRAÇO — Product Design

Esta pasta contém a fundação e as regras oficiais de Product Design do BRAÇO.

## Responsabilidade

No BRAÇO, o GPT exerce papel duplo:

- **Product Manager**
- **Product Designer**

Portanto, requisitos funcionais e experiência de produto são definidos de
forma integrada antes do handoff para Engenharia.

## Fontes de verdade

### Design System

O **Google Material Design 3 (M3)** é o Design System canônico do BRAÇO.

M3 governa:

- componentes;
- estados;
- comportamento;
- acessibilidade;
- responsividade/adaptabilidade;
- color roles;
- typography roles;
- shape roles;
- motion.

### Identidade visual

O **Guia de Identidade Visual do BRAÇO Digital v1.0** é a fonte de verdade
para expressão da marca:

- logo;
- cores de marca;
- tipografia de marca;
- tom visual;
- iconografia;
- proporção e aplicação da identidade.

Quando uma decisão provisória anterior do Tema BRAÇO conflitar com o Guia,
o Guia prevalece para a expressão da marca.

Isso não substitui o M3.

## Hierarquia

```text
Material Design 3
        +
Guia de Identidade Visual BRAÇO
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

> **M3 define como a interface funciona. A identidade BRAÇO define como ela se expressa.**

O produto não cria um Design System concorrente ao M3.

## Documentos de marca no produto

- `03-theme-strategy.md`
- `04-color-system.md`
- `05-typography.md`
- `06-shape-elevation-iconography.md`
- `20-brand-ui-integration.md`
- `21-logo-usage.md`

## Gate

Nenhuma história com impacto de interface entra em desenvolvimento sem:

> **Product Ready + Design Ready + Tech Ready**
