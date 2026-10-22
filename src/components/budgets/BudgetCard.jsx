import { Pencil, Trash2 } from 'lucide-react';
import { categoryName } from '../../utils/categories.js';
import { formatPercent } from '../../utils/currency.js';
import CategoryIcon from '../common/CategoryIcon.jsx';
import ProgressBar from '../common/ProgressBar.jsx';

function statusCopy(budget, formatMoney) {
  if (budget.status === 'exceeded') return `Over budget by ${formatMoney(Math.abs(budget.remaining))}.`;
  if (budget.status === 'warning') return `${formatPercent(budget.percent, 0)} used. You have reached the 80% warning.`;
  return `${formatPercent(budget.percent, 0)} used. ${formatMoney(budget.remaining)} remaining.`;
}

export default function BudgetCard({ budget, categories, formatMoney, onEdit, onDelete }) {
  const category = categories.find((item) => item.id === budget.categoryId);
  const name = budget.scope === 'overall' ? 'Overall monthly budget' : categoryName(categories, budget.categoryId);
  const badge = budget.status === 'exceeded' ? 'danger' : budget.status === 'warning' ? 'warning' : 'income';

  return (
    <article className="card">
      <div className="spread">
        <div className="category-name">
          <CategoryIcon name={budget.scope === 'overall' ? 'Wallet' : category?.icon || 'Tag'} color={category?.color} />
          <div>
            <h2>{name}</h2>
            {budget.isDemo ? <span className="badge badge--demo">Sample</span> : null}
          </div>
        </div>
        <span className={`badge badge--${badge}`}>{budget.status === 'exceeded' ? 'Over budget' : budget.status === 'warning' ? 'Warning' : 'On track'}</span>
      </div>
      <p className="summary-value" style={{ margin: '10px 0 4px' }}>
        {formatMoney(budget.spent)} <span className="muted">of {formatMoney(budget.limit)}</span>
      </p>
      <ProgressBar percent={budget.percent} status={budget.status} label={`${name} used`} />
      <p className="muted" style={{ marginTop: 8 }}>
        {statusCopy(budget, formatMoney)}
      </p>
      <div className="inline-actions" style={{ marginTop: 8 }}>
        <button type="button" className="icon-btn" aria-label={`Edit ${name}`} onClick={() => onEdit(budget)}>
          <Pencil size={16} />
        </button>
        <button type="button" className="icon-btn" aria-label={`Delete ${name}`} onClick={() => onDelete(budget)}>
          <Trash2 size={16} />
        </button>
      </div>
    </article>
  );
}
