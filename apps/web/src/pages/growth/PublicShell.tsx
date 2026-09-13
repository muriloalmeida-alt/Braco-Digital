import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import './PublicShell.css';

/**
 * Layout público (landing + diagnóstico) — deliberadamente SEM o
 * Navigation Drawer/Top App Bar do app gerencial (docs/technical/20-
 * sprint-02-tech-readiness.md §8): a landing não é uma tela "dentro" do
 * produto.
 */
export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="braco-public-shell">
      <header className="braco-public-shell__header">
        <Link to="/" className="braco-public-shell__brand">
          <img src="/brand/03_logo_horizontal_colorida.png" alt="BRAÇO" className="braco-public-shell__logo" />
        </Link>
        <Link to="/login" className="braco-public-shell__enter">
          Entrar
        </Link>
      </header>
      <main id="conteudo-principal">{children}</main>
      <footer className="braco-public-shell__footer">
        <span>© {new Date().getFullYear()} BRAÇO</span>
      </footer>
    </div>
  );
}
