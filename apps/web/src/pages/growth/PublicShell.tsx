import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { Button } from '../../components/Button';
import './PublicShell.css';

const NAV_LINKS = [
  { href: '/#portfolio', label: 'Conheça os Braços' },
  { href: '/#como-funciona', label: 'Como funciona' },
  { href: '/#duvidas', label: 'Dúvidas' },
];

/**
 * Layout público (landing + diagnóstico) — deliberadamente SEM o
 * Navigation Drawer/Top App Bar do app gerencial (docs/technical/20-
 * sprint-02-tech-readiness.md §8): a landing não é uma tela "dentro" do
 * produto. Header fixo com navegação institucional (redesign da landing)
 * + rodapé institucional com a marca.
 *
 * Os links de seção usam `<a href="/#id">` (não `<Link>` do router): são
 * âncoras para seções da própria landing, e precisam funcionar mesmo
 * quando o visitante está em outra rota pública (ex.: `/monte-sua-
 * equipe`) — uma navegação completa para "/" seguida do scroll nativo do
 * navegador até a âncora, sem precisar de lógica própria de scroll entre
 * rotas.
 */
export function PublicShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  function goToDiagnostic() {
    setMenuOpen(false);
    navigate('/monte-sua-equipe');
  }

  return (
    <div className="braco-public-shell">
      <a className="braco-public-shell__skip-link" href="#conteudo-principal">
        Pular para o conteúdo
      </a>

      <header className="braco-public-shell__header">
        <Link to="/" className="braco-public-shell__brand" onClick={() => setMenuOpen(false)}>
          <img
            src="/brand/03_logo_horizontal_colorida.png"
            alt="BRAÇO Digital"
            className="braco-public-shell__logo"
            width={97}
            height={28}
          />
        </Link>

        <nav className="braco-public-shell__nav" aria-label="Navegação principal">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="braco-public-shell__nav-link">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="braco-public-shell__actions">
          <Link to="/login" className="braco-public-shell__enter">
            Entrar
          </Link>
          <Button className="braco-public-shell__header-cta" onClick={goToDiagnostic}>
            Montar minha equipe
          </Button>
        </div>

        <button
          type="button"
          className="braco-public-shell__menu-toggle"
          aria-expanded={menuOpen}
          aria-controls="braco-public-mobile-nav"
          aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </header>

      {menuOpen && (
        <div id="braco-public-mobile-nav" className="braco-public-shell__mobile-nav">
          <nav aria-label="Navegação principal (mobile)">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="braco-public-shell__mobile-link" onClick={() => setMenuOpen(false)}>
                {link.label}
              </a>
            ))}
            <Link to="/login" className="braco-public-shell__mobile-link" onClick={() => setMenuOpen(false)}>
              Entrar
            </Link>
          </nav>
          <Button className="braco-public-shell__mobile-cta" onClick={goToDiagnostic}>
            Montar minha equipe
          </Button>
        </div>
      )}

      <main id="conteudo-principal">{children}</main>

      <footer className="braco-public-shell__footer">
        <img
          src="/brand/03_logo_horizontal_colorida.png"
          alt=""
          className="braco-public-shell__footer-logo"
          width={83}
          height={24}
        />
        <nav className="braco-public-shell__footer-nav" aria-label="Institucional">
          {/* Política de Privacidade/Termos de Uso: conteúdo pendente do gate
           * jurídico (docs/technical/16-product-decisions-required.md) — sem
           * páginas reais ainda, então aparecem como texto informativo, não
           * como links quebrados ou fabricados. */}
          <span className="braco-public-shell__footer-pending" title="Em preparação">
            Política de Privacidade
          </span>
          <span className="braco-public-shell__footer-pending" title="Em preparação">
            Termos de Uso
          </span>
        </nav>
        <span className="braco-public-shell__copyright">© {new Date().getFullYear()} BRAÇO Digital</span>
      </footer>
    </div>
  );
}
