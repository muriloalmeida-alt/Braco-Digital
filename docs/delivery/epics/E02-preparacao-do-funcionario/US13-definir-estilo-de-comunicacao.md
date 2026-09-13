# US13 — Definir estilo de comunicação

**Épico:** E02 — Preparação do Funcionário  
**Prioridade:** P0  
**Sprint planejada:** Sprint 02  
**Product Ready:** YES  
**Design Ready:** YES  
**Tech Ready:** PENDING ENGINEERING REVIEW

## Contexto

O gestor escolhe como o funcionário conversa sem escrever prompts
técnicos. A transparência digital continua obrigatória.

## História de usuário

Como **gestor**, quero **definir o estilo de comunicação**, para que **o
Braço converse de forma coerente com minha empresa e com a identidade
digital transparente do produto**.

## Critérios de aceitação

- [ ] Transparência digital aparece como regra fixa e não pode ser desativada.
- [ ] O gestor escolhe Tom base entre as quatro opções aprovadas.
- [ ] O gestor escolhe Forma de tratamento.
- [ ] O gestor escolhe Tamanho das respostas.
- [ ] O gestor escolhe política de Emojis.
- [ ] Termos preferidos e a evitar são opcionais.
- [ ] A interface apresenta preview sem depender de LLM.
- [ ] O preview não é apresentado como conversa real.
- [ ] Continuar conclui quando as quatro escolhas obrigatórias estiverem válidas.

## Regras de negócio

- O funcionário nunca finge ser humano.
- Opções recomendadas podem ser destacadas, mas a escolha é do gestor.
- Não expor prompt/modelo.

## Dependências

- Brand/content design.
- PRD de transparência digital.

## Fora do escopo

- Editor de prompt.
- Personalidade arbitrária de IA.
- Treinamento de modelo.
- LLM obrigatório para preview.

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
