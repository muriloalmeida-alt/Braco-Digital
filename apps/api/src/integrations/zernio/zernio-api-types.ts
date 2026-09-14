/**
 * Formas de request/response do Zernio (issue #30), transcritas
 * exatamente dos exemplos fornecidos na especificação — o OpenAPI
 * (https://docs.zernio.com/api/openapi) não foi acessível neste ambiente
 * (egress de rede bloqueado para docs.zernio.com), então estes tipos são
 * a "fonte final" possível aqui. Revisar contra o OpenAPI real antes de
 * produção (ver docs/technical/21-zernio-whatsapp-integration.md).
 */

export interface ZernioCreateProfileResponse {
  _id: string;
  name?: string;
}

export interface ZernioConnectWhatsappResponse {
  authUrl: string;
  /**
   * Changelog do Zernio de 2026-09-09: no hosted flow, `state` não deve
   * ser assumido como presente na resposta — por isso opcional aqui. O
   * BRAÇO nunca usou este campo para correlação/segurança: quem faz esse
   * papel é o `correlationId` próprio, gerado e validado server-side em
   * `ZernioConnectionService` (nunca o `state` remoto do provedor) —
   * este ajuste é só de tipagem/contrato, não muda esse mecanismo.
   */
  state?: string;
}

export type ZernioCallbackErrorCode =
  | 'one_whatsapp_per_profile'
  | 'whatsapp_number_already_connected'
  | 'whatsapp_number_pinned_to_profile'
  | 'payment_required'
  | 'whatsapp_error'
  | 'connection_cancelled'
  | 'session_expired';

export interface ZernioNumberInfoResponse {
  phone: {
    display_phone_number: string;
    verified_name: string;
    name_status: string;
    quality_rating: string;
    messaging_limit_tier: string;
    throughput?: { level: string };
    status: string;
    is_official_business_account: boolean;
    platform_type: string;
    health_status?: unknown;
  };
  waba: {
    name: string;
    business_verification_status: string;
    timezone_id: string;
    health_status?: unknown;
  };
}

/** Formato real da API (revisão de contrato pós-#42): objeto estruturado, nunca uma string solta. */
export interface ZernioSendMessageWarning {
  code: string;
  param: string;
  message: string;
}

export interface ZernioSendMessageResponse {
  success: boolean;
  warnings: ZernioSendMessageWarning[];
  data: {
    messageId: string;
    conversationId: string;
    attachments: unknown[];
    messageIds: string[];
  };
}

/** `message.received` — payload completo do webhook (issue #30). */
export interface ZernioMessageReceivedEvent {
  id: string;
  event: 'message.received';
  message: {
    id: string;
    conversationId: string;
    platform: string;
    platformMessageId: string;
    direction: 'incoming' | 'outgoing';
    text: string | null;
    attachments: unknown[];
    sender: {
      id: string;
      name?: string;
      phoneNumber?: string;
      businessScopedUserId?: string;
    };
    sentAt: string;
    isRead: boolean;
    sentVia: string | null;
  };
  conversation: {
    id: string;
    platformConversationId: string;
    participantId: string;
    participantName?: string;
    status: string;
  };
  account: {
    id: string;
    accountId: string;
    profileId: string;
    platform: string;
    username?: string;
  };
  metadata: { standby?: boolean } | null;
  timestamp: string;
}

/** Forma mínima comum a todos os eventos — o que o dedup/roteamento precisa. */
export interface ZernioWebhookEnvelope {
  id: string;
  event: string;
  account?: { id?: string; accountId?: string; profileId?: string };
  [key: string]: unknown;
}
