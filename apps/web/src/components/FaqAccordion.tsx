import { ChevronDown } from 'lucide-react';
import { useId, useState } from 'react';
import './FaqAccordion.css';

export interface FaqItem {
  q: string;
  a: string;
}

/**
 * FAQ como accordion acessível (redesign da landing, seção "FAQ"):
 * funciona por mouse, toque e teclado (botão nativo — Enter/Espaço já
 * incluídos), `aria-expanded`, foco visível (herdado de `:focus-visible`
 * global), área de toque >=56px, animação discreta que respeita
 * `prefers-reduced-motion` (FaqAccordion.css).
 */
export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndexes, setOpenIndexes] = useState<Set<number>>(new Set());
  const baseId = useId();

  function toggle(index: number) {
    setOpenIndexes((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  return (
    <div className="braco-faq">
      {items.map((item, index) => {
        const isOpen = openIndexes.has(index);
        const triggerId = `${baseId}-trigger-${index}`;
        const panelId = `${baseId}-panel-${index}`;
        return (
          <div className="braco-faq-item" key={item.q}>
            <h3 style={{ margin: 0 }}>
              <button
                type="button"
                id={triggerId}
                className="braco-faq-item__trigger"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(index)}
              >
                <span>{item.q}</span>
                <ChevronDown className="braco-faq-item__icon" size={20} aria-hidden="true" />
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={triggerId}
              aria-hidden={!isOpen}
              className={`braco-faq-item__panel ${isOpen ? 'is-open' : ''}`}
            >
              <div className="braco-faq-item__panel-inner">
                <p>{item.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
