# BRAÇO — Segurança e LGPD

## 1. Autenticação

Hash de senha com Argon2id, sessão via JWT de curta duração (ex.: 15 min) +
refresh token de longa duração armazenado como httpOnly cookie. MFA
(TOTP) — não bloqueante para Sprint 01, recomendado antes de GA (ver
`15-technical-risks.md`).

## 2. Autorização / RBAC

Ver `04-multi-tenancy.md`, seção 3. Papéis por empresa (Owner/Admin/
Operador/Visualizador), avaliados na API Gateway e reforçados por RLS onde
aplicável.

## 3. Segregação de tenant

Ver `04-multi-tenancy.md` seção 4 (riscos e mitigação) — tratado como
requisito de segurança de primeira classe, com testes automatizados
dedicados no CI.

## 4. Criptografia

- Em trânsito: TLS 1.2+ em toda comunicação externa e interna entre
  serviços.
- Em repouso: criptografia do disco/volume do banco gerenciado (padrão do
  provedor) **mais** criptografia de coluna via KMS para dados sensíveis
  específicos: credenciais de integração (`Integration.credentials_encrypted`),
  tokens OAuth do Google, segredos de assinatura de webhook.
- Chaves gerenciadas por um serviço de KMS gerenciado do provedor de nuvem
  escolhido — nunca chave simétrica hardcoded ou em variável de ambiente sem
  rotação.

## 5. Secrets

Segredos de aplicação (chaves de API do LLM, credenciais de BSP do
WhatsApp, client secret OAuth do Google) ficam em um secrets manager
(ex.: AWS Secrets Manager, Doppler ou equivalente do provedor escolhido),
nunca em `.env` versionado ou em variável de CI exposta em log. Rotação
periódica documentada por segredo.

## 6. PII

Dados pessoais tratados no sistema:
- **Do gestor/usuário BRAÇO:** nome, e-mail, papel.
- **Do cliente final** (titular indireto, nunca usuário do BRAÇO): telefone,
  nome (quando obtido), conteúdo de conversas, dados de agendamento.

Princípio de minimização: o Runtime só carrega no contexto do LLM o que é
necessário para a conversa atual (`09-ai-llm.md`, seção 4) — não a base
inteira de clientes.

## 7. Logs

Logs de aplicação nunca contêm PII em texto claro (conteúdo de mensagem,
telefone completo, nome). Usar identificadores internos (`customer_id`,
`attendance_id`) nos logs técnicos; conteúdo fica apenas nas tabelas de
domínio (`Message`, `WorkEvent`) com controle de acesso próprio — não em
stack de log/observabilidade de uso mais amplo (ver `11-observability.md`,
seção sobre o que NÃO vai para o backend de observabilidade).

## 8. Auditoria

`WorkEvent` (append-only, `03-data-model.md`) é o registro de auditoria de
toda decisão automatizada que afeta um cliente final — requisito tanto de
produto (PRD 01, seção 14) quanto de LGPD, já que decisões automatizadas
que afetam pessoas devem ser explicáveis. Ações humanas dentro do BRAÇO
(quem assumiu uma conversa, quem alterou uma regra) também geram evento de
auditoria (`Intervention`, e um log de alterações de configuração sensível
— regras/autonomia/limites).

## 9. Retenção e exclusão

**Status: PD3 — PRODUCT DIRECTION DEFINED / LEGAL VALIDATION REQUIRED.**
Direção de produto formalizada em `docs/13-data-privacy-and-retention.md`:
sem retenção indefinida por padrão, sem número arbitrário adotado agora,
retenção configurável por categoria de dado, exclusão sob demanda, exclusão
no encerramento de empresa cliente, e conservação restrita apenas por
obrigação legal legítima. O período final por categoria depende de
validação jurídica — gate **antes do início da Sprint 03**, não bloqueia
Sprint 01/02. A arquitetura já suporta retention policies, soft/hard
delete, exclusão por tenant e auditoria da própria exclusão (ver
`03-data-model.md`, seção "Suporte a retenção e exclusão").

## 10. Acesso humano

Todo acesso de um humano da equipe da empresa a uma conversa (leitura ou
intervenção) é uma ação de negócio normal do produto (Handoff/Intervention),
já auditada por desenho (seção 8). Acesso de suporte/engenharia BRAÇO aos
dados de um tenant (para debug) deve ser explicitamente registrado
(break-glass access log) — não é o mesmo caminho que o acesso do gestor.

## 11. Consentimento

O cliente final é informado, desde a primeira mensagem, que está
conversando com um atendimento digital (regra de marca: "Digital na
identidade. Humano na experiência."). Do ponto de vista de LGPD, isso cobre
transparência sobre tratamento automatizado, mas **não substitui** uma
política de privacidade clara sobre uso e retenção dos dados da conversa —
recomenda-se linguagem padrão incluída no fluxo de ativação do funcionário
(mensagem de abertura), decisão de conteúdo a validar com Produto/Jurídico
do cliente final (fora do escopo de engenharia, mas dependência a registrar).

## 12. Compliance operacional mínima para Sprint 01

Nenhuma das histórias de Sprint 01 (contratação/preparação inicial/Minha
Equipe) processa dado de cliente final ainda — o risco de LGPD relevante só
começa a partir da Sprint 03 (WhatsApp/atendimento real). Isso **não**
bloqueia Sprint 01, mas exige que autenticação, RBAC básico e isolamento de
tenant já estejam corretos desde o primeiro código, porque o modelo de dados
de empresa/usuário é compartilhado por todas as sprints seguintes.
