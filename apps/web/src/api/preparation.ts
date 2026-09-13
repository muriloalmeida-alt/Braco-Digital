import { request } from './client';

// --- US07 — Empresa ---------------------------------------------------

export type ServiceMode = 'PRESENCIAL' | 'ONLINE' | 'AMBOS';

export interface BusinessHourPeriod {
  day: string;
  from: string;
  to: string;
}

export interface CompanyProfile {
  id: string;
  name: string;
  timezone: string;
  attendanceName: string | null;
  about: string | null;
  serviceMode: ServiceMode | null;
  address: string | null;
  businessHours: BusinessHourPeriod[] | null;
  website: string | null;
  socialHandle: string | null;
  generalNotes: string | null;
}

export interface UpdateCompanyProfileInput {
  attendanceName?: string;
  about?: string;
  serviceMode?: ServiceMode;
  address?: string;
  businessHours?: BusinessHourPeriod[];
  timezone?: string;
  website?: string;
  socialHandle?: string;
  generalNotes?: string;
}

// --- US08 — Produtos e serviços ----------------------------------------

export type ProductServiceKind = 'PRODUTO' | 'SERVICO';
export type PricingMode = 'FIXO' | 'A_PARTIR_DE' | 'SOB_CONSULTA' | 'NAO_INFORMAR';

export interface ProductService {
  id: string;
  name: string;
  kind: ProductServiceKind;
  clientDescription: string;
  pricingMode: PricingMode;
  price: string | null;
  schedulable: boolean;
  durationMinutes: number | null;
  notes: string | null;
}

export interface UpsertProductServiceInput {
  name: string;
  kind: ProductServiceKind;
  clientDescription: string;
  pricingMode: PricingMode;
  price?: number;
  schedulable?: boolean;
  durationMinutes?: number;
  notes?: string;
}

// --- US09 — Responsabilidades -------------------------------------------

export interface ResponsibilityItem {
  key: string;
  label: string;
  essential: boolean;
  requiresCalendar: boolean;
  requiresTasks: boolean;
  enabled: boolean;
}

// --- US10 — Regras e limites ---------------------------------------------

export interface SystemLimit {
  key: string;
  label: string;
}

export interface WorkManualRule {
  id: string;
  text: string;
  appliesWhen: string | null;
}

export interface RulesView {
  systemLimits: SystemLimit[];
  rules: WorkManualRule[];
  acknowledgedNoAdditional: boolean;
}

// --- US11 — Autonomia ------------------------------------------------------

export type AutonomyLevel = 'PODE_DECIDIR' | 'PODE_DECIDIR_SOB_REGRAS' | 'PRECISA_HUMANO';

export interface AutonomyItem {
  responsibilityKey: string;
  label: string;
  recommended: AutonomyLevel | null;
  ceiling: AutonomyLevel | null;
  level: AutonomyLevel | null;
  condition: string | null;
}

export interface AutonomyChoice {
  responsibilityKey: string;
  level: AutonomyLevel;
  condition?: string;
}

// --- US12 — Pessoas e responsáveis -----------------------------------------

export interface EligibleUser {
  userId: string;
  name: string;
  email: string;
  role: string;
}

export interface ResponsiblesView {
  eligibleUsers: EligibleUser[];
  recommendedUserId: string | null;
  principalUserId: string | null;
  backupUserId: string | null;
}

// --- US13 — Comunicação ------------------------------------------------------

export type CommunicationTone = 'PROFISSIONAL_PROXIMO' | 'ACOLHEDOR' | 'DIRETO_OBJETIVO' | 'FORMAL';
export type CommunicationAddressing = 'PRIMEIRO_NOME' | 'SENHOR_SENHORA' | 'NEUTRO_SEM_NOME';
export type CommunicationLength = 'CURTAS_OBJETIVAS' | 'EQUILIBRADAS' | 'DETALHADAS_QUANDO_NECESSARIO';
export type CommunicationEmojis = 'NAO_USAR' | 'USAR_COM_MODERACAO' | 'USAR_QUANDO_FIZER_SENTIDO';

export interface CommunicationStyle {
  tone: CommunicationTone | null;
  addressing: CommunicationAddressing | null;
  length: CommunicationLength | null;
  emojis: CommunicationEmojis | null;
  preferredTerms: string[];
  avoidTerms: string[];
  preview: string;
}

// --- US14 — Recursos ---------------------------------------------------------

export type IntegrationType = 'WHATSAPP' | 'GOOGLE_CALENDAR' | 'GOOGLE_TASKS';
export type IntegrationStatus =
  | 'NOT_CONFIGURED'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'NEEDS_ATTENTION'
  | 'DISCONNECTED'
  | 'NOT_NECESSARY';

export type IntegrationConnectionMode = 'SIMULATED' | 'REAL';

