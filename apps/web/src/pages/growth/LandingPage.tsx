import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { EmployeeType } from '../../api/client';
import { trackGrowthEvent } from '../../api/growth-analytics';
import { publicApi } from '../../api/public';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { CatalogAvailabilityLabel } from '../../components/CatalogAvailabilityLabel';
import { PublicShell } from './PublicShell';
import './growth.css';

const FAQ_ITEMS = [
  {
    q: 'O que é um Braço?',
    a: 'Um funcionário digital preparado para executar uma função específica junto com sua equipe.',
  },
  {
    q: 'É uma pessoa?',
    a: 'Não. É um atendimento/funcionário digital e essa identidade é sempre transparente.',
  },
  {
    q: 'Preciso trocar meus sistemas?',
    a: 'O BRAÇO usa integrações para trabalhar; a gestão acontece dentro do BRAÇO.',
  },
  {
    q: 'Todos os Braços já estão disponíveis?',
    a: 'Não. A experiência mostra claramente o que está disponível agora e o que está Em breve.',
  },
  {
    q: 'Preciso criar uma conta para fazer o diagnóstico?',
    a: 'Não.',
  },
];

/** US77 — Visualizar Landing Page. docs/design/26-growth-landing-experience.md. */
export function LandingPage() {
  const navigate = useNavigate();
  const [types, setTypes] = useState<EmployeeType[]>([]);

  useEffect(() => {
    document.title = 'BRAÇO — Funcionários digitais para pequenas empresas';
    trackGrowthEvent('landing_view');
    publicApi.listEmployeeTypes().then(setTypes).catch(() => setTypes([]));
  }, []);

  return (
    <PublicShell>
      <section className="braco-growth-section braco-growth-hero">
        <div>
          <p className="braco-growth-hero__eyebrow">Funcionários digitais para pequenas empresas</p>
          <h1 className="braco-growth-hero__headline">Sua empresa precisa de mais um braço? Agora tem.</h1>
          <p className="braco-growth-hero__support">
            Funcionários digitais que trabalham junto com sua equipe para manter o trabalho importante em movimento.
          </p>
          <div className="braco-growth-hero__ctas">
            <Button onClick={() => navigate('/monte-sua-equipe')}>Montar minha equipe</Button>
            <Button variant="text" onClick={() => document.getElementById('portfolio')?.scrollIntoView({ behavior: 'smooth' })}>
              Conhecer os Braços
            </Button>
          </div>
        </div>
      </section>

      <section className="braco-growth-section" aria-labelledby="como-funciona-heading">
        <h2 id="como-funciona-heading" className="braco-growth-heading">
          Como funciona
        </h2>
        <div className="braco-growth-steps">
          <Card className="braco-growth-step">
            <span className="braco-growth-step__number">1</span>
            <h3>Conte o que está ficando para depois</h3>
            <p>Um diagnóstico rápido, sem login.</p>
          </Card>
          <Card className="braco-growth-step">
            <span className="braco-growth-step__number">2</span>
            <h3>Veja sua equipe recomendada</h3>
            <p>BRAÇO relaciona suas necessidades às funções do portfólio.</p>
          </Card>
          <Card className="braco-growth-step">
            <span className="braco-growth-step__number">3</span>
            <h3>Comece pelo que está disponível</h3>
            <p>Disponibilidade real e transparente.</p>
          </Card>
        </div>
      </section>

      <section id="portfolio" className="braco-growth-section" aria-labelledby="portfolio-heading">
        <h2 id="portfolio-heading" className="braco-growth-heading">
          Conheça os Braços
        </h2>
        <div className="braco-growth-portfolio">
          {types.map((type) => (
            <Card key={type.id} className="braco-growth-portfolio-card">
              <div className="braco-diagnostic__result-card-header">
                <h3>{type.name}</h3>
                <CatalogAvailabilityLabel availability={type.availability} />
              </div>
              <p>{type.role}</p>
              <p>{type.mission}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="braco-growth-section">
        <div className="braco-growth-diagnostic-teaser">
          <h2 style={{ margin: 0 }}>O que está faltando na sua equipe?</h2>
          <p style={{ margin: 0 }}>Conte onde o trabalho está acumulando e vamos montar uma equipe recomendada.</p>
          <Button onClick={() => navigate('/monte-sua-equipe')}>Começar diagnóstico</Button>
        </div>
      </section>

      <section className="braco-growth-section" aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="braco-growth-heading">
          Perguntas frequentes
        </h2>
        <div className="braco-growth-faq">
          {FAQ_ITEMS.map((item) => (
            <div key={item.q} className="braco-growth-faq-item">
              <h3>{item.q}</h3>
              <p>{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="braco-growth-section">
        <div className="braco-growth-cta-final">
          <h2>Qual trabalho sua empresa não deveria continuar deixando para depois?</h2>
          <Button onClick={() => navigate('/monte-sua-equipe')}>Montar minha equipe</Button>
        </div>
      </section>
    </PublicShell>
  );
}
