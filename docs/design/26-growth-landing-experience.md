# BRAÇO — Growth Landing Experience

**Status:** Approved — Design Ready  
**Owner:** GPT — Product Manager + Product Designer  
**PRD:** 04 — Aquisição e Diagnóstico de Equipe  
**Sprint:** 02 — Track B Growth

## 1. Objetivo

Apresentar o BRAÇO de forma humana, simples e atraente e conduzir o visitante
para a experiência **Monte sua equipe**.

A landing deve explicar o produto pela ótica do trabalho que falta, não pela
tecnologia usada.

## 2. Direção

A landing pode ser mais emocional que o sistema gerencial, mas continua
subordinada a:

- Material Design 3;
- Guia de Identidade Visual;
- Brand UI Foundation;
- acessibilidade;
- responsividade.

Evitar:

- robôs;
- cérebros;
- neon;
- partículas futuristas;
- chat fake;
- "IA revolucionária";
- linguagem de automação.

## 3. Hero

Eyebrow opcional:

> **Funcionários digitais para pequenas empresas**

Headline:

> **Sua empresa precisa de mais um braço? Agora tem.**

Supporting text:

> Funcionários digitais que trabalham junto com sua equipe para manter o
> trabalho importante em movimento.

Primary CTA:

> **Montar minha equipe**

Secondary CTA:

> **Conhecer os Braços**

## 4. Como funciona

Três passos visuais:

### 1 — Conte o que está ficando para depois
Um diagnóstico rápido, sem login.

### 2 — Veja sua equipe recomendada
BRAÇO relaciona suas necessidades às funções do portfólio.

### 3 — Comece pelo que está disponível
Disponibilidade real e transparente.

## 5. Portfólio

Exibir os cinco Braços usando o mesmo conceito de Catalog Availability da
aplicação.

Não transformar `Em breve` em produto comprável.

Cards de landing podem ser mais resumidos que os cards do catálogo, mas
devem preservar:

- nome;
- função;
- resultado;
- disponibilidade.

## 6. Diagnóstico como principal interação

Título:

> **O que está faltando na sua equipe?**

Apoio:

> Conte onde o trabalho está acumulando e vamos montar uma equipe recomendada.

CTA:

> **Começar diagnóstico**

O diagnóstico pode ocupar uma seção da landing ou uma rota/experiência
dedicada. URL é decisão técnica.

## 7. Resultado antes do lead form

O usuário recebe primeiro:

> **Sua equipe recomendada**

Somente depois aparece a captura de contato.

Princípio:

> entregar valor antes de pedir dados.

## 8. CTA pós-resultado

### Quando há recomendação disponível

> **Quero montar minha equipe**

### Quando todas estão Em breve

> **Receber meu diagnóstico**

Não usar:

> Contratar agora

porque onboarding/contratação pública self-service não existe nesta fase.

## 9. FAQ mínimo

Perguntas:

### O que é um Braço?
Um funcionário digital preparado para executar uma função específica junto
com sua equipe.

### É uma pessoa?
Não. É um atendimento/funcionário digital e essa identidade é sempre
transparente.

### Preciso trocar meus sistemas?
O BRAÇO usa integrações para trabalhar; a gestão acontece dentro do BRAÇO.

### Todos os Braços já estão disponíveis?
Não. A experiência mostra claramente o que está disponível agora e o que
está Em breve.

### Preciso criar uma conta para fazer o diagnóstico?
Não.

## 10. CTA final

Headline:

> **Qual trabalho sua empresa não deveria continuar deixando para depois?**

CTA:

> **Montar minha equipe**

## 11. Visual

- superfícies claras;
- bastante respiro;
- Azul BRAÇO como ação;
- Verde apenas semântica positiva;
- Azul Profundo em blocos institucionais selecionados;
- cards 12px;
- shapes M3;
- Manrope;
- Lucide;
- motion discreto.

## 12. Motion

Permitido para:

- entrada entre passos;
- atualização de progresso;
- revelação do resultado.

Evitar:

- parallax excessivo;
- motion obrigatório para compreensão;
- animações longas.

Respeitar reduced motion.

## 13. Mobile

A experiência deve ser desenhada primeiro para 380px.

- CTA do hero visível sem interação complexa;
- cards empilhados;
- diagnóstico uma pergunta por passo;
- resultado em cards verticais;
- formulário simples;
- sem tabelas.

## 14. Desktop

Em 1440px:

- hero pode usar composição em duas áreas;
- diagnóstico permanece focado, sem parecer formulário corporativo;
- resultado pode usar grid de até 3 cards;
- largura de leitura limitada.

## 15. Acessibilidade

- headings hierárquicos;
- CTA com labels específicos;
- seleção de necessidades acessível por teclado;
- progress indicator com texto;
- foco movido para título do próximo passo;
- erros anunciáveis;
- disponibilidade em texto;
- contraste M3/BRAÇO.

## 16. Redesign v2 (visual + arquitetura de seções)

**Status:** Approved — implementado em `apps/web/src/pages/growth/LandingPage.tsx`
(redesign de identidade/composição; nenhuma regra de negócio alterada).