export interface ResourceItem {
  type: IntegrationType;
  required: boolean;
  status: IntegrationStatus;
  externalAccountRef: string | null;
  connectedAt: string | null;
  connectionMode: IntegrationConnectionMode | null;
  /**
   * Autoridade do backend (Product Review 01): quando `false`
   * (produção), a UI de simulação não deve aparecer — não é uma
   * decisão do frontend, é o que `ResourcesService.get` calcula a
   * partir do ambiente.
   */
  canSimulateConnection: boolean;
}

export const preparationApi = {
  // Empresa
  getCompanyProfile: () => request<CompanyProfile>('/companies/current/profile'),
  updateCompanyProfile: (dto: UpdateCompanyProfileInput) =>
    request<CompanyProfile>('/companies/current/profile', { method: 'PATCH', body: JSON.stringify(dto) }),

  // Produtos e serviços
  listProducts: () => request<ProductService[]>('/companies/current/products'),
  createProduct: (dto: UpsertProductServiceInput) =>
    request<ProductService>('/companies/current/products', { method: 'POST', body: JSON.stringify(dto) }),
  updateProduct: (id: string, dto: UpsertProductServiceInput) =>
    request<ProductService>(`/companies/current/products/${id}`, { method: 'PATCH', body: JSON.stringify(dto) }),
  deleteProduct: (id: string) => request<{ id: string }>(`/companies/current/products/${id}`, { method: 'DELETE' }),

  // Responsabilidades
  getResponsibilities: (employeeId: string) =>
    request<ResponsibilityItem[]>(`/digital-employees/${employeeId}/responsibilities`),
  updateResponsibilities: (employeeId: string, responsibilities: { key: string; enabled: boolean }[]) =>
    request(`/digital-employees/${employeeId}/responsibilities`, {
      method: 'PATCH',
      body: JSON.stringify({ responsibilities }),
    }),

  // Regras e limites
  getRules: (employeeId: string) => request<RulesView>(`/digital-employees/${employeeId}/rules`),
  acknowledgeNoAdditionalRules: (employeeId: string, acknowledgedNoAdditional: boolean) =>
    request(`/digital-employees/${employeeId}/rules/acknowledgement`, {
      method: 'PATCH',
      body: JSON.stringify({ acknowledgedNoAdditional }),
    }),
  createRule: (employeeId: string, dto: { text: string; appliesWhen?: string }) =>
    request<WorkManualRule>(`/digital-employees/${employeeId}/rules`, { method: 'POST', body: JSON.stringify(dto) }),
  updateRule: (employeeId: string, id: string, dto: { text: string; appliesWhen?: string }) =>
    request(`/digital-employees/${employeeId}/rules/${id}`, { method: 'PATCH', body: JSON.stringify(dto) }),
  deleteRule: (employeeId: string, id: string) =>
    request(`/digital-employees/${employeeId}/rules/${id}`, { method: 'DELETE' }),

  // Autonomia
  getAutonomy: (employeeId: string) => request<AutonomyItem[]>(`/digital-employees/${employeeId}/autonomy`),
  updateAutonomy: (employeeId: string, choices: AutonomyChoice[]) =>
    request(`/digital-employees/${employeeId}/autonomy`, { method: 'PATCH', body: JSON.stringify({ choices }) }),

  // Pessoas e responsáveis
  getResponsibles: (employeeId: string) =>
    request<ResponsiblesView>(`/digital-employees/${employeeId}/responsibles`),
  updateResponsibles: (employeeId: string, principalUserId: string, backupUserId?: string | null) =>
    request(`/digital-employees/${employeeId}/responsibles`, {
      method: 'PATCH',
      body: JSON.stringify({ principalUserId, backupUserId }),
    }),

  // Comunicação
  getCommunicationStyle: (employeeId: string) =>
    request<CommunicationStyle>(`/digital-employees/${employeeId}/communication-style`),
  updateCommunicationStyle: (employeeId: string, dto: Partial<Omit<CommunicationStyle, 'preview'>>) =>
    request(`/digital-employees/${employeeId}/communication-style`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    }),

  // Recursos
  getResources: (employeeId: string) => request<ResourceItem[]>(`/digital-employees/${employeeId}/resources`),
  connectResource: (employeeId: string, type: IntegrationType) =>
    request(`/digital-employees/${employeeId}/resources/${type}/connect`, { method: 'POST' }),
  confirmResource: (employeeId: string, type: IntegrationType, externalAccountRef: string) =>
    request(`/digital-employees/${employeeId}/resources/${type}/confirm`, {
      method: 'POST',
      body: JSON.stringify({ externalAccountRef }),
    }),
  disconnectResource: (employeeId: string, type: IntegrationType) =>
    request(`/digital-employees/${employeeId}/resources/${type}/disconnect`, { method: 'POST' }),
};
