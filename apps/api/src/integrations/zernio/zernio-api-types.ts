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
  state: string;
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

export interface ZernioSendMessageResponse {
  success: boolean;
  warnings: string[];
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
