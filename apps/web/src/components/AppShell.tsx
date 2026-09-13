import { type ReactNode } from 'react';
import { LogOut, Users } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../api/auth-context';
import './AppShell.css';

/**
 * Navegação — docs/design/11-navigation.md, docs/design/20-brand-ui-
 * integration.md §3/§4. Nesta sprint, os destinos primários relevantes são
 * Minha Equipe (home conceitual do produto) e o catálogo de contratação
 * (acessado a partir dela, não como destino permanente — §7 "CTA global").
 *
 * App Shell responsivo (Brand UI Foundation, sem mudança de rotas/estados):
 * - Expanded (>=900px): Navigation Rail/Drawer fixo em Azul Profundo
 *   (`--braco-color-nav-surface`), com a logo negativa branca.
 * - Compact/Medium (<900px): Top App Bar sobre Off White, com a logo
 *   horizontal colorida (ou o ícone do app quando a largura não comporta a
 *   assinatura, tratado via CSS/`clamp`, não JS).
 * A troca é só CSS (`@media`), sem detecção de breakpoint em JS.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'braco-app-shell__nav-link is-active' : 'braco-app-shell__nav-link';

  return (
    <div className="braco-app-shell">
      <aside className="braco-app-shell__drawer" aria-label="Navegação principal">
        <img
          src="/brand/06_logo_negativa_branca.png"
          alt="BRAÇO"
          className="braco-app-shell__drawer-logo"
        />
        <nav className="braco-app-shell__drawer-nav">
          <NavLink to="/equipe" className={navLinkClass}>
            <Users size={20} aria-hidden="true" />
            Minha Equipe
          </NavLink>
        </nav>
        <div className="braco-app-shell__drawer-footer">
          <span className="braco-app-shell__user-name">{user?.name}</span>
          <button className="braco-app-shell__logout" onClick={logout}>
            <LogOut size={18} aria-hidden="true" />
            Sair
          </button>
        </div>
      </aside>

      <div className="braco-app-shell__body">
        <header className="braco-app-shell__topbar">
          <img
            src="/brand/03_logo_horizontal_colorida.png"
            alt="BRAÇO"
            className="braco-app-shell__topbar-logo"
          />
          <img
            src="/brand/09_icone_aplicativo.png"
            alt="BRAÇO"
            className="braco-app-shell__topbar-icon"
          />
          <nav className="braco-app-shell__nav">
            <NavLink to="/equipe" className={navLinkClass}>
              Minha Equipe
            </NavLink>
          </nav>
          <div className="braco-app-shell__user">
            <span>{user?.name}</span>
            <button className="braco-app-shell__logout" onClick={logout}>
              <LogOut size={18} aria-hidden="true" />
              Sair
            </button>
          </div>
        </header>
        <main className="braco-app-shell__content">{children}</main>
      </div>
    </div>
  );
}
