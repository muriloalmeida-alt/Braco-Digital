import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Restringe um endpoint a papéis específicos dentro da empresa
 * (docs/technical/04-multi-tenancy.md §3). Usar sempre junto de
 * `JwtAuthGuard` (precisa rodar depois dele, para `request.user` existir).
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
