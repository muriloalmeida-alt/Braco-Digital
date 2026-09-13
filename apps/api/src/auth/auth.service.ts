import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(dto: LoginDto) {
    // `users` não é tenant-scoped (identidade global) — sem RLS, leitura direta.
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    // Mensagem genérica proposital: não revelar se o e-mail existe.
    const invalidCredentials = () =>
      new UnauthorizedException('E-mail ou senha inválidos.');

    if (!user) throw invalidCredentials();

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) throw invalidCredentials();

    // `company_memberships` é tenant-scoped (RLS) — ainda não sabemos a
    // empresa neste ponto, então lemos via contexto de usuário (ver
    // PrismaService.withUser e a migration company_memberships_self_lookup).
    const memberships = await this.prisma.withUser(user.id, (tx) =>
      tx.companyMembership.findMany({ where: { userId: user.id } }),
    );

    if (memberships.length === 0) {
      throw new UnauthorizedException(
        'Este usuário não está vinculado a nenhuma empresa.',
      );
    }

    let membership = memberships[0];
    if (memberships.length > 1) {
      if (!dto.companyId) {
        throw new ConflictException(
          'Este usuário pertence a mais de uma empresa. Informe companyId.',
        );
      }
      const found = memberships.find((m) => m.companyId === dto.companyId);
      if (!found) throw invalidCredentials();
      membership = found;
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      companyId: membership.companyId,
      role: membership.role,
    };

    return {
      accessToken: await this.jwt.signAsync(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      companyId: membership.companyId,
      role: membership.role,
    };
  }
}
