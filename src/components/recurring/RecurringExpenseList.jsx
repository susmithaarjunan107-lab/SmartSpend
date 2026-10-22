import { Check, Pause, Pencil, Play, Trash2 } from 'lucide-react';
import { categoryName } from '../../utils/categories.js';
import { daysFromToday } from '../../utils/dateUtils.js';
import { recurringTiming } from '../../utils/recurring.js';
import Button from '../common/Button.jsx';

const COPY = {
  overdue: 'Overdue',
  upcoming: 'Upcoming',
  paused: 'Paused',
  ended: 'Ended',
};

export default function RecurringExpenseList({ items, categories, today, formatMoney, formatDate, onEdit, onDelete, onToggle, onPay }) {
  if (!items.length) return null;
  return (
    <div className="stack">
      {items.map((item) => {
        const timing = recurringTiming(item, today);
        const days = daysFromToday(item.nextDueDate, today);
        const badge = timing === 'overdue' || timing === 'ended' ? 'danger' : timing === 'paused' ? 'paused' : 'warning';
        return (
          <article key={item.id} className="card">
            <div className="spread">
              <div>
                <h2>{item.description}</h2>
                <p className="muted">
                  {categoryName(categories, item.categoryId)} · {item.frequency} · {item.paymentMethod}
                  {item.isDemo ? ' · Sample' : ''}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <strong>{formatMoney(item.amount)}</strong>
                <p>
                  <span className={`badge badge--${badge}`}>{COPY[timing]}</span>
                </p>
              </div>
            </div>
            <p className="muted" style={{ marginTop: 8 }}>
              Next due {formatDate(item.nextDueDate)}
              {timing === 'overdue' && days != null ? ` · ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} overdue` : ''}
              {item.endDate ? ` · Ends ${formatDate(item.endDate)}` : ''}
            </p>
            <div className="inline-actions" style={{ marginTop: 10 }}>
              {timing === 'overdue' || timing === 'upcoming' ? (
                <Button size="sm" icon={Check} onClick={() => onPay(item)}>
                  Mark as paid
                </Button>
              ) : null}
              {item.status === 'active' ? (
                <Button size="sm" variant="secondary" icon={Pause} onClick={() => onToggle(item, 'paused')}>
                  Pause
                </Button>
              ) : (
                <Button size="sm" variant="secondary" icon={Play} onClick={() => onToggle(item, 'active')}>
                  Resume
                </Button>
              )}
              <Button size="sm" variant="secondary" icon={Pencil} onClick={() => onEdit(item)}>
                Edit
              </Button>
              <Button size="sm" variant="danger" icon={Trash2} onClick={() => onDelete(item)}>
                Delete
              </Button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
