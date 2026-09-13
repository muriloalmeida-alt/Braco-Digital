# BRAÇO — Brand UI Integration

**Status:** Approved — implementação antes da Sprint 02  
**Owner:** GPT — Product Manager + Product Designer  
**Escopo:** identidade visual sobre a aplicação existente  
**Sem mudança funcional:** sim

## 1. Objetivo

Aplicar a identidade visual oficial do BRAÇO na aplicação já implementada
na Sprint 01, sem alterar regras de negócio ou fluxos.

Resultado desejado:

> **uma aplicação humana, simples e atraente para o gestor e sua equipe.**

## 2. Princípios

### Humana
- linguagem de equipe;
- nomes, funções e trabalho em primeiro plano;
- microcopy direta e acolhedora;
- tecnologia nos bastidores;
- estados compreensíveis sem jargão técnico.

### Simples
- uma ação principal por contexto;
- hierarquia clara;
- bastante respiro;
- progressive disclosure;
- poucas cores competindo.

### Atraente
- identidade consistente;
- contraste;
- superfícies limpas;
- navegação marcante;
- tipografia Manrope;
- detalhes de marca usados com moderação.

## 3. App Shell — Expanded

Direção aprovada:

### Navigation Drawer / Rail
- superfície: Azul Profundo `#07345A`;
- logo: versão negativa branca;
- texto/ícones: alto contraste;
- verde não deve ser usado como cor de seleção da navegação.

Estado ativo:
- container tonal/translúcido claro;
- texto/ícone com contraste;
- sem glow;
- sem neon.

### Workspace
- fundo: Off White `#F7F9FA`;
- cards: Branco;
- bordas: Cinza Claro;
- títulos: Grafite;
- CTA: Azul BRAÇO.

## 4. App Shell — Compact

Em Compact:

- evitar drawer permanentemente aberto;
- usar Top App Bar / navegação apropriada ao M3;
- preferir logo horizontal colorida quando houver largura;
- quando o espaço não comportar a assinatura horizontal, usar ícone/símbolo
  oficial;
- conteúdo continua sobre Off White/Surface.

## 5. Login

A tela de login é o momento mais institucional do app.

### Expanded
Permitido:

- painel de marca em Azul Profundo ou gradiente institucional
  `#07345A → #0B4F86`;
- logo negativa;
- assinatura como texto HTML separado:
  **Mais capacidade para sua empresa.**

Área de formulário:
- clara;
- simples;
- fundo branco/off white;
- sem ilustrações genéricas de IA.

### Compact
- reduzir decoração;
- logo vertical ou horizontal;
- tagline opcional em texto;
- formulário em primeiro plano.

## 6. Catálogo / Minha Equipe

Preservar os padrões funcionais já aprovados.

Aplicar identidade:

- cards brancos;
- raio 12px;
- borda leve;
- pouco ou nenhum shadow;
- títulos em Manrope;
- CTA azul;
- sucesso verde somente quando semanticamente positivo.

## 7. Preparação

A tela de preparação deve parecer uma orientação de trabalho, não um
formulário técnico.

Usar:

- títulos claros;
- progresso;
- espaços generosos;
- superfícies informativas Azul Claro quando útil;
- próximos passos explícitos.

Evitar:

- blocos densos;
- linguagem de configuração;
- múltiplos CTAs primários.

## 8. Status

### Trabalhando / Concluído / Conectado
Verde Capacidade.

### Preparando / Informativo
Azul / Azul Claro conforme role aplicável.

### Precisa de atenção
Warning semântico próprio.

### Erro
M3 error.

Nunca usar apenas cor.

## 9. Botões

Primary:
- Azul BRAÇO;
- texto branco;
- shape 8–10px.

Secondary:
- M3 outlined/tonal.

Verde:
- não é CTA padrão.

## 10. Cards

- radius: 12px;
- fundo branco;
- borda leve;
- sombra mínima;
- respiro interno consistente;
- não usar card dentro de card sem necessidade.

## 11. Empty states

Devem parecer úteis e humanos.

Estrutura:

1. ícone outline;
2. título;
3. explicação curta;
4. uma ação principal.

Sem ilustração futurista.

## 12. Motion

Sutil.

Usar para:

- mudança de estado;
- navegação;
- feedback.

Não usar como decoração.

## 13. Gradientes

Permitidos somente em superfícies institucionais:

- login;
- onboarding;
- apresentação institucional dentro do produto.

Não usar como fundo recorrente de cards, tabelas ou páginas operacionais.

## 14. Light e Dark

Light é a experiência de marca primária.

Dark continua suportado.

Ao validar dark:

- usar logo negativa;
- preservar Azul/Verde como identidade;
- manter contraste;
- evitar saturação excessiva.

## 15. Breakpoints de validação

Validar pelo menos:

- Compact: **380px**
- Medium: **768px**
- Expanded: **1440px**

## 16. Telas que devem ser revisadas nesta aplicação

Antes da Sprint 02:

- Login
- Minha Equipe
- Catálogo
- Detalhe do funcionário
- Visão geral do funcionário
- Preparação / overview

## 17. Não alterar

Este trabalho não pode alterar:

- regras de contratação;
- status de domínio;
- escopo de US06;
- catálogo;
- permissões;
- backend funcional;
- rotas;
- Sprint 02.

## 18. Acceptance Criteria

Brand UI Foundation está concluída quando:

- logo oficial aparece corretamente;
- favicon oficial está aplicado;
- seeds antigas foram removidas;
- Azul BRAÇO é o CTA principal;
- Verde Capacidade só é usado para semântica positiva;
- Manrope é a fonte principal com fallback;
- App Shell usa Azul Profundo na navegação expandida;
- fundo principal usa Off White;
- cards usam Branco e raio 12px;
- campos/botões seguem raio 8–10px;
- badges são pills quando aplicável;
- iconografia é outline e consistente;
- nenhuma tela usa clichê visual de IA;
- Light e Dark continuam funcionais;
- Compact/Medium/Expanded foram validados;
- fluxos da Sprint 01 não sofreram regressão.
