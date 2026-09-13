# BRAÇO — Preparation Experience Spec

**Status:** Approved — Design Ready  
**Owner:** GPT — Product Manager + Product Designer  
**Sprint:** 02

## 1. Objetivo

O gestor deve sentir:

> **Estou ensinando meu funcionário a trabalhar.**

Não:

> Estou configurando um agente.

## 2. Overview

Mostrar:
- nome/função;
- Employee Status;
- `X de 8 etapas completas`;
- próximo item recomendado;
- lista das 8 etapas;
- Revisão separada.

## 3. Navegação

### Expanded
Padrão lista-detalhe/supporting pane:
- navegação das etapas em painel interno;
- conteúdo no painel principal.

### Compact / Medium
- uma etapa por vez;
- acesso claro a `Etapas da preparação`;
- título;
- progresso;
- ações ao final.

## 4. Ordem

1. Empresa
2. Produtos e serviços
3. Responsabilidades
4. Regras e limites
5. Autonomia
6. Pessoas e responsáveis
7. Comunicação
8. Recursos de trabalho
9. Revisão

O gestor pode voltar e acessar etapas futuras. Dependências devem ser explicadas, não escondidas.

## 5. Autosave

> **Não existe botão Salvar por etapa.**

Feedback:
- Salvando…
- Salvo
- Não foi possível salvar

Erro:
> **Tentar novamente**

Não permitir perda silenciosa de alteração pendente.

## 6. CTA

Primary:

> **Continuar**

Ele:
1. valida;
2. mostra erros;
3. marca Completa se válida;
4. avança.

Na última etapa válida:

> **Ir para revisão**

## 7. Validação

- junto ao campo;
- mensagem acionável;
- nunca só cor;
- ao continuar, validar a etapa;
- foco no primeiro erro.

## 8. Estados

### Não iniciada
Sem confirmação/conteúdo relevante.

### Em andamento
Ainda não atende aos requisitos.

### Completa
Requisitos válidos + confirmação via `Continuar`.

## 9. Progresso

Principal:

> **5 de 8 etapas completas**

Não usar percentual como informação principal.

Quando as oito terminarem:

> **Seu Manual está pronto para revisão.**

CTA:
> **Revisar Manual**

## 10. Conteúdo compartilhado

Em Empresa e Produtos/Serviços:

> **Compartilhado com sua equipe digital**  
> Alterações aqui podem ser usadas por outros Braços da empresa.

Usar superfície informativa, não warning.

## 11. Limites de sistema

Visual informativo/proteção, não campo disabled quebrado.

Mostrar:
- ícone;
- título;
- descrição;
- `Regra do BRAÇO` quando útil.

## 12. Autonomia

Cada responsabilidade:
- nome;
- explicação;
- selector dos 3 níveis;
- condição quando 🟡;
- limite máximo quando existir.

Compact: bloco vertical.  
Expanded: lista estruturada, não tabela densa.

## 13. Produtos/serviços

Lista vazia:

> **Nenhum produto ou serviço cadastrado**

> Adicione o que seu funcionário precisa conhecer para orientar seus clientes.

CTA:

> **Adicionar produto ou serviço**

Lista mostra resumo e ações Editar/Excluir.

## 14. Pessoas

Selecionar usuários reais da conta BRAÇO.

Se houver um único Owner:

> **Recomendado: [Nome]**

Ainda exige confirmação.

## 15. Comunicação

Choice cards/radio groups para opções curtas.

Preview em surface secundária:

> **Exemplo de como seu Braço vai conversar**

Não apresentar preview como conversa real.

## 16. Recursos

Cada card responde:
- o que é;
- por que é necessário;
- status;
- conta/número/recurso selecionado;
- ação.

Ver:
`docs/design/24-work-resources-ui-spec.md`

## 17. Revisão

Usar:

> **Resumo → Pendência → Ação**

Completa:
- resumo;
- `Revisar`.

Incompleta:
- pendência;
- `Corrigir`.

## 18. Concluir preparação

CTA:

> **Concluir preparação**

Não usar `Ativar`.

Confirmação:

> O funcionário ficará **Pronto**, mas ainda não começará a trabalhar.

## 19. Success state

Título:

> **Preparação concluída**

Texto:

> [Nome] está pronto para a próxima etapa.

Status:

> **Pronto**

Sem CTA de ativação quebrado antes da Sprint 03.

Ações possíveis:
- Voltar para o funcionário
- Ver Manual de Trabalho

## 20. Erros

- Loading: skeleton/progress M3.
- Erro de carregamento: explicar + Tentar novamente.
- Erro de autosave: não fingir sucesso.
- Integração indisponível: localizada no card de recurso.

## 21. Responsividade

Validar:
- Compact 380px
- Medium 768px
- Expanded 1440px

Compact:
- coluna única;
- labels sempre visíveis;
- ações podem empilhar.

Medium:
- coluna ampla / blocos quando útil;
- sem painel lateral obrigatório.

Expanded:
- navegação interna persistente;
- largura de leitura confortável;
- supporting content pode ocupar painel auxiliar.

## 22. Acessibilidade

- labels em todos os inputs;
- errors associados;
- fieldsets/radio groups corretos;
- progresso em texto;
- status não depende de cor;
- foco gerenciado;
- ícones decorativos aria-hidden;
- ordem de tab previsível;
- contraste M3/BRAÇO.

## 23. Brand UI Foundation

Aplicar:
- Manrope;
- Azul BRAÇO no primary CTA;
- verde só positivo;
- Off White/White;
- cards 12px;
- controls 8–10px;
- Lucide outline;
- sem estética de IA/automação.

## 24. Fora do escopo

- prompt builder;
- JSON editor;
- configuração de modelo;
- tokens de IA;
- workflows genéricos.
