# PRD 01 — Braço Atendimento

**Status:** Aprovado  
**Versão:** 1.0

## 1. Visão
Braço Atendimento é o primeiro funcionário digital do BRAÇO.

**Função:** Recepcionista Digital

**Missão:**
> Ser a porta de entrada da empresa, garantindo que todo cliente seja atendido, orientado e conduzido para o próximo passo.

## 2. Objetivo
Garantir que nenhum cliente importante fique sem atendimento e que cada contato seja conduzido para o próximo passo adequado.

## 3. Experiência
- Gestor usa BRAÇO.
- Funcionário trabalha.
- Cliente conversa pelo WhatsApp.

## 4. Capacidades do gestor
Contratar, preparar, configurar, revisar, ativar, pausar, retomar, desativar, acompanhar, intervir e medir.

## 5. Manual de Trabalho
Inclui:
- empresa;
- produtos e serviços;
- preços;
- missão;
- responsabilidades;
- regras;
- autonomia;
- limites;
- equipe;
- escalonamentos;
- recursos;
- estilo de comunicação.

Níveis:
- 🟢 pode decidir;
- 🟡 pode decidir sob regras;
- 🔴 precisa de humano.

## 6. Ativação
Funcionário incompleto não trabalha.

> **Não trabalhar é melhor do que trabalhar errado.**

## 7. WhatsApp
Canal transversal de comunicação com clientes.

## 8. Tipos de trabalho
- receber;
- responder;
- explicar;
- identificar necessidade;
- agendar;
- confirmar;
- reagendar;
- cancelar;
- follow-up;
- recuperação;
- lembretes;
- identificar insatisfação.

## 9. Handoff
Acionar pessoa quando não houver autorização, houver exceção, risco, pedido explícito do cliente ou julgamento humano.

## 10. Estados do atendimento
Novo, em atendimento, aguardando cliente, aguardando humano, concluído e follow-up pendente.

## 11. Follow-up
Identificar continuidade e registrar próxima ação.

Mensagens de follow-up/lembrete iniciadas fora da janela de atendimento do
WhatsApp (24h desde a última mensagem do cliente) usam **templates
pré-aprovados pela Meta/BSP**, não texto livre gerado pelo funcionário
digital. MVP com 5 intenções de template: follow-up de interesse,
agendamento incompleto, lembrete de agendamento, reagendamento e
recuperação de oportunidade — conteúdo e variáveis definidos em
`docs/design/flows/06-follow-up.md` e `docs/design/13-content-design.md`;
detalhe técnico em `docs/technical/05-whatsapp.md` (PD2).

## 12. Minha Equipe
Mostrar nome, função, status, atenção necessária e detalhe.

## 13. Monitoramento
**Resumo → Atenção → Ação → Detalhe**

## 14. Log de trabalho
Registrar atendimentos, respostas, agenda, follow-ups, intervenções, tarefas e eventos.

## 15. Relatórios
Responder o que fez, qual resultado produziu e onde precisou de pessoa.

## 16. Controle
Estados:
Contratado → Preparando → Pronto → Trabalhando, além de Pausado, Precisa de atenção e Desativado.

## 17. Responsabilidade
Nunca ultrapassar regras e limites.

## 18. Sucesso
Mais clientes atendidos, mais agendamentos, menos perdas e menos carga operacional.

## 19. MVP
Preparação, ativação, WhatsApp, atendimento, agenda, handoff, Minha Equipe e acompanhamento.

## 20. Fora do escopo
Diagnóstico, decisões médicas, condições não autorizadas, exceções complexas, CRM completo e automação genérica.

## 21. Princípios
Função antes de tecnologia; responsabilidade; limites; transparência; fluidez; resultado.

## 22. Transparência
> **Digital na identidade. Humano na experiência.**

### Retenção e exclusão de dados

Conversas, dados de agendamento e demais dados do cliente final seguem
política de retenção/exclusão configurável por categoria, pendente de
validação jurídica — ver `docs/13-data-privacy-and-retention.md`. Gate:
nenhum dado real de cliente final antes do início da Sprint 03.

## 23. Google
Calendar para agenda. Tasks para tarefas e follow-ups.

## 24. Configuração
Tudo configurado no BRAÇO.

## 25. Resultado esperado
Uma pequena empresa coloca um recepcionista digital para trabalhar com segurança e valor mensurável.
