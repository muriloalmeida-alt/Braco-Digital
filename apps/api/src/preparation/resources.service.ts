import { Injectable, NotFoundException } from '@nestjs/common';
import { IntegrationStatus, IntegrationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { getResponsibilityCatalog } from './catalogs/responsibility-catalog';
import { PreparationReadinessService } from './preparation-readiness.service';

/**
 * US14 — Recursos de trabalho. Escopo: CONECTAR/CONFIGURAR, não operar
 * (docs/design/24-work-resources-ui-spec.md §2).
 *
 * ATENÇÃO — dívida externa registrada (não é mock disfarçado de Done):
 * não há credenciais reais de BSP de WhatsApp nem de app OAuth do Google
 * provisionadas neste ambiente (docs/technical/20-sprint-02-tech-
 * readiness.md §24.2, "External Credential/Environment Pending"). Os
 * métodos `startConnection`/`confirmConnection` abaixo implementam a
 * máquina de estados e o modelo de dados completos — é o ponto exato
 * onde o redirect real para o BSP/Google OAuth entra — mas, sem essas
 * credenciais, `startConnection` não chama nenhum provedor real; é
 * responsabilidade do chamador (frontend) saber que, neste ambiente, a
 * "autorização externa" é simulada via `confirmConnection` para permitir
 * testar o restante do fluxo (obrigatoriedade, bloqueio de Revisão,
 * etc.). Nenhuma história é declarada Done com base nesta simulação.
 */
@Injectable()
export class ResourcesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly readiness: PreparationReadinessService,
  ) {}

  private async requiredness(tx: import('@prisma/client').Prisma.TransactionClient, digitalEmployeeId: string, employeeTypeKey: string) {
    const responsibilities = await tx.employeeResponsibility.findMany({ where: { digitalEmployeeId } });
    const enabledKeys = new Set(responsibilities.filter((r) => r.enabled).map((r) => r.key));
    const catalog = getResponsibilityCatalog(employeeTypeKey);
    for (const def of catalog) if (def.essential) enabledKeys.add(def.key);

    return {
      [IntegrationType.WHATSAPP]: true, // sempre obrigatório para Atendimento
      [IntegrationType.GOOGLE_CALENDAR]: catalog.some((c) => c.requiresCalendar && enabledKeys.has(c.key)),
      [IntegrationType.GOOGLE_TASKS]: catalog.some((c) => c.requiresTasks && enabledKeys.has(c.key)),
    };
  }

  async get(companyId: string, digitalEmployeeId: string) {
    return this.prisma.withTenant(companyId, async (tx) => {
      const employee = await tx.digitalEmployee.findUnique({
        where: { id: digitalEmployeeId },
        include: { employeeType: true },
      });
      if (!employee) throw new NotFoundException('Funcionário não encontrado.');

      const required = await this.requiredness(tx, digitalEmployeeId, employee.employeeType.key);
      const integrations = await tx.integration.findMany({ where: { companyId } });
      const byType = new Map(integrations.map((i) => [i.type, i]));

      return (Object.keys(required) as IntegrationType[]).map((type) => {
        const isRequired = required[type];
        const row = byType.get(type);
        return {
          type,
          required: isRequired,
          status: !isRequired ? 'NOT_NECESSARY' : row?.status ?? IntegrationStatus.NOT_CONFIGURED,
          externalAccountRef: row?.externalAccountRef ?? null,
          connectedAt: row?.connectedAt ?? null,
        };
      });
    });
  }

  async startConnection(companyId: string, digitalEmployeeId: string, type: IntegrationType) {
    return this.prisma.withTenant(companyId, async (tx) => {
      await this.assertEmployeeExists(tx, digitalEmployeeId);
      await tx.integration.upsert({
        where: { companyId_type: { companyId, type } },
        create: { companyId, type, status: IntegrationStatus.CONNECTING },
        update: { status: IntegrationStatus.CONNECTING },
      });
      return this.readiness.recomputeStatus(tx, companyId, digitalEmployeeId);
    });
  }

  async confirmConnection(companyId: string, digitalEmployeeId: string, type: IntegrationType, externalAccountRef: string) {
    return this.prisma.withTenant(companyId, async (tx) => {
      await this.assertEmployeeExists(tx, digitalEmployeeId);
      await tx.integration.upsert({
        where: { companyId_type: { companyId, type } },
        create: {
          companyId,
          type,
          status: IntegrationStatus.CONNECTED,
          externalAccountRef,
          connectedAt: new Date(),
        },
        update: { status: IntegrationStatus.CONNECTED, externalAccountRef, connectedAt: new Date() },
      });
      return this.readiness.recomputeStatus(tx, companyId, digitalEmployeeId);
    });
  }

  async disconnect(companyId: string, digitalEmployeeId: string, type: IntegrationType) {
    return this.prisma.withTenant(companyId, async (tx) => {
      await this.assertEmployeeExists(tx, digitalEmployeeId);
      const existing = await tx.integration.findUnique({ where: { companyId_type: { companyId, type } } });
      if (!existing) throw new NotFoundException('Recurso não configurado.');
      await tx.integration.update({
        where: { companyId_type: { companyId, type } },
        data: { status: IntegrationStatus.DISCONNECTED, externalAccountRef: null, connectedAt: null },
      });
      // Desconectar um recurso obrigatório torna a preparação incompleta
      // (docs/design/24-work-resources-ui-spec.md §5) — o recompute
      // cuida disso automaticamente ao reavaliar a etapa "Recursos".
      return this.readiness.recomputeStatus(tx, companyId, digitalEmployeeId);
    });
  }

  private async assertEmployeeExists(tx: import('@prisma/client').Prisma.TransactionClient, digitalEmployeeId: string) {
    const employee = await tx.digitalEmployee.findUnique({ where: { id: digitalEmployeeId } });
    if (!employee) throw new NotFoundException('Funcionário não encontrado.');
  }
}
