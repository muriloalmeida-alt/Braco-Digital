# BRAÇO — Team Diagnostic Model

**Status:** Approved — Product Ready + Design Ready  
**Engine:** Determinístico no MVP

## 1. Regra

O diagnóstico não usa LLM para escolher Braços.

A recomendação é reproduzível e auditável.

## 2. Entradas

- segmento;
- tamanho da equipe;
- necessidades selecionadas;
- prioridade principal;
- volume aproximado.

No MVP, segmento, tamanho e volume qualificam o lead, mas não criam
recomendações arbitrárias.

## 3. Mapeamento base

| Necessidade | Braço | Pontos |
|---|---|---:|
| Responder clientes e tirar dúvidas | Atendimento | 3 |
| Organizar e realizar agendamentos | Atendimento | 3 |
| Acompanhar leads e oportunidades | Vendas | 3 |
| Criar e acompanhar orçamentos | Orçamentos | 3 |
| Manter contato depois da venda | Pós-venda | 3 |
| Cobrar pagamentos e atrasos | Financeiro | 3 |
| Fazer follow-up de clientes que sumiram | Vendas | 2 |
| Fazer follow-up de clientes que sumiram | Atendimento | 1 |

## 4. Prioridade

A necessidade escolhida como principal recebe:

> **+2 pontos**

nos Braços associados a ela.

## 5. Ranking

1. somar pontos;
2. remover Braços com 0;
3. ordenar do maior para o menor;
4. retornar no máximo 3.

### Empate

Desempate:

1. Braço ligado à prioridade principal;
2. ordem em que as necessidades foram selecionadas;
3. ordem estável do portfólio:
   - Atendimento
   - Vendas
   - Orçamentos
   - Pós-venda
   - Financeiro

Os números não aparecem para o usuário.

## 6. Disponibilidade

Depois do ranking, consultar a disponibilidade oficial do catálogo.

O motor **não** mantém cópia própria de:

- Disponível;
- Em breve.

Resultado combina:

> recommendation + catalog availability

## 7. Motivo da recomendação

Gerado por texto determinístico associado às necessidades.

Exemplos:

### Atendimento

> Recomendado porque você precisa responder clientes e manter os
> agendamentos em dia.

### Vendas

> Recomendado porque oportunidades precisam de acompanhamento até a decisão.

### Orçamentos

> Recomendado porque pedidos de orçamento precisam ser preparados e
> acompanhados.

### Pós-venda

> Recomendado porque o relacionamento precisa continuar depois da venda.

### Financeiro

> Recomendado porque cobranças e pagamentos em atraso precisam de
> acompanhamento.

Se existirem duas necessidades relevantes, combinar no máximo duas razões.

Não usar texto gerado por LLM no MVP.

## 8. Comece por aqui

Se o Braço Atendimento:

- estiver entre os recomendados;
- estiver Disponível;

ele pode receber label:

> **Disponível agora**

Se também for o primeiro ranking:

> **Comece por aqui**

Se estiver em posição inferior, não promover artificialmente acima de uma
dor mais importante.

## 9. Nenhum Braço disponível

Se todos os recomendados estiverem Em breve:

- manter recomendação;
- deixar disponibilidade explícita;
- não substituir por Atendimento irrelevante;
- CTA: `Receber meu diagnóstico`.

## 10. Pacote

Nome da composição:

> **Sua equipe recomendada**

Não criar preços, tiers ou descontos no MVP.

Mensagem permitida:

> **Sua equipe ideal pode ter mais de um Braço. Você pode começar com 1.**

Somente mostrar a segunda frase quando existir ao menos um recomendado
Disponível.

## 11. Persistência

Salvar junto ao lead:

- versão das regras;
- inputs;
- ranking;
- disponibilidade observada;
- timestamp.

Isso permite auditoria e evolução futura.

## 12. Evolução futura

Fora do MVP:

- ML/LLM para recomendação;
- quantidade de instâncias por Braço;
- preço/pacote;
- recomendação por benchmark setorial;
- aprendizado automático por conversão.
