import {
  CommunicationAddressing,
  CommunicationEmojis,
  CommunicationLength,
  CommunicationTone,
} from '@prisma/client';

/**
 * US13 — Estilo de comunicação. Preview é interpolação de texto estático
 * por combinação de opção — nunca chamada a LLM
 * (docs/design/22-work-manual-content-model.md §10, docs/design/23-
 * preparation-experience-spec.md §15: "não apresentar preview como
 * conversa real").
 */
export function buildCommunicationPreview(
  options: {
    tone: CommunicationTone | null;
    addressing: CommunicationAddressing | null;
    emojis: CommunicationEmojis | null;
  },
  employeeName: string,
  companyName: string,
): string {
  const greetingName =
    options.addressing === CommunicationAddressing.SENHOR_SENHORA
      ? 'Sr(a).'
      : options.addressing === CommunicationAddressing.NEUTRO_SEM_NOME
        ? ''
        : 'João';

  const emoji =
    options.emojis === CommunicationEmojis.USAR_QUANDO_FIZER_SENTIDO
      ? ' 😊'
      : options.emojis === CommunicationEmojis.USAR_COM_MODERACAO
        ? ' 🙂'
        : '';

  const opening = greetingName ? `Olá, ${greetingName}!` : 'Olá!';

  const introByTone: Record<CommunicationTone, string> = {
    PROFISSIONAL_PROXIMO: `Eu sou ${employeeName}, assistente digital da ${companyName}. Posso ajudar com informações e agendamentos.`,
    ACOLHEDOR: `Que bom ter você por aqui! Sou ${employeeName}, do time digital da ${companyName}, e estou pronta para ajudar.`,
    DIRETO_OBJETIVO: `Sou ${employeeName}, assistente digital da ${companyName}. Como posso ajudar?`,
    FORMAL: `Meu nome é ${employeeName} e represento o atendimento digital da ${companyName}. Em que posso ser útil?`,
  };

  const intro = options.tone ? introByTone[options.tone] : introByTone.PROFISSIONAL_PROXIMO;

  return `${opening} ${intro}${emoji}`;
}
