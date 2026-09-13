import { Role } from '@prisma/client';

/**
 * Payload do JWT. `companyId` é o tenant ativo da sessão — todo request
 * autenticado carrega o tenant já resolvido aqui, nunca inferido do corpo
 * da requisição (docs/technical/04-multi-tenancy.md §2).
 */
export interface JwtPayload {
  sub: string; // userId
  email: string;
  companyId: string;
  role: Role;
}
