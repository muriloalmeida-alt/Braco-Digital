# US83 — Registrar lead interessado

**Épico:** E12 — Aquisição e Diagnóstico de Equipe  
**Prioridade:** P1  
**Sprint:** Sprint 02 — Track B Growth  
**Product Ready:** YES  
**Design Ready:** YES  
**Tech Ready:** TECH READY WITH CAVEATS

## Contexto

Depois de receber valor, o visitante pode pedir continuidade comercial sem criar conta.

## História

Como **visitante**, quero **deixar meus dados depois de ver o diagnóstico**, para receber continuidade sobre minha equipe recomendada.

## Critérios de aceitação

- [ ] O resultado é visível antes do formulário.
- [ ] Nome, Empresa e WhatsApp são obrigatórios.
- [ ] E-mail é opcional.
- [ ] O envio persiste contato, respostas, ranking, disponibilidade observada, origem e timestamp.
- [ ] O formulário possui a estrutura de aviso/links de privacidade exigida pelo PRD.
- [ ] O erro de envio preserva diagnóstico e campos sempre que tecnicamente seguro.
- [ ] O sucesso confirma recebimento sem prometer contratação imediata.
- [ ] Lead Submit Success/Error podem ser medidos sem expor PII nos eventos.
- [ ] O fluxo não cria User, Company ou contratação.

## Regras

- CTA é Querer montar minha equipe quando há recomendado disponível aderente.
- Se todos estiverem Em breve, usar Receber meu diagnóstico.
- Public Launch com dados reais depende de validação jurídico/compliance da camada de privacidade.
- Não criar CRM completo.

## Dependências

- US81.
- US82.
- Persistência pública segura.
- Legal/privacy launch gate.

## Fora do escopo

- Conta self-service.
- Newsletter.
- CRM UI.
- Automação comercial.
- Checkout.

## Design

- `docs/prd/04-aquisicao-e-diagnostico-de-equipe.md`
- `docs/design/26-growth-landing-experience.md`
- `docs/design/27-team-diagnostic-model.md`
- `docs/design/28-growth-wireframes.md`

## Definition of Done

- critérios atendidos;
- responsive 380/768/1440;
- Light/Dark quando aplicável;
- acessibilidade;
- analytics de funil previstos pela história;
- testes adequados;
- nenhuma mudança silenciosa.
