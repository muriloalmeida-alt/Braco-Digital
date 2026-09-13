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

> **Nota:** este é o Employee Card de **Minha Equipe** (funcionário já
> contratado, usa Employee Status). O card do **catálogo** (funcionário
> ainda não contratado) usa Catalog Availability — ver seção 1.1.

## 1.1 Catalog Availability (catálogo de contratação)

Conceito **separado de Employee Status**. Aplica-se apenas a funcionários
no catálogo de contratação (ainda não contratados), nunca a um funcionário
já em Minha Equipe.

Estados:
- **Disponível**
- **Em breve**

### Employee Card — Disponível
Conteúdo mínimo:
- identidade;
- função;
- missão;
- resultado esperado;
- principais responsabilidades;
- disponibilidade;
- CTA de contratação: **Contratar funcionário**.

### Employee Card — Em breve
Não é um card tradicionalmente `disabled`. Não:
- reduzir opacity de todo o card;
- prejudicar leitura;
- mostrar botão aparentemente quebrado.

Deve possuir:
- conteúdo legível (missão, responsabilidades, resultado esperado, como os
  demais cards);
- label/badge M3 **Em breve**;
- possibilidade de acessar o detalhe;
- nenhum CTA de contratação.

Na página de detalhe de um funcionário "Em breve", mostrar normalmente
missão, responsabilidades e resultado esperado, com uma mensagem objetiva
de indisponibilidade (ex.: "Em breve. Este funcionário ainda não está
disponível para contratação."). Não implementar nesta fase lista de
espera ou cadastro de interesse ("Avise-me") — exigiria histórias próprias.

## 2. Employee Status

Status (funcionário **já contratado**, exibido em Minha Equipe — não
confundir com Catalog Availability acima):
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
