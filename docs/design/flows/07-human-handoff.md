# Fluxo 07 — Handoff para Humano

## Objetivo
Transferir trabalho para uma pessoa sem perder contexto.

## Motivos
- falta de autorização;
- exceção;
- risco;
- reclamação sensível;
- cliente pede pessoa;
- julgamento humano necessário.

## Fluxo

```text
Funcionário identifica necessidade
→ Solicita humano
→ Cliente é informado
→ Estado: Aguardando humano
→ Responsável recebe contexto
→ Humano assume
→ Estado: Em atendimento humano
→ Resolve
→ Conclui ou devolve ao funcionário
```

## Informação para o humano
- cliente;
- resumo;
- histórico;
- motivo do handoff;
- ação esperada;
- informação crítica.

## Regra
Não obrigar o humano a reconstruir contexto.

## Design
Handoff não deve parecer falha do funcionário.

É uma mudança de responsabilidade.

## Estados
- solicitado;
- aguardando;
- assumido;
- resolvido;
- devolvido;
- expirado/atenção.
