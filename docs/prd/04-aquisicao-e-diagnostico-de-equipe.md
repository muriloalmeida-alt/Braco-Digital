# PRD 04 — Aquisição e Diagnóstico de Equipe

**Status:** Product Ready + Design Ready  
**Owner:** GPT — Product Manager + Product Designer  
**Épico:** E12 — Aquisição e Diagnóstico de Equipe  
**Sprint:** 02 — Track B Growth

## 1. Visão

Criar uma experiência pública que apresente o BRAÇO e ajude uma pequena
empresa a descobrir quais funcionários digitais fazem sentido para suas
necessidades.

A experiência central é:

> **Monte sua equipe**

## 2. Problema

Muitos potenciais clientes percebem sintomas:
- mensagens sem resposta;
- agendamentos manuais;
- leads sem retorno;
- orçamentos esquecidos;
- pós-venda inexistente;
- cobranças atrasadas.

Mas não necessariamente sabem traduzir isso para "qual Braço contratar".

O produto deve fazer essa tradução.

## 3. Objetivo

Transformar:

> **dor de negócio → necessidade → Braços recomendados → lead qualificado**

Sem criar conta, tenant ou onboarding self-service.

## 4. Mensagem principal

Hero:

> **Sua empresa precisa de mais um braço? Agora tem.**

Apoio:

> Funcionários digitais que trabalham junto com sua equipe para manter o
> trabalho importante em movimento.

CTA primário:

> **Montar minha equipe**

CTA secundário:

> **Conhecer os Braços**

## 5. Estrutura da Landing

1. Hero
2. O problema
3. Como funciona
4. Portfólio de Braços
5. Monte sua equipe
6. Resultado do diagnóstico
7. Como começar
8. FAQ
9. CTA final

Não usar:
- números não comprovados;
- depoimentos inventados;
- logos de clientes inexistentes;
- claims de economia sem evidência;
- clichês visuais de IA.

## 6. Como funciona

Três passos:

### 1. Conte o que está ficando para depois
Perguntas simples sobre empresa e trabalho.

### 2. Veja sua equipe recomendada
BRAÇO prioriza até 3 funções.

### 3. Comece pelo que já está disponível
Disponibilidade real vem do catálogo.

## 7. Diagnóstico

Fluxo:

1. Perfil básico
2. Necessidades
3. Principal prioridade
4. Volume aproximado
5. Resultado

O diagnóstico não exige login.

## 8. Perfil básico

Campos:

### Segmento
Obrigatório.

Lista simples + `Outro`.

### Tamanho atual da equipe
Obrigatório.

Faixas:
- Só eu
- 2–5 pessoas
- 6–20 pessoas
- 21–50 pessoas
- Mais de 50 pessoas

Esse dado qualifica o lead; não altera sozinho a recomendação no MVP.

## 9. Necessidades

Pergunta:

> **O que está ficando para depois na sua empresa?**

Seleção múltipla.

Opções:

- Responder clientes e tirar dúvidas
- Organizar e realizar agendamentos
- Acompanhar leads e oportunidades
- Criar e acompanhar orçamentos
- Manter contato depois da venda
- Cobrar pagamentos e atrasos
- Fazer follow-up de clientes que sumiram

Cada resposta alimenta o motor determinístico.

## 10. Prioridade

Pergunta:

> **Se você pudesse resolver uma dessas coisas primeiro, qual seria?**

Mostrar somente as necessidades selecionadas.

Seleção única.

A prioridade recebe peso adicional no motor.

## 11. Volume

Pergunta:

> **Quantos contatos ou demandas desse tipo sua empresa recebe em um dia normal?**

Faixas:
- Até 10
- 11–30
- 31–100
- Mais de 100
- Não sei dizer

Volume é usado para qualificação/contexto, não para inventar quantidade de
funcionários no MVP.

## 12. Motor de recomendação

MVP determinístico.

Não usar LLM para decidir recomendação.

Referência:
- `docs/design/27-team-diagnostic-model.md`

Saída:
- até 3 Braços;
- ordenados por aderência;
- cada um com motivo;
- disponibilidade atual.

Os scores não são exibidos ao usuário.

## 13. Resultado

Título:

> **Sua equipe recomendada**

Apoio:

> Com base no que você contou, estes são os Braços que mais podem ajudar.

