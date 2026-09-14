import { Check, CheckCheck } from 'lucide-react';
import './WhatsAppShowcase.css';

const AVATAR_SRC = '/brand/08_avatar_whatsapp_e_perfil.png';

/**
 * Card flutuante do Hero — demonstra o produto em ação (issue de
 * redesign, seção "Hero": "card flutuante demonstrando a atuação do
 * Braço Atendimento"). Mensagem e nome são ilustrativos, nunca dados
 * reais de um cliente.
 */
export function WhatsAppFloatingCard() {
  return (
    <div className="braco-wa-card braco-wa-float" role="img" aria-label="Exemplo de conversa: Braço Atendimento, online agora, confirma um cliente atendido e uma visita agendada">
      <img src={AVATAR_SRC} alt="" width={40} height={40} className="braco-wa-float__avatar" />
      <div className="braco-wa-float__body">
        <div className="braco-wa-float__title-row">
          <p className="braco-wa-float__name">Braço Atendimento</p>
        </div>
        <p className="braco-wa-float__status">
          <span className="braco-wa-float__status-dot" aria-hidden="true" />
          Online agora
        </p>
        <p className="braco-wa-float__bubble">
          Novo cliente atendido e visita agendada para amanhã, às 14h.
          <CheckCheck size={14} className="braco-wa-float__bubble-check" aria-hidden="true" />
        </p>
      </div>
    </div>
  );
}

/**
 * Demonstração de conversa completa — seção "Fale com seus Braços pelo
 * WhatsApp". Composição própria (Card BRAÇO + cores de balão do canal),
 * não uma captura da UI do WhatsApp — conteúdo sempre ilustrativo.
 */
export function WhatsAppConversationDemo() {
  return (
    <div className="braco-wa-card braco-wa-thread" role="img" aria-label="Exemplo de conversa entre um empresário e o Braço Atendimento pelo WhatsApp, confirmando agendamentos do dia seguinte">
      <div className="braco-wa-thread__bubble-row braco-wa-thread__bubble-row--out">
        <p className="braco-wa-thread__bubble braco-wa-thread__bubble--out">
          Confirme os clientes de amanhã e reorganize quem pedir outro horário.
          <Check size={14} style={{ marginLeft: 4, verticalAlign: '-2px', opacity: 0.6 }} aria-hidden="true" />
        </p>
      </div>

      <div className="braco-wa-thread__bubble-row">
        <img src={AVATAR_SRC} alt="" width={28} height={28} className="braco-wa-thread__avatar" />
        <p className="braco-wa-thread__bubble braco-wa-thread__bubble--in">
          Pode deixar. Vou confirmar os 8 agendamentos e atualizar sua agenda.
        </p>
      </div>

      <span className="braco-wa-thread__result">7 clientes confirmados · 1 reagendado</span>

      <div className="braco-wa-thread__bubble-row">
        <img src={AVATAR_SRC} alt="" width={28} height={28} className="braco-wa-thread__avatar" />
        <p className="braco-wa-thread__bubble braco-wa-thread__bubble--in">
          Tudo certo. A agenda foi atualizada e criei uma tarefa para retornar ao novo contato às 16h.
        </p>
      </div>
    </div>
  );
}
