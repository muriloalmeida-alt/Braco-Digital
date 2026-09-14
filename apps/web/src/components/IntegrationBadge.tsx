import './IntegrationBadge.css';

export type IntegrationKey = 'whatsapp' | 'google-calendar' | 'google-tasks';

const INTEGRATIONS: Record<IntegrationKey, { label: string; src: string }> = {
  whatsapp: { label: 'WhatsApp', src: '/marks/whatsapp.svg' },
  'google-calendar': { label: 'Google Calendar', src: '/marks/google-calendar.svg' },
  'google-tasks': { label: 'Google Tasks', src: '/marks/google-tasks.svg' },
};

/**
 * Selo de integração — marca oficial + nome completo, nunca só o ícone
 * isolado (issue de redesign da landing, seção "Uso das marcas": "não
 * inserir a marca 'Google' isoladamente quando o produto específico for
 * Google Calendar ou Google Tasks"). O nome ao lado do ícone garante que
 * a marca continue reconhecível mesmo quando um dos três ícones é uma
 * versão monocromática simplificada (ver public/marks/README.md).
 */
export function IntegrationBadge({ integration }: { integration: IntegrationKey }) {
  const { label, src } = INTEGRATIONS[integration];
  return (
    <span className="braco-integration-badge">
      <img className="braco-integration-badge__icon" src={src} alt="" width={20} height={20} />
      {label}
    </span>
  );
}
