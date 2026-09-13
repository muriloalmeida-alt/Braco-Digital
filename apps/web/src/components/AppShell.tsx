import { type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../api/auth-context';
import { Button } from './Button';
import './AppShell.css';

/**
 * Navegação — docs/design/11-navigation.md. Nesta sprint, os destinos
 * primários relevantes são Minha Equipe (home conceitual do produto) e o
 * catálogo de contratação (acessado a partir dela, não como destino
 * permanente — §7 "CTA global").
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <div className="braco-app-shell">
      <header className="braco-app-shell__topbar">
        <span className="braco-app-shell__logo">BRAÇO</span>
        <nav className="braco-app-shell__nav">
          <NavLink to="/equipe" className={({ isActive }) => (isActive ? 'is-active' : '')}>
            Minha Equipe
          </NavLink>
        </nav>
        <div className="braco-app-shell__user">
          <span>{user?.name}</span>
          <Button variant="text" onClick={logout}>
            Sair
          </Button>
        </div>
      </header>
      <main className="braco-app-shell__content">{children}</main>
    </div>
  );
}
