import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { DiagnosticsService } from './diagnostics.service';
import { isRealPublicCaptureEnabled } from './public-launch-gate';
import { normalizeWhatsapp } from './whatsapp-normalize';

/**
 * US83 — Registrar lead interessado. Única escrita pública do produto —
 * roda sob `withPublicAccess` (role de banco dedicada, TD15).
 *
 * Usa `INSERT` cru via `$executeRaw` (parametrizado, nunca concatenado —
 * Prisma parametriza tudo aqui) em vez de `tx.lead.create()` de
 * propósito: o `create()` do Prisma sempre gera `INSERT ... RETURNING`
 * para devolver a linha criada, e `RETURNING` exige privilégio
 * equivalente a `SELECT` sobre as colunas retornadas — o que abriria uma
 * política de RLS de leitura para `braco_public` e enfraqueceria
 * exatamente a garantia que TD15 pede (só `INSERT`, nunca `SELECT`, nem
 * para a própria linha que acabou de inserir). Gerando `id`/`createdAt`
 * na aplicação (já conhecidos antes do INSERT), a resposta ao cliente
 * não depende de ler de volta o que foi gravado.
 */
@Injectable()
export class LeadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly diagnosticsService: DiagnosticsService,
  ) {}

  async create(dto: CreateLeadDto, source: string) {
    const whatsapp = normalizeWhatsapp(dto.whatsapp);
    if (!whatsapp) {
      throw new BadRequestException('Número de WhatsApp inválido.');
    }

    // Nunca confia num ranking vindo do cliente — recalcula a partir das
    // respostas no momento do envio (mesma autoridade de backend de
    // Track A, §10 tech readiness).
    const { ranking, ruleVersion } = await this.diagnosticsService.recommend(dto.answers);

    const id = randomUUID();
    const createdAt = new Date();
    const isSynthetic = !isRealPublicCaptureEnabled();

    await this.prisma.withPublicAccess((tx) =>
      tx.$executeRaw`
        INSERT INTO "leads"
          (id, name, company_name, whatsapp, email, segment, team_size, needs, priority, volume, ranking, rule_version, is_synthetic, source, created_at)
        VALUES
          (${id}, ${dto.name}, ${dto.companyName}, ${whatsapp}, ${dto.email ?? null}, ${dto.segment},
           ${dto.teamSize}::"TeamSizeRange", ${dto.answers.needs}::text[], ${dto.answers.priority}, ${dto.volume}::"DiagnosticVolumeRange",
           ${JSON.stringify(ranking)}::jsonb, ${ruleVersion}, ${isSynthetic}, ${source}, ${createdAt})
      `,
    );

    return { id, createdAt, ranking, ruleVersion };
  }
}
