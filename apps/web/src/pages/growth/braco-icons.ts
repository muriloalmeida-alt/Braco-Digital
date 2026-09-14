import { Calculator, HeartHandshake, MessageCircle, TrendingUp, Wallet, type LucideIcon } from 'lucide-react';

/**
 * Ícone por Braço na landing — só apresentacional (Lucide, já usado no
 * projeto; nunca robôs/humanoides, docs/design/26-growth-landing-
 * experience.md §2). Chaveado por `EmployeeType.key`, nunca por posição
 * na lista — a disponibilidade/existência do Braço continua vindo do
 * backend (`publicApi.listEmployeeTypes()`); isto só decide qual ícone
 * mostrar quando o tipo existir.
 */
const ICONS_BY_KEY: Record<string, LucideIcon> = {
  atendimento: MessageCircle,
  vendas: TrendingUp,
  orcamentos: Calculator,
  'pos-venda': HeartHandshake,
  financeiro: Wallet,
};

const DEFAULT_ICON: LucideIcon = MessageCircle;

export function getBracoIcon(key: string): LucideIcon {
  return ICONS_BY_KEY[key] ?? DEFAULT_ICON;
}
