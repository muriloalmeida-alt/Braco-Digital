import { Injectable, NotFoundException } from '@nestjs/common';
import { AutonomyLevel, EmployeeStatus, Prisma } from '@prisma/client';
import { AUTONOMY_RANK, getAutonomyDefault } from './catalogs/autonomy-catalog';
import { getResponsibilityCatalog } from './catalogs/responsibility-catalog';

export type StepKey =
  | 'empresa'
  | 'produtos_servicos'
  | 'responsabilidades'
  | 'regras_limites'
  | 'autonomia'
  | 'pessoas_responsaveis'
  | 'comunicacao'
  | 'recursos_trabalho';

export type StepStatus = 'not_started' | 'in_progress' | 'complete';
export type ReviewStatus = 'bloqueada' | 'disponivel' | 'concluida';

export interface ManualView {
  steps: Record<StepKey, StepStatus>;
  completedCount: number;
  totalSteps: 8;
  review: ReviewStatus;
  pendingSteps: StepKey[];
  employeeStatus: EmployeeStatus;
}

const STEP_ORDER: StepKey[] = [
  'empresa',
  'produtos_servicos',
  'responsabilidades',
  'regras_limites',
  'autonomia',
  'pessoas_responsaveis',
  'comunicacao',
  'recursos_trabalho',
];

/**
 * US15/US16/US17 — Autoridade de completude da preparação. Única fonte de
 * verdade para status de cada etapa, `X de 8`, disponibilidade da Revisão
 * e a transição `PREPARANDO ⇄ PRONTO` — nunca o frontend
 * (docs/technical/20-sprint-02-tech-readiness.md §10, TD13).
 *
 * Todos os métodos recebem um `tx` já aberto por `PrismaService.withTenant`
 * do chamador — este serviço não abre sua própria transação, para que a
 * leitura/recomputo aconteça atomicamente junto da mutação que a disparou.
 */
@Injectable()
export class PreparationReadinessService {
  async computeView(
    tx: Prisma.TransactionClient,
    companyId: string,
    digitalEmployeeId: string,
  ): Promise<ManualView> {
    const employee = await tx.digitalEmployee.findUnique({
      where: { id: digitalEmployeeId },
      include: { employeeType: true },
    });
    if (!employee) throw new NotFoundException('Funcionário não encontrado.');
    const company = await tx.company.findUnique({ where: { id: companyId } });
    if (!company) throw new NotFoundException('Empresa não encontrada.');

    const [productsCount, responsibilities, rules, autonomyPolicies, responsibles, communication, integrations] =
      await Promise.all([
        tx.productService.count({ where: { companyId } }),
        tx.employeeResponsibility.findMany({ where: { digitalEmployeeId } }),
        tx.workManualRule.findMany({ where: { digitalEmployeeId } }),
        tx.employeeAutonomyPolicy.findMany({ where: { digitalEmployeeId } }),
        tx.employeeResponsible.findMany({ where: { digitalEmployeeId } }),
        tx.employeeCommunicationStyle.findUnique({ where: { digitalEmployeeId } }),
        tx.integration.findMany({ where: { companyId } }),
      ]);

    const workManual = await tx.workManual.findUnique({ where: { digitalEmployeeId } });

    const catalog = getResponsibilityCatalog(employee.employeeType.key);
    const enabledKeys = new Set(
      responsibilities.filter((r) => r.enabled).map((r) => r.key),
    );
    // Essenciais contam como habilitadas mesmo antes de qualquer linha
    // existir (docs/design/22-work-manual-content-model.md §6) — mas a
    // etapa só é considerada tocada quando as linhas essenciais existem
    // de fato (seedEssentialResponsibilities, chamado pelos controllers).
    for (const def of catalog) {
      if (def.essential) enabledKeys.add(def.key);
    }

    const steps: Record<StepKey, StepStatus> = {
      empresa: this.computeEmpresaStatus(company),
      produtos_servicos: productsCount > 0 ? 'complete' : 'not_started',
      responsabilidades: this.computeResponsabilidadesStatus(catalog, responsibilities),
      regras_limites:
        rules.length > 0 || workManual?.rulesAcknowledgedNoAdditional
          ? 'complete'
          : 'not_started',
      autonomia: this.computeAutonomiaStatus(employee.employeeType.key, catalog, enabledKeys, autonomyPolicies),
      pessoas_responsaveis: responsibles.some((r) => r.kind === 'PRINCIPAL') ? 'complete' : 'not_started',
      comunicacao: this.computeComunicacaoStatus(communication),
      recursos_trabalho: this.computeRecursosStatus(catalog, enabledKeys, integrations),
    };

    const completedCount = STEP_ORDER.filter((k) => steps[k] === 'complete').length;
    const pendingSteps = STEP_ORDER.filter((k) => steps[k] !== 'complete');
    const allComplete = completedCount === STEP_ORDER.length;

    const review: ReviewStatus =
      employee.status === EmployeeStatus.PRONTO ? 'concluida' : allComplete ? 'disponivel' : 'bloqueada';

    return {
      steps,
      completedCount,
      totalSteps: 8,
      review,
      pendingSteps,
      employeeStatus: employee.status,
    };
  }

