import { categoryName } from '../../utils/categories.js';
import CurrencyDisplay from '../common/CurrencyDisplay.jsx';

export default function RecentTransactions({ transactions, categories, formatDate }) {
  if (!transactions.length) return <p className="muted">No transactions in this month.</p>;
  return (
    <ul className="stack" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {transactions.map((transaction) => (
        <li key={transaction.id} className="spread">
          <div>
            <strong>{transaction.description}</strong>
            <p className="muted">
              {formatDate(transaction.date)} · {categoryName(categories, transaction.categoryId)}
              {transaction.isDemo ? ' · Sample' : ''}
            </p>
          </div>
          <CurrencyDisplay amount={transaction.type === 'expense' ? -transaction.amount : transaction.amount} />
        </li>
      ))}
    </ul>
  );
}
