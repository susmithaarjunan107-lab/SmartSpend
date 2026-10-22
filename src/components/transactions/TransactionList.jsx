import { Eye, Pencil, Trash2 } from 'lucide-react';
import { categoryName } from '../../utils/categories.js';
import CurrencyDisplay from '../common/CurrencyDisplay.jsx';
import TransactionTable from './TransactionTable.jsx';

export default function TransactionList({ transactions, categories, formatDate, onView, onEdit, onDelete }) {
  if (!transactions.length) return null;
  return (
    <>
      <TransactionTable
        transactions={transactions}
        categories={categories}
        formatDate={formatDate}
        onView={onView}
        onEdit={onEdit}
        onDelete={onDelete}
      />
      <div className="txn-cards">
        {transactions.map((transaction) => (
          <article key={transaction.id} className="card txn-card">
            <div className="txn-card-top">
              <div>
                <strong>{transaction.description}</strong>
                <p className="muted">
                  {formatDate(transaction.date)} · {categoryName(categories, transaction.categoryId)}
                </p>
              </div>
              <CurrencyDisplay amount={transaction.type === 'expense' ? -transaction.amount : transaction.amount} />
            </div>
            <div className="inline-actions">
              <span className={`badge badge--${transaction.type}`}>{transaction.type === 'income' ? 'Income' : 'Expense'}</span>
              {transaction.isDemo ? <span className="badge badge--demo">Sample</span> : null}
              <span className="muted">{transaction.paymentMethod}</span>
              <button type="button" className="icon-btn" aria-label={`View ${transaction.description}`} onClick={() => onView(transaction)}>
                <Eye size={16} />
              </button>
              <button type="button" className="icon-btn" aria-label={`Edit ${transaction.description}`} onClick={() => onEdit(transaction)}>
                <Pencil size={16} />
              </button>
              <button type="button" className="icon-btn" aria-label={`Delete ${transaction.description}`} onClick={() => onDelete(transaction)}>
                <Trash2 size={16} />
              </button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