Motivação: a v1 lia como wireframe (pouca identidade visual, hero sem
demonstração concreta, cards genéricos, FAQ em texto corrido, header/
footer institucionais incompletos). O redesign manteve a UX/copy/regras
de domínio da v1 (portfólio real via backend, disponibilidade nunca
inventada, FAQ e "Como funciona" com o mesmo conteúdo aprovado) e mudou
composição, hierarquia e acabamento visual.

**Novo posicionamento central** (headline do hero, maior destaque da
página): **"Mais capacidade para sua empresa."** — substitui a headline
da v1 ("Sua empresa precisa de mais um braço? Agora tem.", §3 acima)
como a frase primária; a frase da v1 permanece válida como variação
secundária caso Produto queira reintroduzi-la em teste A/B futuro.

**Hero com tonalidade clara (revisado — sem "modo escuro"):** a primeira
versão deste redesign usava Azul Profundo (`--braco-color-nav-surface`)
como fundo do hero, tratando-o como "bloco institucional selecionado"
permitido por §11. A pedido do PO, essa versão foi revertida: o hero usa
`--braco-color-surface-secondary`/`--braco-color-on-surface-secondary`
(mesmo par de tokens do "Bloco de integrações" mais abaixo) — um azul
claro, não um fundo escuro — mantendo alguma diferenciação de ritmo
entre seções sem contrariar "superfícies claras" (§11). CTA primário e
secundário voltam ao tratamento padrão de `Button.css` (filled/outlined
em Azul BRAÇO); o destaque tipográfico no headline ("sua empresa.") usa
`--md-sys-color-primary` diretamente, sem precisar de uma variante para
superfície inversa. O painel que compõe o símbolo do BRAÇO no hero é
branco (`--md-sys-color-surface-container-lowest`) com sombra suave, no
lugar do painel translúcido pensado para fundo escuro.

**Header fixo + footer institucional (novos):** `PublicShell.tsx` ganhou
navegação completa (Conheça os Braços/Como funciona/Dúvidas — âncoras
`/#id` para funcionar a partir de qualquer rota pública — Entrar, CTA) e
um menu mobile acessível (`aria-expanded`, `Menu`/`X` do Lucide). O
rodapé usa a logo horizontal colorida (fundo claro, `docs/design/21-
logo-usage.md` §3) sobre uma superfície neutra clara
(`--md-sys-color-surface-container-low`), não mais a logo negativa
branca sobre fundo escuro da primeira versão. "Política de Privacidade"/
"Termos de Uso" aparecem como texto informativo (não como link) — as
páginas reais dependem do gate jurídico (PD em `docs/technical/16-
product-decisions-required.md`); nunca se fabricou conteúdo legal nem se
apontou para uma rota inexistente.

**Demonstração concreta do produto no Hero:** card flutuante
(`WhatsAppFloatingCard`) com o avatar oficial `08_avatar_whatsapp_e_
perfil.png` — mensagem sempre ilustrativa, nunca dado real. O restante
da composição visual do hero é o símbolo oficial do BRAÇO
(`07_simbolo_colorido.png`) sobre um painel branco — não uma foto de
pessoa: este ambiente de desenvolvimento não tem geração/banco de
fotografia disponível, então nenhuma imagem de "empreendedor trabalhando"
foi fabricada. **Pendência:** encomendar fotografia/ilustração real do
empreendedor + equipe digital quando Produto/Design tiverem o asset.

**Faixa de integrações (nova) + Demonstração de conversa (nova):** duas
aparições das marcas WhatsApp/Google Calendar/Google Tasks (topo do hero
e bloco dedicado antes do FAQ), sempre ícone + nome completo (nunca
"Google" isolado). Assets em `apps/web/public/marks/` — ver README no
mesmo diretório para proveniência/licença de cada um; o ícone do Google
Tasks é uma versão monocromática (não foi possível obter o ícone colorido
oficial completo nas condições de rede deste ambiente). **Pendência:**
substituir por asset oficial completo quando disponível.
`WhatsAppConversationDemo` é uma composição própria (Card BRAÇO + cores
de balão do canal), não uma captura da UI do WhatsApp.

**Portfólio com anatomia mais rica:** `BracoPortfolioCard` (ícone Lucide
por `key` do tipo, nome, função, missão, até 3 responsabilidades,
`CatalogAvailabilityLabel`, CTA só quando `AVAILABLE`) — sempre a partir
de `publicApi.listEmployeeTypes()`, nunca hardcoded; trata `loading`/
`error`/lista vazia com mensagem própria (antes, falha silenciosa virava
lista vazia sem explicação). É um componente novo, não `EmployeeTypeCard`
(que linka para rotas autenticadas — errado para um visitante anônimo).

**FAQ como accordion acessível (`FaqAccordion`):** mesmo conteúdo já
aprovado em §9, agora com `aria-expanded`/`aria-controls`, foco visível,
funciona por mouse/toque/teclado, motion que respeita
`prefers-reduced-motion`.

**Seção "O que está faltando na sua equipe?" (teaser de diagnóstico,
antigo §6/§7) removida como bloco isolado:** o mesmo intento (levar ao
diagnóstico) já é coberto pelos CTAs do hero, do passo 1 de "Como
funciona" e do CTA final — mantê-la seria repetir CTA sem contexto
adicional (um dos problemas apontados no redesign). O diagnóstico
continua exatamente como está (`/monte-sua-equipe`, sem login).

Sem mudança de rotas, autenticação, contrato de API ou regra de
disponibilidade/domínio.
