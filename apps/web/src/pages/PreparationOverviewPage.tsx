import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, Circle, Clock } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { api, type WorkManual } from '../api/client';
import { Card } from '../components/Card';
import './PreparationOverviewPage.css';

const SECTION_STATE_LABEL: Record<WorkManual['sections'][number]['status'], string> = {
  not_started: 'Não iniciado',
  in_progress: 'Em andamento',
  complete: 'Completo',
};

/* Ícone nunca substitui o label de status — é só reforço visual, o texto
 * completo sempre acompanha (docs/design/06-shape-elevation-iconography.md §7). */
const SECTION_STATE_ICON: Record<WorkManual['sections'][number]['status'], typeof Circle> = {
  not_started: Circle,
  in_progress: Clock,
  complete: CheckCircle2,
};

/**
 * US06 — Iniciar preparação.
 *
 * Escopo confirmado: só entra na preparação e mostra a estrutura de
 * seções com estado inicial/incompleto — não preenche nenhuma seção
 * (isso é US07-US15, Sprint 02). Ver
 * docs/delivery/epics/E02-preparacao-do-funcionario/US06-iniciar-preparacao.md.
 */
export function PreparationOverviewPage() {
  const { id } = useParams<{ id: string }>();
  const [manual, setManual] = useState<WorkManual | null>(null);
  const [state, setState] = useState<'loading' | 'loaded' | 'error'>('loading');

  useEffect(() => {
    if (!id) return;
    // Entrar na preparação é a própria ação de "iniciar" (idempotente —
    // chamar de novo não recria nem reseta o manual).
    api
      .startPreparation(id)
      .then((data) => {
        setManual(data);
        setState('loaded');
      })
      .catch(() => setState('error'));
  }, [id]);

  if (state === 'loading') return <p>Entrando na preparação…</p>;
  if (state === 'error' || !manual) return <p>Não foi possível abrir a preparação deste funcionário.</p>;

  const total = manual.sections.length;
  const completed = manual.sections.filter((s) => s.status === 'complete').length;
  const nextSection = manual.sections.find((s) => s.status !== 'complete');

  return (
    <div className="braco-preparation-page">
      <Link to={`/equipe/${id}`} className="braco-preparation-page__back">
        <ArrowLeft size={16} aria-hidden="true" /> Voltar
      </Link>

      <h1 className="braco-page-title">Preparar funcionário</h1>
      <p className="braco-page-subtitle">
        <strong className="braco-numeric">{completed}</strong> de{' '}
        <strong className="braco-numeric">{total}</strong> seções completas
      </p>

      {nextSection && (
        <Card className="braco-preparation-page__next">
          Próximo item recomendado: <strong>{nextSection.label}</strong>
        </Card>
      )}

      <ul className="braco-preparation-page__sections">
        {manual.sections.map((section) => {
          const StatusIcon = SECTION_STATE_ICON[section.status];
          return (
            <li key={section.key} className="braco-preparation-page__section">
              <span>{section.label}</span>
              <span
                className={`braco-preparation-page__section-status braco-preparation-page__section-status--${section.status}`}
              >
                <StatusIcon size={16} aria-hidden="true" />
                {SECTION_STATE_LABEL[section.status]}
              </span>
            </li>
          );
        })}
      </ul>

      <p className="braco-preparation-page__note">
        O preenchimento do conteúdo de cada seção é a próxima etapa da
        preparação deste funcionário.
      </p>
    </div>
  );
}
