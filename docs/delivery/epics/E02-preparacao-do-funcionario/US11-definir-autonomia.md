# US11 — Definir autonomia

**Épico:** E02 — Preparação do Funcionário  
**Prioridade:** P0  
**Sprint planejada:** Sprint 02  
**Product Ready:** YES  
**Design Ready:** YES  
**Tech Ready:** PENDING ENGINEERING REVIEW

## Contexto

Autonomia define quanto o funcionário pode decidir para cada
responsabilidade habilitada.

## História de usuário

Como **gestor**, quero **definir a autonomia por responsabilidade**, para
que **meu Braço saiba quando agir sozinho, quando seguir uma regra e quando
chamar uma pessoa**.

## Critérios de aceitação

- [ ] Cada responsabilidade habilitada aparece em Autonomia.
- [ ] Cada item usa Pode decidir, Pode decidir sob regras ou Precisa de humano.
- [ ] Texto acompanha toda cor/ícone.
- [ ] O produto apresenta nível recomendado.
- [ ] O gestor pode tornar uma decisão mais conservadora, nunca mais permissiva que o limite do produto.
- [ ] Pode decidir sob regras exige uma condição.
- [ ] Todas as responsabilidades habilitadas precisam ter nível válido.
- [ ] A etapa só fica Completa quando níveis/condições obrigatórios estiverem válidos.
- [ ] Alterar responsabilidades atualiza a lista sem apagar escolhas ainda aplicáveis.

## Regras de negócio

- Autonomia é por responsabilidade, não global.
- 🟢 mais autônomo, 🟡 condicional, 🔴 humano.
- Limites de sistema prevalecem.
- 🟡 sem condição fica incompleto.

## Dependências

- US09 — responsabilidades.
- US10 — regras e limites.
- US12 — responsável humano.

## Fora do escopo

- Autonomia por prompt livre.
- Ultrapassar limite de produto.
- Roteamento avançado.

## Design

Gate:

> **Product Ready + Design Ready + Tech Ready**

### Referências

- `docs/design/flows/02-preparation.md`
- `docs/design/22-work-manual-content-model.md`
- `docs/design/23-preparation-experience-spec.md`

### Design Ready

- [x] fluxo definido;
- [x] campos/conteúdo definidos;
- [x] obrigatoriedade definida;
- [x] validação definida;
- [x] estados definidos;
- [x] responsividade definida;
- [x] acessibilidade considerada;
- [x] Brand UI Foundation aplicável.

## Definition of Done

- critérios atendidos;
- testes adequados;
- autosave/estado validados quando aplicável;
- Compact/Medium/Expanded validados;
- acessibilidade validada;
- documentação atualizada quando necessário;
- nenhuma mudança de produto feita silenciosamente.

## Referências de Produto

- `docs/prd/01-braco-atendimento.md`
- `docs/prd/02-plataforma-gerencial.md`
