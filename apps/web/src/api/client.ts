// Em dev, '/api' é reescrito pelo proxy do Vite (vite.config.ts) para
// http://localhost:3001, sem prefixo. Em produção (build), aponte
// VITE_API_BASE_URL para a URL pública do serviço apps/api no Railway
// (ex.: https://braco-api.up.railway.app) — sem "/api" no final, já que a
// API não usa esse prefixo nas rotas (docs/technical/18-running-the-app.md).
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) {
    localStorage.setItem('braco.token', token);
  } else {
    localStorage.removeItem('braco.token');
  }
}

export function loadStoredToken(): string | null {
  authToken = localStorage.getItem('braco.token');
  return authToken;
}

async function request<T>(
  path: string,
  options: RequestInit & { idempotencyKey?: string } = {},
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  if (options.idempotencyKey) headers['Idempotency-Key'] = options.idempotencyKey;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body.message ?? message;
    } catch {
      // resposta sem corpo JSON — mantém statusText
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export interface EmployeeType {
  id: string;
  key: string;
  name: string;
  role: string;
  mission: string;
  expectedResult: string;
  responsibilities: string[];
  availability: 'AVAILABLE' | 'COMING_SOON';
  sortOrder: number;
}

export type EmployeeStatus =
  | 'CONTRATADO'
  | 'PREPARANDO'
  | 'PRONTO'
  | 'TRABALHANDO'
  | 'PAUSADO'
  | 'PRECISA_DE_ATENCAO'
  | 'DESATIVADO';

export interface NextStep {
  label: string;
  action: string;
}

export interface DigitalEmployee {
  id: string;
  name: string;
  status: EmployeeStatus;
  hiredAt: string;
  activatedAt: string | null;
  employeeType: EmployeeType;
  workManualStarted: boolean;
  nextStep: NextStep | null;
}

export interface WorkManualSection {
  key: string;
  label: string;
  status: 'not_started' | 'in_progress' | 'complete';
}

export interface WorkManual {
  id?: string;
  status: string;
  sections: WorkManualSection[];
}

export interface LoginResponse {
  accessToken: string;
  user: { id: string; email: string; name: string };
  companyId: string;
  role: 'OWNER' | 'ADMIN' | 'OPERATOR' | 'VIEWER';
}

export const api = {
  login: (email: string, password: string) =>
    request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  listEmployeeTypes: () => request<EmployeeType[]>('/employee-types'),
  getEmployeeType: (id: string) => request<EmployeeType>(`/employee-types/${id}`),

  listDigitalEmployees: () => request<DigitalEmployee[]>('/digital-employees'),
  getDigitalEmployee: (id: string) => request<DigitalEmployee>(`/digital-employees/${id}`),
  hireEmployee: (employeeTypeId: string, idempotencyKey: string) =>
    request<DigitalEmployee>('/digital-employees', {
      method: 'POST',
      body: JSON.stringify({ employeeTypeId }),
      idempotencyKey,
    }),

  getWorkManual: (employeeId: string) =>
    request<WorkManual>(`/digital-employees/${employeeId}/work-manual`),
  startPreparation: (employeeId: string) =>
    request<WorkManual>(`/digital-employees/${employeeId}/work-manual`, { method: 'POST' }),
};
