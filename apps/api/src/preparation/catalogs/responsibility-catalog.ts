/**
 * US09 — Catálogo de responsabilidades do Braço Atendimento.
 *
 * Fixo em código, não editável pelo gestor nem customizável no MVP —
 * docs/design/22-work-manual-content-model.md §6: "Não existe
 * responsabilidade arbitrária/customizada no MVP." Escopado por
 * `EmployeeType.key` porque cada tipo de funcionário tem seu próprio
 * catálogo (só "atendimento" existe na Sprint 02).
 *
 * `requiresCalendar`/`requiresTasks` alimentam a obrigatoriedade dinâmica
 * de recursos (US14) — nunca uma coluna própria, sempre derivada daqui
 * (docs/technical/20-sprint-02-tech-readiness.md §4).
 */
export interface ResponsibilityDefinition {
  key: string;
  label: string;
  /** Essenciais: sempre habilitadas, não removíveis pelo gestor. */
  essential: boolean;
  requiresCalendar: boolean;
  requiresTasks: boolean;
}

export const ATENDIMENTO_RESPONSIBILITY_CATALOG: ResponsibilityDefinition[] = [
  { key: 'receber_clientes', label: 'Receber clientes', essential: true, requiresCalendar: false, requiresTasks: false },
  { key: 'identificar_necessidade', label: 'Identificar a necessidade do cliente', essential: true, requiresCalendar: false, requiresTasks: false },
  { key: 'encaminhar_humano', label: 'Encaminhar para uma pessoa quando necessário', essential: true, requiresCalendar: false, requiresTasks: false },

  { key: 'responder_duvidas', label: 'Responder dúvidas', essential: false, requiresCalendar: false, requiresTasks: false },
  { key: 'explicar_produtos_servicos', label: 'Explicar produtos e serviços', essential: false, requiresCalendar: false, requiresTasks: false },
  { key: 'informar_precos', label: 'Informar preços e condições autorizadas', essential: false, requiresCalendar: false, requiresTasks: false },
  { key: 'agendar', label: 'Agendar', essential: false, requiresCalendar: true, requiresTasks: false },
  { key: 'confirmar_agendamento', label: 'Confirmar agendamento', essential: false, requiresCalendar: true, requiresTasks: false },
  { key: 'reagendar', label: 'Reagendar', essential: false, requiresCalendar: true, requiresTasks: false },
  { key: 'cancelar', label: 'Cancelar', essential: false, requiresCalendar: true, requiresTasks: false },
  { key: 'fazer_follow_up', label: 'Fazer follow-up', essential: false, requiresCalendar: false, requiresTasks: true },
  { key: 'recuperar_contatos', label: 'Recuperar contatos/oportunidades abandonadas', essential: false, requiresCalendar: false, requiresTasks: true },
  { key: 'enviar_lembretes', label: 'Enviar lembretes', essential: false, requiresCalendar: false, requiresTasks: true },
  { key: 'identificar_insatisfacao', label: 'Identificar insatisfação', essential: false, requiresCalendar: false, requiresTasks: false },
];

const CATALOG_BY_TYPE: Record<string, ResponsibilityDefinition[]> = {
  atendimento: ATENDIMENTO_RESPONSIBILITY_CATALOG,
};

export function getResponsibilityCatalog(employeeTypeKey: string): ResponsibilityDefinition[] {
  return CATALOG_BY_TYPE[employeeTypeKey] ?? [];
}

export function getResponsibilityDefinition(
  employeeTypeKey: string,
  responsibilityKey: string,
): ResponsibilityDefinition | undefined {
  return getResponsibilityCatalog(employeeTypeKey).find((r) => r.key === responsibilityKey);
}
