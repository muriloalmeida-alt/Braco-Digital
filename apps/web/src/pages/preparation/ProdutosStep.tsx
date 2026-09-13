import { useEffect, useState } from 'react';
import { ApiError } from '../../api/client';
import { preparationApi, type PricingMode, type ProductService, type ProductServiceKind } from '../../api/preparation';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';

type DraftState = {
  name: string;
  kind: ProductServiceKind;
  clientDescription: string;
  pricingMode: PricingMode;
  price: string;
  schedulable: boolean;
  durationMinutes: string;
  notes: string;
};

const EMPTY_DRAFT: DraftState = {
  name: '',
  kind: 'SERVICO',
  clientDescription: '',
  pricingMode: 'SOB_CONSULTA',
  price: '',
  schedulable: false,
  durationMinutes: '',
  notes: '',
};

/** US08 — Produtos e serviços. Compartilhado — docs/design/22-work-manual-content-model.md §5. */
export function ProdutosStep({ onSaved, onContinue }: { onSaved: () => Promise<void>; onContinue: () => Promise<void> }) {
  const [items, setItems] = useState<ProductService[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [draft, setDraft] = useState<DraftState>(EMPTY_DRAFT);
  const [formError, setFormError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  function load() {
    preparationApi.listProducts().then((data) => {
      setItems(data);
      setLoading(false);
    });
  }

  useEffect(load, []);

  function startNew() {
    setDraft(EMPTY_DRAFT);
    setFormError(null);
    setEditingId('new');
  }

  function startEdit(item: ProductService) {
    setDraft({
      name: item.name,
      kind: item.kind,
      clientDescription: item.clientDescription,
      pricingMode: item.pricingMode,
      price: item.price ?? '',
      schedulable: item.schedulable,
      durationMinutes: item.durationMinutes ? String(item.durationMinutes) : '',
      notes: item.notes ?? '',
    });
    setFormError(null);
    setEditingId(item.id);
  }

  async function submitDraft() {
    setFormError(null);
    const needsPrice = draft.pricingMode === 'FIXO' || draft.pricingMode === 'A_PARTIR_DE';
    const payload = {
      name: draft.name,
      kind: draft.kind,
      clientDescription: draft.clientDescription,
      pricingMode: draft.pricingMode,
      price: needsPrice && draft.price ? Number(draft.price) : undefined,
      schedulable: draft.schedulable,
      durationMinutes: draft.schedulable && draft.durationMinutes ? Number(draft.durationMinutes) : undefined,
      notes: draft.notes || undefined,
    };
    try {
      if (editingId === 'new') {
        await preparationApi.createProduct(payload);
      } else if (editingId) {
        await preparationApi.updateProduct(editingId, payload);
      }
      setEditingId(null);
      load();
      await onSaved();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Não foi possível salvar este item.');
    }
  }

  async function remove(id: string) {
    if (!window.confirm('Excluir este item?')) return;
    setListError(null);
    try {
      await preparationApi.deleteProduct(id);
      load();
      await onSaved();
    } catch (err) {
      setListError(err instanceof ApiError ? err.message : 'Não foi possível excluir este item.');
    }
  }

  if (loading) return <p>Carregando…</p>;

  return (
    <div>
      <p className="braco-prep__shared-banner">Compartilhado com sua equipe digital</p>

      {items.length === 0 && editingId === null && (
        <Card className="braco-prep__empty">
          <p>
            <strong>Nenhum produto ou serviço cadastrado</strong>
          </p>
          <p>Adicione o que seu funcionário precisa conhecer para orientar seus clientes.</p>
          <Button onClick={startNew}>Adicionar produto ou serviço</Button>
        </Card>
      )}

      {listError && <p className="braco-prep__field-error">{listError}</p>}

      {items.length > 0 && (
        <div className="braco-prep__list">
          {items.map((item) => (
            <Card key={item.id} className="braco-prep__list-item">
              <div>
                <strong>{item.name}</strong> — {item.kind === 'PRODUTO' ? 'Produto' : 'Serviço'}
                <p>
                  {item.pricingMode === 'FIXO' && `Valor fixo · R$ ${item.price}`}
                  {item.pricingMode === 'A_PARTIR_DE' && `A partir de R$ ${item.price}`}
                  {item.pricingMode === 'SOB_CONSULTA' && 'Sob consulta'}
                  {item.pricingMode === 'NAO_INFORMAR' && 'Não informar preço'}
                  {item.schedulable && ` · Agendável · ${item.durationMinutes} min`}
                </p>
              </div>
              <div className="braco-prep__list-item-actions">
                <button type="button" onClick={() => startEdit(item)}>
                  Editar
                </button>
                <button type="button" onClick={() => remove(item.id)}>
                  Excluir
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {items.length > 0 && editingId === null && (
        <Button variant="text" onClick={startNew}>
          + Adicionar produto ou serviço
        </Button>
      )}

      {editingId !== null && (
        <Card style={{ marginTop: 16 }}>
          <div className="braco-prep__field">
            <label htmlFor="prod-name">Nome *</label>
            <input id="prod-name" type="text" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </div>

          <div className="braco-prep__field">
            <span>Tipo *</span>
            <div className="braco-prep__radio-group">
              <label className="braco-prep__radio-option">
                <input type="radio" checked={draft.kind === 'PRODUTO'} onChange={() => setDraft({ ...draft, kind: 'PRODUTO' })} />
                Produto
              </label>
              <label className="braco-prep__radio-option">
                <input type="radio" checked={draft.kind === 'SERVICO'} onChange={() => setDraft({ ...draft, kind: 'SERVICO' })} />
                Serviço
              </label>
            </div>
          </div>

          <div className="braco-prep__field">
            <label htmlFor="prod-desc">Descrição para o cliente *</label>
            <textarea
              id="prod-desc"
              rows={2}
              value={draft.clientDescription}
              onChange={(e) => setDraft({ ...draft, clientDescription: e.target.value })}
            />
          </div>

          <div className="braco-prep__field">
            <label htmlFor="prod-pricing">Como informar preço *</label>
            <select
              id="prod-pricing"
              value={draft.pricingMode}
              onChange={(e) => setDraft({ ...draft, pricingMode: e.target.value as PricingMode })}
            >
              <option value="FIXO">Valor fixo</option>
              <option value="A_PARTIR_DE">A partir de</option>
              <option value="SOB_CONSULTA">Sob consulta</option>
              <option value="NAO_INFORMAR">Não informar</option>
            </select>
          </div>

          {(draft.pricingMode === 'FIXO' || draft.pricingMode === 'A_PARTIR_DE') && (
            <div className="braco-prep__field">
              <label htmlFor="prod-price">Valor *</label>
              <input id="prod-price" type="number" min="0" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} />
            </div>
          )}

          <div className="braco-prep__field">
            <label className="braco-prep__checkbox-option">
              <input
                type="checkbox"
                checked={draft.schedulable}
                onChange={(e) => setDraft({ ...draft, schedulable: e.target.checked })}
              />
              Pode ser agendado?
            </label>
          </div>

          {draft.schedulable && (
            <div className="braco-prep__field">
              <label htmlFor="prod-duration">Duração (minutos) *</label>
              <input
                id="prod-duration"
                type="number"
                min="1"
                value={draft.durationMinutes}
                onChange={(e) => setDraft({ ...draft, durationMinutes: e.target.value })}
              />
            </div>
          )}

          <div className="braco-prep__field">
            <label htmlFor="prod-notes">Condições/observações</label>
            <textarea id="prod-notes" rows={2} value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
          </div>

          {formError && <p className="braco-prep__field-error">{formError}</p>}

          <div className="braco-prep__actions">
            <Button variant="outlined" onClick={() => setEditingId(null)}>
              Cancelar
            </Button>
            <Button onClick={submitDraft}>{editingId === 'new' ? 'Adicionar' : 'Salvar'}</Button>
          </div>
        </Card>
      )}

      <div className="braco-prep__actions">
        <Button onClick={onContinue} disabled={items.length === 0}>
          Continuar
        </Button>
      </div>
    </div>
  );
}
