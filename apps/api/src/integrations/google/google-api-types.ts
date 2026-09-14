/**
 * Tipos mínimos das respostas do Google que este módulo realmente
 * consome (issue #31) — não é um SDK completo, só o suficiente para
 * OAuth + seleção de Calendar + setup de Tasks. Fonte: documentação
 * pública das APIs (OAuth 2.0 Web Server, Calendar API v3, Tasks API
 * v1) — revisar contra a documentação oficial em caso de divergência.
 */

export interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
}

export interface GoogleCalendarListEntry {
  id: string;
  summary: string;
  primary?: boolean;
  /** 'owner' | 'writer' | 'reader' | 'freeBusyReader' — só owner/writer servem para escrita futura de eventos. */
  accessRole: string;
}

export interface GoogleCalendarListResponse {
  items: GoogleCalendarListEntry[];
  nextPageToken?: string;
}

export interface GoogleTaskList {
  id: string;
  title: string;
}

export interface GoogleTaskListsResponse {
  items?: GoogleTaskList[];
  nextPageToken?: string;
}
