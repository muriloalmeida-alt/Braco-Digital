import type { DiagnosticAnswers } from '../../api/public';

/**
 * Issue #28 — passos do diagnóstico que dependem de respostas prévias.
 * `'sucesso'` fica de fora de propósito: não é validado por esta função
 * (não faz parte do escopo da issue — ver DiagnosticPage.tsx).
 */
export type DiagnosticStep = '1' | '2' | '3' | '4' | 'resultado' | 'contato';

/**
 * As mesmas condições que cada `StepN` já valida antes de deixar o
 * usuário avançar (`handleContinue` de cada componente) — centralizadas
 * aqui para serem a única fonte de verdade também no sentido inverso
 * (acesso direto/hard reload a um passo, não só avanço).
 */
export function hasValidNeeds(answers: DiagnosticAnswers): boolean {
  return answers.needs.length > 0;
}

export function hasValidPriority(answers: DiagnosticAnswers): boolean {
  return hasValidNeeds(answers) && answers.priority !== null && answers.needs.includes(answers.priority);
}

export function hasValidVolume(answers: DiagnosticAnswers): boolean {
  return Boolean(answers.volume);
}

/**
 * "Completo o suficiente" para `resultado`/`contato`: as mesmas 5
 * respostas que `LeadForm` envia no payload do lead (segmento, tamanho de
 * equipe, necessidades, prioridade, volume) — não só o que a recomendação
 * em si precisa (que é só needs+priority). Reaproveita o mesmo padrão de
 * "completude verificada a partir do dado, nunca assumida" já usado no
 * backend (`PreparationReadinessService`, Track A).
 */
export function isDiagnosticComplete(answers: DiagnosticAnswers): boolean {
  return (
    Boolean(answers.segment) &&
    Boolean(answers.teamSize) &&
    hasValidNeeds(answers) &&
    hasValidPriority(answers) &&
    hasValidVolume(answers)
  );
}

/**
 * Determina o passo que é seguro renderizar para um `?step=` pedido,
 * dado o estado de respostas atual (persistido em sessionStorage,
 * sobrevive a hard reload). Função pura, sem navegação — quem chama
 * decide o que fazer quando o retorno difere do pedido (redirecionar).
 *
 * `requested` é o valor cru de `searchParams.get('step')` (pode ser
 * `null`, uma string qualquer não reconhecida, ou um `DiagnosticStep`
 * válido em princípio mas cujos pré-requisitos não foram cumpridos).
 */
export function resolveValidDiagnosticStep(requested: string | null, answers: DiagnosticAnswers): DiagnosticStep {
  switch (requested) {
    case '1':
      return '1';
    case '2':
      return '2';
    case '3':
      return hasValidNeeds(answers) ? '3' : '2';
    case '4':
      if (hasValidPriority(answers)) return '4';
      return hasValidNeeds(answers) ? '3' : '2';
    case 'resultado':
    case 'contato':
      if (isDiagnosticComplete(answers)) return requested;
      if (hasValidPriority(answers)) return '4';
      return hasValidNeeds(answers) ? '3' : '2';
    default:
      // `null` (sem ?step= na URL) ou qualquer valor não reconhecido
      // (ex.: ?step=abc) — nunca tela em branco, sempre o início.
      return '1';
  }
}
