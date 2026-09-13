# PRD 02 — Plataforma Gerencial

**Status:** Aprovado  
**Versão:** 1.1 — refinamento Sprint 02

## 1. Visão
Ambiente onde a empresa contrata, prepara, acompanha e evolui sua equipe digital.

> **O gestor usa o BRAÇO. O funcionário trabalha. O cliente conversa pelo WhatsApp.**

## 2. Objetivo
Permitir gestão de funcionários digitais sem conhecimento técnico.

## 3. Usuários e permissões
Múltiplos usuários e grupos, com permissões baseadas na função de negócio.

## 4. Princípios de experiência
- linguagem de equipe;
- mínimo jargão técnico;
- foco em trabalho e resultado;
- responsivo;
- **simples no celular, completo no desktop**;
- configuração em linguagem de negócio, nunca como prompt/agent builder;
- progresso e próximo passo sempre visíveis.

## 5. Minha Equipe
Área principal com nome, função, status, atenção, trabalho recente e ações.

## 6. Contratação
**Necessidade → Funcionário → Preparação → Ativação → Trabalho → Resultado**

## 7. Preparação

A preparação deve responder:
- Quem somos?
- O que fazemos?
- Como trabalhamos?
- O que você pode fazer?
- Quando deve chamar uma pessoa?

A experiência possui:

1. Empresa
2. Produtos e serviços
3. Responsabilidades
4. Regras e limites
5. Autonomia
6. Pessoas e responsáveis
7. Comunicação
8. Recursos de trabalho
9. Revisão

As oito primeiras etapas contêm dados/configurações. A Revisão é o gate final.

### Comportamento

- alterações são salvas progressivamente;
- cada etapa possui critérios objetivos de completude;
- campos opcionais não impedem conclusão;
- o gestor pode sair e voltar sem perder progresso;
- uma etapa incompleta permanece identificável;
- a Revisão lista pendências e oferece atalho para corrigi-las;
- concluir os campos não ativa automaticamente o funcionário.

### Conclusão da preparação

Quando as oito etapas estão completas, o gestor pode revisar e escolher:

> **Concluir preparação**

Essa ação:
- confirma que o Manual de Trabalho foi revisado;
- muda o funcionário de `Preparando` para `Pronto`;
- **não ativa o funcionário**;
- prepara a transição para o checklist de ativação da Sprint 03.

Se uma alteração posterior invalidar um requisito obrigatório antes da
ativação, o funcionário volta a `Preparando`.

## 8. Manual de Trabalho

O Manual reúne:
- identidade/função do funcionário;
- empresa;
- produtos e serviços;
- responsabilidades;
- regras;
- autonomia;
- limites;
- equipe;
- escalonamentos;
- recursos;
- comunicação.

### Contexto compartilhado

Dados da empresa e produtos/serviços pertencem ao contexto compartilhado
da empresa e podem ser usados por mais de um Braço.

A interface deve deixar claro quando uma alteração é compartilhada.

### Contexto específico do funcionário

São específicos por funcionário:
- responsabilidades selecionadas;
- autonomia;
- regras adicionais quando específicas;
- responsável primário;
- estilo de comunicação;
- recursos necessários à função.

### Limites de sistema

Limites de segurança definidos pelo produto são visíveis e não podem ser
removidos pelo gestor.

## 9. Configurações da empresa
Separar contexto compartilhado de configurações específicas de cada funcionário.

## 10. WhatsApp
Canal de todos os funcionários que interagem com clientes.

## 11. Google — Agenda e Tarefas
Calendar para agenda; Tasks para pendências e follow-ups. O gestor administra tudo pelo BRAÇO.

## 12. Ativação
Explícita e condicionada a checklist.

> Não trabalhar é melhor do que trabalhar errado.

`Pronto` significa preparado para entrar no fluxo de ativação; não significa
`Trabalhando`.

## 13. Acompanhamento
**Resumo → Atenção → Ação → Detalhe**

## 14. Conversas e intervenção
O gestor pode visualizar e assumir conversas. Intervenção humana faz parte da operação.

## 15. Tarefas e agenda
Visibilidade operacional sem exigir uso direto de sistemas externos.

**Confirmado (PD4):** toda a experiência de gestão de tarefas acontece
dentro do BRAÇO. Google Tasks é um recurso operacional integrado, não uma
superfície de gestão.

## 16. Resultados
Medir valor, não vaidade.

## 17. Alertas
Explicar o que aconteceu, por que importa, o que fazer e quem pode resolver.

## 18. Controle
Ativar, pausar, retomar, desativar e revisar configuração.

## 19. Evolução
Identificar trabalho ainda deixado para depois e orientar expansão.

## 20. Onboarding
Ensinar gestão de equipe digital, não tecnologia.

## 21. Permissões
Baseadas em responsabilidades de negócio.

## 22. MVP
Contratar, preparar, ativar, operar WhatsApp, acompanhar, intervir e medir.

## 23. Fora do escopo
ERP, CRM completo, contabilidade, RH, plataforma genérica de IA, construtor de automações e projetos customizados como produto principal.

## 24. Critérios de aceitação
O gestor executa a jornada principal sem conhecimento técnico.

Na preparação, o gestor deve entender:
- o que já está pronto;
- o que falta;
- o que é compartilhado;
- o que o funcionário pode fazer;
- quando chama uma pessoa;
- quais recursos estão conectados;
- quando pode concluir a preparação.

## 25. Decisões pendentes
Implementação técnica fica para engenharia. Mudança de comportamento retorna ao produto.

Retenção e exclusão de dados: ver `docs/13-data-privacy-and-retention.md`
(Status: Pending Legal Validation) — gate antes do início da Sprint 03,
não bloqueia Sprint 02.

## Conclusão
O gestor deve sentir que administra uma equipe, não que configura software.
