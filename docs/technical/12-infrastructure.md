# BRAÇO — Infraestrutura, Ambientes e Deploy

## 1. Região

Uma única região, Brasil (ex.: `sa-east-1` na AWS, ou equivalente do
provedor escolhido). Motivo: base de clientes é PME brasileira, latência ao
usuário final e considerações de LGPD favorecem processamento no país (não
é exigência legal estrita de residência de dados para este perfil, mas é boa
prática e reduz risco). Multi-região é overengineering neste estágio (ver
`01-architecture.md` §8).

## 2. Hospedagem

**Recomendação: PaaS orientado a container (Fly.io, Render ou AWS App
Runner/ECS Fargate)** em vez de Kubernetes autogerenciado. Critério:
equipe pequena, sem SRE dedicado — o custo operacional de manter um cluster
K8s não se paga no volume esperado do MVP. Migração para Kubernetes é
possível depois, sem mudar a aplicação (containers já são a unidade de
deploy desde o início).

| Componente | Onde roda |
|---|---|
| App/Runtime Service (Node.js) | Container gerenciado, autoscaling horizontal simples |
| Workers de fila | Container separado do processo web (mesmo código, entrypoint diferente), escala independente |
| PostgreSQL | Serviço gerenciado (backup automático, réplica de leitura quando necessário) |
| Redis | Serviço gerenciado |
| Storage de mídia | S3-compatível gerenciado |
| Frontend (SPA) | CDN estático |

## 3. Ambientes

`local` → `staging` → `production`, conforme `01-architecture.md` §5.
Integrações externas em `staging` usam contas/números de teste dos
provedores (WhatsApp test number da Meta, conta Google de teste) — nunca
credenciais reais de cliente fora de produção.

## 4. Deploy

- Pipeline único (GitHub Actions): lint → testes → build → migração de
  banco (com estratégia de rollback) → deploy.
- Deploy de `staging` automático a cada merge na branch principal; deploy de
  `production` por tag/aprovação manual, dado o impacto de qualquer
  regressão no runtime de atendimento ao vivo.
- Migrações de banco são sempre **backward-compatible** dentro do mesmo
  deploy (expand/contract), para permitir rollback de aplicação sem
  rollback de schema.

## 5. Backups e recuperação

Backup automático diário do PostgreSQL (retenção configurável) + point-in-
time recovery quando o provedor gerenciado oferecer. Teste de restauração
periódico — não documentado como "feito" até ser exercitado ao menos uma
vez antes de GA.

**Backups e exclusão (PD3):** backups seguem o mesmo compromisso de
exclusão de `docs/13-data-privacy-and-retention.md` — um registro excluído
(por solicitação do titular ou expiração de política) não pode permanecer
recuperável indefinidamente via backup. O prazo exato de expurgo em backup
depende do valor final da política (pendente de validação jurídica) e das
capacidades da ferramenta de backup do provedor gerenciado escolhido; até
lá, o design assume que esse prazo será curto e limitado, não "para
sempre".

## 6. Escalonamento

- App Service e workers escalam horizontalmente de forma independente
  (workers escalam com profundidade da fila; app escala com tráfego HTTP).
- Banco escala verticalmente no início; réplica de leitura é decisão
  adiável, só necessária quando relatórios/consultas de leitura pesada
  competirem com tráfego transacional.

## 7. Segurança de rede

Webhooks públicos (WhatsApp, Calendar) são os únicos endpoints
verdadeiramente públicos sem autenticação de usuário — protegidos por
validação de assinatura do provedor + rate limiting dedicado. O restante da
API exige autenticação. Banco e Redis nunca expostos publicamente (acesso
só de dentro da rede privada dos serviços).

## 8. Custo — visão de estágio

Estimativa qualitativa, não orçamento fechado: no MVP, o custo dominante
tende a ser LLM + mensageria (BSP), não infraestrutura de compute/banco —
reforça a decisão de evitar overengineering de infraestrutura (Kubernetes,
multi-região, data warehouse) neste estágio.

## 9. Decisões desta área que podem ser adiadas

- Terraform/IaC formal — documentar infraestrutura como código quando o
  número de recursos gerenciados manualmente começar a gerar risco de
  divergência (ex.: ao abrir o 2º ambiente completo).
- Multi-região — só relevante se houver expansão para fora do Brasil.
- Kubernetes — só relevante se a equipe crescer o suficiente para justificar
  operação própria de cluster, ou se surgir requisito específico não
  atendido por PaaS.
