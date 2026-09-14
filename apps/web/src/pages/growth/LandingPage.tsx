import { CalendarX, ClipboardX, MessageCircleOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { EmployeeType } from '../../api/client';
import { trackGrowthEvent } from '../../api/growth-analytics';
import { publicApi } from '../../api/public';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { FaqAccordion, type FaqItem } from '../../components/FaqAccordion';
import { IntegrationBadge } from '../../components/IntegrationBadge';
import { BracoPortfolioCard } from './BracoPortfolioCard';
import { PublicShell } from './PublicShell';
import { WhatsAppConversationDemo, WhatsAppFloatingCard } from './WhatsAppShowcase';
import './growth.css';

const FAQ_ITEMS: FaqItem[] = [
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

type LoadState = 'loading' | 'loaded' | 'error';

/** US77 — Visualizar Landing Page. docs/design/26-growth-landing-experience.md. */
export function LandingPage() {
  const navigate = useNavigate();
  const [types, setTypes] = useState<EmployeeType[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');

  useEffect(() => {
    document.title = 'BRAÇO — Mais capacidade para sua empresa';
    trackGrowthEvent('landing_view');
    publicApi
      .listEmployeeTypes()
      .then((result) => {
        setTypes(result);
        setLoadState('loaded');
      })
      .catch(() => {
        setTypes([]);
        setLoadState('error');
      });
  }, []);

  function scrollToPortfolio() {
    document.getElementById('portfolio')?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <PublicShell>
      {/* ---------- Hero ---------- */}
      <section className="braco-growth-hero-band">
        <div className="braco-growth-section braco-growth-hero">
          <div className="braco-growth-hero__copy">
            <p className="braco-growth-hero__eyebrow">Funcionários digitais para pequenas empresas</p>
            <h1 className="braco-growth-hero__headline">
              Mais capacidade para <span className="braco-growth-hero__headline-accent">sua empresa.</span>
            </h1>
            <p className="braco-growth-hero__support">
              Contrate funcionários digitais que trabalham pelo WhatsApp, cuidam do que está acumulado e avançam
              junto com a sua equipe — todos os dias.
            </p>
            <div className="braco-growth-hero__ctas">
              <Button onClick={() => navigate('/monte-sua-equipe')}>Montar minha equipe →</Button>
              <Button variant="outlined" onClick={scrollToPortfolio}>
                Conhecer os Braços
              </Button>
            </div>
            <p className="braco-growth-hero__microcopy">
              ✓ Diagnóstico gratuito · sem cartão · leva menos de 3 minutos
            </p>
          </div>

          <div className="braco-growth-hero__visual" aria-hidden={false}>
            <div className="braco-growth-hero__visual-backdrop">
              <img
                src="/brand/07_simbolo_colorido.png"
                alt=""
                className="braco-growth-hero__symbol"
                width={190}
                height={190}
              />
            </div>
            <WhatsAppFloatingCard />
          </div>
        </div>
      </section>

      {/* ---------- Faixa de integrações ---------- */}
      <section className="braco-growth-section braco-growth-integrations-strip" aria-labelledby="integrations-strip-heading">
        <p id="integrations-strip-heading" className="braco-growth-integrations-strip__label">
          Seus Braços trabalham com as ferramentas que sua empresa já usa:
        </p>
        <div className="braco-growth-integrations-strip__badges">
          <IntegrationBadge integration="whatsapp" />
          <IntegrationBadge integration="google-calendar" />
          <IntegrationBadge integration="google-tasks" />
        </div>
      </section>

      {/* ---------- Dores ---------- */}
      <section className="braco-growth-section" aria-labelledby="dores-heading">
        <p className="braco-growth-hero__eyebrow braco-growth-eyebrow--centered">Sua rotina hoje</p>
        <h2 id="dores-heading" className="braco-growth-heading">
          Trabalho importante não deveria ficar para depois.
        </h2>
        <p className="braco-growth-support">
          Quando falta braço, o dono vira atendimento, financeiro e comercial ao mesmo tempo. O BRAÇO assume tarefas
          claras para sua empresa voltar a avançar.
        </p>
        <div className="braco-growth-pains">
          <Card className="braco-growth-pain-card">
            <MessageCircleOff aria-hidden="true" size={28} className="braco-growth-pain-card__icon" />
            <h3>Clientes sem resposta</h3>
            <p>Mensagens se acumulam e oportunidades esfriam antes do primeiro contato.</p>
          </Card>
          <Card className="braco-growth-pain-card">
            <CalendarX aria-hidden="true" size={28} className="braco-growth-pain-card__icon" />
            <h3>Agenda desorganizada</h3>
            <p>Confirmações, reagendamentos e lembretes dependem sempre de alguém.</p>
          </Card>
          <Card className="braco-growth-pain-card">
            <ClipboardX aria-hidden="true" size={28} className="braco-growth-pain-card__icon" />
            <h3>Rotinas esquecidas</h3>
            <p>Tarefas essenciais perdem espaço para as urgências do dia a dia.</p>
          </Card>
        </div>
      </section>

      {/* ---------- Portfólio de Braços ---------- */}
      <section id="portfolio" className="braco-growth-section" aria-labelledby="portfolio-heading">
        <p className="braco-growth-hero__eyebrow braco-growth-eyebrow--centered">Sua equipe digital</p>
        <h2 id="portfolio-heading" className="braco-growth-heading">
          Um Braço para cada trabalho.
        </h2>
        <p className="braco-growth-support">Comece por uma função e amplie sua equipe conforme a empresa precisar.</p>

        {loadState === 'loading' && <p className="braco-growth-portfolio-status">Carregando os Braços disponíveis…</p>}
        {loadState === 'error' && (
          <p className="braco-growth-portfolio-status">
            Não foi possível carregar a equipe agora. Você ainda pode começar o diagnóstico normalmente.
          </p>
        )}
        {loadState === 'loaded' && types.length === 0 && (
          <p className="braco-growth-portfolio-status">Nenhum Braço cadastrado no momento.</p>
        )}

        {types.length > 0 && (
          <div className="braco-growth-portfolio">
            {types.map((type) => (
              <BracoPortfolioCard key={type.id} employeeType={type} />
            ))}
          </div>
        )}
      </section>

      {/* ---------- Demonstração pelo WhatsApp ---------- */}
      <section className="braco-growth-section" aria-labelledby="whatsapp-demo-heading">
        <div className="braco-growth-whatsapp-demo">
          <div className="braco-growth-whatsapp-demo__copy">
            <h2 id="whatsapp-demo-heading" className="braco-growth-heading braco-growth-heading--left">
              Fale com seus Braços pelo WhatsApp.
            </h2>
            <p className="braco-growth-support braco-growth-support--left">
              Nada de aprender um sistema complicado para pedir ajuda. Você orienta, acompanha e recebe atualizações
              pelo canal que já usa todos os dias.
            </p>
          </div>
          <WhatsAppConversationDemo />
        </div>
      </section>

      {/* ---------- Como funciona ---------- */}
      <section id="como-funciona" className="braco-growth-section" aria-labelledby="como-funciona-heading">
        <p className="braco-growth-hero__eyebrow braco-growth-eyebrow--centered">Comece sem complicação</p>
        <h2 id="como-funciona-heading" className="braco-growth-heading">
          Da necessidade ao trabalho feito.
        </h2>
        <div className="braco-growth-steps">
          <Card className="braco-growth-step">
            <span className="braco-growth-step__number">1</span>
            <h3>Conte o que está acumulando</h3>
            <p>Responda um diagnóstico rápido, sem precisar criar uma conta.</p>
          </Card>
          <Card className="braco-growth-step">
            <span className="braco-growth-step__number">2</span>
            <h3>Monte sua equipe recomendada</h3>
            <p>Veja quais Braços combinam com as necessidades da sua empresa.</p>
          </Card>
          <Card className="braco-growth-step">
            <span className="braco-growth-step__number">3</span>
            <h3>Ative e comece a delegar</h3>
            <p>Conecte as ferramentas e fale com seus Braços pelo WhatsApp.</p>
          </Card>
        </div>
      </section>

      {/* ---------- Bloco de integrações ---------- */}
      <section className="braco-growth-section braco-growth-integrations-block" aria-labelledby="integrations-block-heading">
        <h2 id="integrations-block-heading" className="braco-growth-heading">
          Integra com sua rotina. Não substitui tudo.
        </h2>
        <p className="braco-growth-support">O BRAÇO conecta os canais e ferramentas que fazem o trabalho acontecer.</p>
        <div className="braco-growth-integrations-strip__badges">
          <IntegrationBadge integration="whatsapp" />
          <IntegrationBadge integration="google-calendar" />
          <IntegrationBadge integration="google-tasks" />
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <section id="duvidas" className="braco-growth-section" aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="braco-growth-heading">
          Perguntas frequentes
        </h2>
        <FaqAccordion items={FAQ_ITEMS} />
      </section>

      {/* ---------- CTA final ---------- */}
      <section className="braco-growth-section">
        <div className="braco-growth-cta-final">
          <h2>Sua empresa precisa de mais capacidade?</h2>
          <p>Descubra quais Braços podem começar a trabalhar com você.</p>
          <Button onClick={() => navigate('/monte-sua-equipe')}>Montar minha equipe</Button>
        </div>
      </section>
    </PublicShell>
  );
}
