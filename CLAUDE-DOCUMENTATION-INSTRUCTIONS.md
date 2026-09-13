# Instruções de documentação para Claude

## Localização
- `README.md` pertence à **raiz do repositório**.
- `docs/` é a documentação oficial do produto.
- `docs/prd/` contém PRDs aprovados.
- `docs/delivery/` contém backlog, épicos, histórias e sprints.

Não mover o `README.md` raiz para dentro de `docs/`.

## Regra principal
> **Docs definem. Issues operacionalizam. Código implementa.**

A documentação define **o que** o produto deve fazer. Engenharia decide **como** implementar, preservando o comportamento aprovado.

## Responsabilidades
### Murilo — Product Owner / Sponsor
Visão, estratégia, prioridades, decisões de negócio e aprovação de mudanças relevantes.

### ChatGPT — Product Manager
Requisitos, PRDs, épicos, histórias, critérios de aceitação, priorização, sprints e documentação de delivery.

### Claude — Engineering / Development
Arquitetura técnica, implementação, testes, PRs e impedimentos.

## Mudanças de comportamento
Se uma descoberta técnica exigir mudança no comportamento:
1. não alterar silenciosamente;
2. registrar impacto;
3. retornar ao PM;
4. decidir;
5. atualizar documentação;
6. implementar.

## Regras
- Não apagar requisitos aprovados sem decisão explícita.
- Não substituir documentos oficiais por resumos.
- Não iniciar desenvolvimento sem história suficientemente definida.
- Atualizar docs quando uma decisão relevante mudar.

## Product Design e Material 3

O GPT também é o **Product Designer** do BRAÇO.

O Google Material Design 3 (M3) é a fonte de verdade do Design System.

Antes de implementar histórias com interface, leia as referências relevantes em `docs/design/`.

Engenharia não deve:
- criar um Design System paralelo;
- inventar componentes quando um padrão M3 adequado existir;
- alterar fluxo, status, hierarquia ou interação aprovada sem retornar ao PM/Product Designer.

Gate:

> **Product Ready + Design Ready + Tech Ready**

Claude é responsável por **Tech Ready**.  
GPT é responsável por **Product Ready + Design Ready**.