Cada recomendação mostra:
- nome;
- função;
- por que foi recomendada;
- resultado esperado;
- disponibilidade.

Disponibilidade usa a mesma fonte de verdade do catálogo:
- **Disponível agora**
- **Em breve**

## 14. Regra de disponibilidade

Não duplicar disponibilidade no motor de diagnóstico.

A recomendação identifica o tipo de funcionário; a disponibilidade é
consultada na fonte oficial do catálogo.

Hoje:
- Braço Atendimento — Disponível agora
- Vendas — Em breve
- Orçamentos — Em breve
- Pós-venda — Em breve
- Financeiro — Em breve

## 15. Começar com 1

Quando fizer sentido:

> **Sua equipe ideal pode ter mais de um Braço. Você pode começar com 1.**

Se Atendimento estiver recomendado e disponível:
- destacar `Disponível agora`;
- pode receber `Comece por aqui`.

Se Atendimento não tiver aderência:
- não forçar recomendação apenas por ser o único disponível.

## 16. Captura do lead

O usuário vê a recomendação **antes** de informar contato.

Depois:

> **Quer receber seu diagnóstico e conversar sobre sua equipe?**

Campos:
- Nome — obrigatório
- Empresa — obrigatório
- WhatsApp — obrigatório
- E-mail — opcional

CTA quando existe Braço disponível aderente:

> **Quero montar minha equipe**

CTA quando todos os recomendados estão Em breve:

> **Receber meu diagnóstico**

## 17. Lead persistido

Armazenar:
- contato;
- segmento;
- tamanho da equipe;
- necessidades;
- prioridade;
- volume;
- recomendações;
- disponibilidade no momento do diagnóstico;
- origem;
- timestamp;
- aceite/registro exigido pela camada de privacidade.

Não criar CRM completo nesta sprint.

## 18. Privacidade

O formulário deve possuir informação clara sobre uso dos dados e contato.

Produto define a estrutura da experiência.

Texto legal final/base jurídica/política devem ser validados por
jurídico/compliance antes da publicação pública com captação real.

### Gate

> **Desenvolvimento não é bloqueado. Public Launch é bloqueado sem validação da camada de privacidade do lead.**

Não reutilizar automaticamente lead para campanhas não explicadas.

## 19. Onboarding

Este fluxo NÃO:
- cria conta;
- cria Company;
- cria Owner;
- contrata funcionário;
- substitui PRD 03/E11.

Conversão é comercial/manual nesta fase.

## 20. Analytics

O funil deve permitir medir, sem definir fornecedor:

- Landing View
- Diagnostic Start
- Diagnostic Step Complete
- Diagnostic Complete
- Recommendation View
- Lead Submit
- Lead Submit Success
- Lead Submit Error

Não coletar texto/dado pessoal desnecessário nos eventos de analytics.

## 21. Design

A landing pode ser mais emocional que a aplicação gerencial, mas deve
respeitar:
- M3;
- Brand UI Foundation;
- Guia de Identidade;
- Manrope;
- Azul BRAÇO;
- Verde somente positivo;
- Lucide;
- simplicidade;
- acessibilidade.

Referências:
- `docs/design/26-growth-landing-experience.md`
- `docs/design/27-team-diagnostic-model.md`
- `docs/design/28-growth-wireframes.md`

## 22. Responsividade

Mobile-first.

Validar:
- 380px
- 768px
- 1440px

O diagnóstico deve poder ser concluído confortavelmente no celular.

## 23. Fora do escopo

- checkout;
- preço/pacote comercial;
- criação de conta;
- login;
- contratação self-service;
- agenda comercial;
- CRM completo;
- newsletter;
- lista de espera específica por Braço;
- recomendação via IA/LLM;
- chatbot de vendas.

## 24. Métrica principal

> **Diagnostic Complete → Lead Submit**

Métricas auxiliares:
- CTA hero → Diagnostic Start
- Start → Complete
- Result → Lead Submit

## 25. Critério de sucesso

O visitante:
1. entende o BRAÇO;
2. inicia sem login;
3. conclui diagnóstico;
4. entende por que cada Braço foi recomendado;
5. distingue Disponível agora de Em breve;
6. pode deixar contato depois de receber valor;
7. não acredita que uma função Em breve já pode ser contratada.
