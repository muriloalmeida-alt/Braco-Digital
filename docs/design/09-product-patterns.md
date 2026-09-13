# BRAÇO — Product Patterns

Padrões de domínio são construídos sobre componentes M3.

## 1. Employee Card

Objetivo:
representar um funcionário digital em Minha Equipe.

Conteúdo mínimo:
- identidade;
- função;
- status;
- resumo de atividade ou próximo passo;
- atenção quando houver;
- ação principal.

Base M3:
- Card;
- List-like content;
- Icon/Avatar;
- Badge/Chip quando aplicável;
- Button/Menu.

## 2. Employee Status

Status:
- Contratado
- Preparando
- Pronto
- Trabalhando
- Pausado
- Precisa de atenção
- Desativado

Sempre exibir texto.

## 3. Work Manual

Experiência para ensinar ao funcionário como trabalhar.

Estrutura:
- Empresa
- Produtos/Serviços
- Responsabilidades
- Regras
- Autonomia
- Equipe
- Comunicação
- Recursos

Padrão:
- seções;
- progress;
- validação;
- revisão final.

## 4. Activation Checklist

Lista clara de pré-requisitos antes da ativação.

Deve:
- mostrar concluído/incompleto;
- permitir acessar o item pendente;
- impedir ativação insegura.

## 5. Work Timeline

Eventos relevantes do trabalho, não logs técnicos.

Exemplos:
- atendimento iniciado;
- agendamento criado;
- follow-up executado;
- humano solicitado;
- humano assumiu;
- atendimento concluído.

## 6. Human Handoff

Representa transferência entre funcionário digital e pessoa.

Estados:
- solicitado;
- aguardando;
- assumido;
- resolvido;
- devolvido ao funcionário.

## 7. Attention Item

Todo item de atenção responde:
- o que aconteceu?
- por que importa?
- o que fazer?
- quem resolve?

## 8. Result Card

Representa impacto:
- indicador;
- contexto;
- período;
- variação quando útil;
- ação de exploração.

## 9. Integration Status

Estados:
- não configurada;
- conectando;
- conectada;
- precisa de atenção;
- desconectada.

## 10. Conversation Surface

Deve diferenciar visualmente:
- cliente;
- funcionário digital;
- humano;
- eventos de sistema relevantes.

Não exibir detalhes técnicos de modelo/prompt.
