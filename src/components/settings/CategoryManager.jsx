import { useState } from 'react';
import { Lock, Pencil, Trash2 } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext.jsx';
import { countCategoryUsage } from '../../utils/dataOps.js';
import CategoryIcon from '../common/CategoryIcon.jsx';
import Button from '../common/Button.jsx';
import ConfirmDialog from '../common/ConfirmDialog.jsx';
import Modal from '../common/Modal.jsx';
import CategoryEditor from './CategoryEditor.jsx';

export default function CategoryManager() {
  const data = useAppData();
  const [creating, setCreating] = useState(false);
  const [type, setType] = useState('expense');
  const [editing, setEditing] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [replacementId, setReplacementId] = useState('');

  const usage = pendingDelete
    ? countCategoryUsage(
        {
          transactions: data.transactions,
          budgets: data.budgets,
          recurringExpenses: data.recurringExpenses,
        },
        pendingDelete.id,
      )
    : null;
  const replacements = pendingDelete
    ? data.categories.filter((category) => category.id !== pendingDelete.id && category.type === pendingDelete.type)
    : [];

  return (
    <section className="card">
      <header className="card-header">
        <div>
          <h2>Categories</h2>
          <p>Built-in categories stay available. Custom ones can be renamed or replaced.</p>
        </div>
        <Button
          onClick={() => {
            setType('expense');
            setCreating(true);
          }}
        >
          Add category
        </Button>
      </header>
      <div>
        {data.categories.map((category) => (
          <div key={category.id} className="category-row">
            <div className="category-name">
              <span className="swatch" style={{ background: category.color }} />
              <CategoryIcon name={category.icon} size={16} />
              <span>
                {category.name}
                <small className="muted"> · {category.type === 'income' ? 'Income' : 'Expense'}</small>
              </span>
              {category.isDemo ? <span className="badge badge--demo">Sample</span> : null}
            </div>
            {category.isCustom ? (
              <div className="inline-actions">
                <button type="button" className="icon-btn" aria-label={`Rename ${category.name}`} onClick={() => setEditing(category)}>
                  <Pencil size={16} />
                </button>
                <button type="button" className="icon-btn" aria-label={`Delete ${category.name}`} onClick={() => { setReplacementId(''); setPendingDelete(category); }}>
                  <Trash2 size={16} />
                </button>
              </div>
            ) : (
              <span className="muted" title="Built-in categories cannot be deleted">
                <Lock size={14} aria-hidden="true" /> Built-in
              </span>
            )}
          </div>
        ))}
      </div>

      {creating ? (
        <Modal title="New category" onClose={() => setCreating(false)}>
          <div className="field" style={{ marginBottom: 12 }}>
            <label htmlFor="new-category-type">Type</label>
            <select id="new-category-type" value={type} onChange={(event) => setType(event.target.value)}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>
          <CategoryEditor
            key={type}
            type={type}
            categories={data.categories}
            onCancel={() => setCreating(false)}
            onSave={(input) => {
              const result = data.addCategory({ ...input, type });
              if (!result.ok) return result;
              data.notify('Category added.');
              setCreating(false);
              return result;
            }}
          />
        </Modal>
      ) : null}

      {editing ? (
        <Modal title={`Rename ${editing.name}`} onClose={() => setEditing(null)}>
          <CategoryEditor
            initial={editing}
            categories={data.categories}
            onCancel={() => setEditing(null)}
            onSave={(input) => {
              const result = data.updateCategory(editing.id, input);
              if (!result.ok) return result;
              data.notify('Category updated.');
              setEditing(null);
              return result;
            }}
          />
        </Modal>
      ) : null}

      {pendingDelete && usage?.total === 0 ? (
        <ConfirmDialog
          title="Delete category"
          message={`Delete "${pendingDelete.name}"? It is not used by any records.`}
          confirmLabel="Delete"
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            const result = data.deleteCategory(pendingDelete.id);
            if (!result.ok) data.notify(result.error, 'error');
            else data.notify('Category deleted.');
            setPendingDelete(null);
          }}
        />
      ) : null}

      {pendingDelete && usage?.total > 0 ? (
        <Modal title="Replace category" onClose={() => setPendingDelete(null)}>
          <div className="stack-form">
            <p>
              {pendingDelete.name} is used by {usage.transactions} transaction{usage.transactions === 1 ? '' : 's'}, {usage.budgets} budget
              {usage.budgets === 1 ? '' : 's'}, and {usage.recurring} recurring expense{usage.recurring === 1 ? '' : 's'}. Choose a replacement of the same type. If that category already has a budget for the same month, the extra budget is removed.
            </p>
            <div className="field">
              <label htmlFor="replacement-category">Replacement category</label>
              <select id="replacement-category" value={replacementId} onChange={(event) => setReplacementId(event.target.value)}>
                <option value="">Select a category</option>
                {replacements.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-actions">
              <Button variant="secondary" onClick={() => setPendingDelete(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                disabled={!replacementId}
                onClick={() => {
                  const result = data.deleteCategory(pendingDelete.id, replacementId);
                  if (!result.ok) data.notify(result.error, 'error');
                  else data.notify(result.notice ? `Category replaced. ${result.notice}` : 'Category replaced and removed.');
                  setPendingDelete(null);
                }}
              >
                Replace and delete
              </Button>
            </div>
          </div>
        </Modal>
      ) : null}
    </section>
  );
}
