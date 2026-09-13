import type { AutosaveStatus } from '../hooks/useAutosave';
import './AutosaveIndicator.css';

/**
 * Feedback de autosave — docs/design/23-preparation-experience-spec.md §5.
 * Nunca avança/mostra sucesso enquanto uma alteração ainda não foi
 * confirmada pelo servidor.
 */
export function AutosaveIndicator({
  status,
  error,
  onRetry,
}: {
  status: AutosaveStatus;
  error?: string | null;
  onRetry?: () => void;
}) {
  if (status === 'idle') return null;

  return (
    <div className={`braco-autosave braco-autosave--${status}`} role="status" aria-live="polite">
      {status === 'saving' && <span>Salvando…</span>}
      {status === 'saved' && <span>✓ Salvo</span>}
      {status === 'error' && (
        <span>
          {error ?? 'Não foi possível salvar esta alteração.'}{' '}
          <button type="button" className="braco-autosave__retry" onClick={onRetry}>
            Tentar novamente
          </button>
        </span>
      )}
    </div>
  );
}
