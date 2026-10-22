import { categoryName } from '../../utils/categories.js';
import { formatPercent } from '../../utils/currency.js';
import ProgressBar from '../common/ProgressBar.jsx';

function labelFor(status) {
  if (status === 'exceeded') return 'Over budget';
  if (status === 'warning') return '80% or more used';
  return 'On track';
}

export default function BudgetOverview({ snapshot, categories, formatMoney }) {
  const rows = [
    ...(snapshot.overall ? [{ ...snapshot.overall, name: 'Overall monthly budget' }] : []),
    ...snapshot.categories.map((budget) => ({
      ...budget,
      name: categoryName(categories, budget.categoryId),
    })),
  ];

  if (!rows.length) return <p className="muted">No budgets for this month.</p>;

  return (
    <div className="stack">
      {rows.slice(0, 4).map((budget) => (
        <div key={budget.id}>
          <div className="spread">
            <strong>{budget.name}</strong>
            <span className={`badge badge--${budget.status === 'exceeded' ? 'danger' : budget.status === 'warning' ? 'warning' : 'income'}`}>
              {labelFor(budget.status)}
            </span>
          </div>
          <p className="muted">
            {formatMoney(budget.spent)} of {formatMoney(budget.limit)} · {formatPercent(budget.percent, 0)}
          </p>
          <ProgressBar percent={budget.percent} status={budget.status} label={`${budget.name} used`} />
        </div>
      ))}
    </div>
  );
}