  /**
   * Chamado ao final de toda mutação de conteúdo do manual. Se o
   * funcionário está PRONTO mas uma etapa deixou de ser válida, rebaixa
   * para PREPARANDO **na mesma transação** — nunca como job separado
   * (docs/design/22-work-manual-content-model.md §13, §12-status-and-
   * states.md §3).
   */
  async recomputeStatus(
    tx: Prisma.TransactionClient,
    companyId: string,
    digitalEmployeeId: string,
  ): Promise<ManualView> {
    const view = await this.computeView(tx, companyId, digitalEmployeeId);

    if (view.employeeStatus === EmployeeStatus.PRONTO && view.completedCount < view.totalSteps) {
      await tx.digitalEmployee.update({
        where: { id: digitalEmployeeId },
        data: { status: EmployeeStatus.PREPARANDO },
      });
      return { ...view, employeeStatus: EmployeeStatus.PREPARANDO, review: 'bloqueada' };
    }

    return view;
  }

  private computeEmpresaStatus(company: {
    attendanceName: string | null;
    about: string | null;
    serviceMode: string | null;
    address: string | null;
    businessHours: unknown;
  }): StepStatus {
    const hasBusinessHours = Array.isArray(company.businessHours) && company.businessHours.length > 0;
    const addressOk = company.serviceMode === 'ONLINE' || Boolean(company.address);

    const required = [company.attendanceName, company.about, company.serviceMode, hasBusinessHours || null];
    const allPresent = Boolean(
      company.attendanceName && company.about && company.serviceMode && hasBusinessHours && addressOk,
    );
    const nonePresent = required.every((v) => !v);

    if (allPresent) return 'complete';
    if (nonePresent) return 'not_started';
    return 'in_progress';
  }

  private computeResponsabilidadesStatus(
    catalog: { key: string; essential: boolean }[],
    rows: { key: string }[],
  ): StepStatus {
    if (rows.length === 0) return 'not_started';
    const essentialKeys = catalog.filter((c) => c.essential).map((c) => c.key);
    const rowKeys = new Set(rows.map((r) => r.key));
    const allEssentialPresent = essentialKeys.every((k) => rowKeys.has(k));
    return allEssentialPresent ? 'complete' : 'in_progress';
  }

  private computeAutonomiaStatus(
    employeeTypeKey: string,
    catalog: { key: string }[],
    enabledKeys: Set<string>,
    policies: { responsibilityKey: string; level: AutonomyLevel; condition: string | null }[],
  ): StepStatus {
    const relevantKeys = catalog.map((c) => c.key).filter((k) => enabledKeys.has(k));
    if (relevantKeys.length === 0) return 'not_started';

    const byKey = new Map(policies.map((p) => [p.responsibilityKey, p]));
    if (byKey.size === 0) return 'not_started';

    const allValid = relevantKeys.every((key) => {
      const policy = byKey.get(key);
      if (!policy) return false;
      if (policy.level === AutonomyLevel.PODE_DECIDIR_SOB_REGRAS && !policy.condition?.trim()) {
        return false;
      }
      // Defesa em profundidade: mesmo que um valor acima do teto tenha
      // entrado por algum caminho não validado, a etapa nunca aparece
      // "Completa" com uma violação de teto (TD14).
      const def = getAutonomyDefault(employeeTypeKey, key);
      if (def && AUTONOMY_RANK[policy.level] > AUTONOMY_RANK[def.ceiling]) return false;
      return true;
    });

    return allValid ? 'complete' : 'in_progress';
  }

  private computeComunicacaoStatus(style: {
    tone: string | null;
    addressing: string | null;
    length: string | null;
    emojis: string | null;
  } | null): StepStatus {
    if (!style) return 'not_started';
    const allSet = Boolean(style.tone && style.addressing && style.length && style.emojis);
    const noneSet = !style.tone && !style.addressing && !style.length && !style.emojis;
    if (allSet) return 'complete';
    if (noneSet) return 'not_started';
    return 'in_progress';
  }

  private computeRecursosStatus(
    catalog: { key: string; requiresCalendar: boolean; requiresTasks: boolean }[],
    enabledKeys: Set<string>,
    integrations: { type: string; status: string }[],
  ): StepStatus {
    const needsCalendar = catalog.some((c) => c.requiresCalendar && enabledKeys.has(c.key));
    const needsTasks = catalog.some((c) => c.requiresTasks && enabledKeys.has(c.key));

    const byType = new Map(integrations.map((i) => [i.type, i.status]));
    const whatsappOk = byType.get('WHATSAPP') === 'CONNECTED';
    const calendarOk = !needsCalendar || byType.get('GOOGLE_CALENDAR') === 'CONNECTED';
    const tasksOk = !needsTasks || byType.get('GOOGLE_TASKS') === 'CONNECTED';

    if (whatsappOk && calendarOk && tasksOk) return 'complete';
    if (integrations.length === 0) return 'not_started';
    return 'in_progress';
  }
}
