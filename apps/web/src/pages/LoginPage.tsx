import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../api/auth-context';
import { ApiError } from '../api/client';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import './LoginPage.css';

/**
 * Login — o momento mais institucional do app
 * (docs/design/20-brand-ui-integration.md §5, docs/design/21-logo-usage.md §3).
 *
 * Expanded: painel de marca (gradiente institucional #07345A -> #0B4F86)
 * com a logo negativa branca e a assinatura como texto HTML real. Compact:
 * só o formulário, com a logo vertical colorida sem assinatura.
 */
export function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('owner@clinicavida.demo');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    const redirectTo = (location.state as { from?: string } | null)?.from ?? '/equipe';
    return <Navigate to={redirectTo} replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/equipe', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível entrar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="braco-login-page">
      <div className="braco-login-page__brand-panel" aria-hidden="true">
        <img
          src="/brand/06_logo_negativa_branca.png"
          alt=""
          className="braco-login-page__brand-logo"
        />
        <p className="braco-login-page__brand-tagline">Mais capacidade para sua empresa.</p>
      </div>

      <div className="braco-login-page__form-panel">
        <img
          src="/brand/02_logo_vertical_sem_assinatura.png"
          alt="BRAÇO Digital"
          className="braco-login-page__compact-logo"
        />

        <Card className="braco-login-page__card">
          <form onSubmit={handleSubmit} className="braco-login-page__form">
            <label>
              E-mail
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </label>
            <label>
              Senha
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
            {error && (
              <p role="alert" className="braco-login-page__error">
                {error}
              </p>
            )}
            <Button type="submit" disabled={loading}>
              {loading ? 'Entrando…' : 'Entrar'}
            </Button>
          </form>
          <p className="braco-login-page__hint">
            Onboarding manual (PD1): use as credenciais de demonstração criadas pelo seed —
            owner@clinicavida.demo / braco123.
          </p>
        </Card>
      </div>
    </div>
  );
}
