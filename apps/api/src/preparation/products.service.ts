import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PricingMode } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertProductServiceDto } from './dto/product-service.dto';

/**
 * US08 — Produtos e serviços. Compartilhado pela empresa
 * (docs/design/22-work-manual-content-model.md §5).
 */
@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  private validateBusinessRules(dto: UpsertProductServiceDto) {
    const needsPrice = dto.pricingMode === PricingMode.FIXO || dto.pricingMode === PricingMode.A_PARTIR_DE;
    if (needsPrice && (dto.price === undefined || dto.price === null)) {
      throw new BadRequestException('Valor é obrigatório para "Fixo" ou "A partir de".');
    }
    if (!needsPrice && dto.price !== undefined) {
      // Sob consulta / Não informar nunca autorizam preço — docs §5.
      throw new BadRequestException('Não é permitido informar valor para "Sob consulta" ou "Não informar".');
    }
    if (dto.schedulable && !dto.durationMinutes) {
      throw new BadRequestException('Duração é obrigatória quando o item é agendável.');
    }
  }

  async list(companyId: string) {
    return this.prisma.withTenant(companyId, (tx) =>
      tx.productService.findMany({ where: { companyId }, orderBy: { createdAt: 'asc' } }),
    );
  }

  async create(companyId: string, dto: UpsertProductServiceDto) {
    this.validateBusinessRules(dto);
    return this.prisma.withTenant(companyId, (tx) =>
      tx.productService.create({
        data: {
          companyId,
          name: dto.name,
          kind: dto.kind,
          clientDescription: dto.clientDescription,
          pricingMode: dto.pricingMode,
          price: dto.price,
          schedulable: dto.schedulable ?? false,
          durationMinutes: dto.durationMinutes,
          notes: dto.notes,
        },
      }),
    );
  }

  async update(companyId: string, id: string, dto: UpsertProductServiceDto) {
    this.validateBusinessRules(dto);
    return this.prisma.withTenant(companyId, async (tx) => {
      const existing = await tx.productService.findUnique({ where: { id } });
      if (!existing) throw new NotFoundException('Item não encontrado.');
      return tx.productService.update({
        where: { id },
        data: {
          name: dto.name,
          kind: dto.kind,
          clientDescription: dto.clientDescription,
          pricingMode: dto.pricingMode,
          price: dto.price ?? null,
          schedulable: dto.schedulable ?? false,
          durationMinutes: dto.durationMinutes ?? null,
          notes: dto.notes,
        },
      });
    });
  }

  async remove(companyId: string, id: string) {
    return this.prisma.withTenant(companyId, async (tx) => {
      const existing = await tx.productService.findUnique({ where: { id } });
      if (!existing) throw new NotFoundException('Item não encontrado.');
      await tx.productService.delete({ where: { id } });
      return { id };
    });
  }
}
