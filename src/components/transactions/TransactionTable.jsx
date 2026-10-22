import { Eye, Pencil, Trash2 } from 'lucide-react';
import { categoryName } from '../../utils/categories.js';
import CurrencyDisplay from '../common/CurrencyDisplay.jsx';

export default function TransactionTable({ transactions, categories, formatDate, onView, onEdit, onDelete }) {
  return (
    <div className="table-wrap txn-table">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Category</th>
            <th>Payment</th>
            <th>Type</th>
            <th className="num">Amount</th>
            <th>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => (
            <tr key={transaction.id}>
              <td>{formatDate(transaction.date)}</td>
              <td>
                <strong>{transaction.description}</strong>
                {transaction.isDemo ? <span className="badge badge--demo">Sample</span> : null}
                {transaction.recurringExpenseId ? <span className="badge">Recurring</span> : null}
              </td>
              <td>{categoryName(categories, transaction.categoryId)}</td>
              <td>{transaction.paymentMethod}</td>
              <td>
                <span className={`badge badge--${transaction.type}`}>{transaction.type === 'income' ? 'Income' : 'Expense'}</span>
              </td>
              <td className="num">
                <CurrencyDisplay amount={transaction.type === 'expense' ? -transaction.amount : transaction.amount} />
              </td>
              <td>
                <div className="inline-actions">
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
