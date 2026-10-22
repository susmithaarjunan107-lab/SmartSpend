import { useRef, useState } from 'react';
import { Plus, Repeat } from 'lucide-react';
import { useAppData } from '../context/AppDataContext.jsx';
import Button from '../components/common/Button.jsx';
import ConfirmDialog from '../components/common/ConfirmDialog.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import Modal from '../components/common/Modal.jsx';
import Header from '../components/layout/Header.jsx';
import RecurringExpenseForm from '../components/recurring/RecurringExpenseForm.jsx';
import RecurringExpenseList from '../components/recurring/RecurringExpenseList.jsx';
import { monthLabel, todayISO } from '../utils/dateUtils.js';
import { estimatedMonthlyCost, partitionRecurring } from '../utils/recurring.js';

const SECTIONS = [
  ['overdue', 'Overdue'],
  ['upcoming', 'Upcoming'],
  ['paused', 'Paused'],
  ['ended', 'Ended'],
];

export default function RecurringExpensesPage() {
  const data = useAppData();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [pendingPay, setPendingPay] = useState(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const dirtyRef = useRef(false);
  if (!data.view) return null;

  const today = todayISO();
  const groups = partitionRecurring(data.recurringExpenses, today);
  const estimate = estimatedMonthlyCost(data.recurringExpenses, data.view.year, data.view.month);

  function requestClose() {
    if (dirtyRef.current) {
      setConfirmDiscard(true);
      return;
    }
    setFormOpen(false);
    setEditing(null);
  }

  function save(values) {
    const result = editing ? data.updateRecurring(editing.id, values) : data.addRecurring(values);
    if (!result.ok) {
      if (result.error) data.notify(result.error, 'error');
      return result;
    }
    data.notify(editing ? 'Recurring expense updated.' : 'Recurring expense added.');
    dirtyRef.current = false;
    setFormOpen(false);
    setEditing(null);
    return result;
  }

  return (
    <>
      <Header
        title="Recurring expenses"
        subtitle="Schedules stay put until you mark a payment"
        showMonth
        actions={
          <Button
            icon={Plus}
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            Add recurring expense
          </Button>
        }
      />
      <div className="stack">
        <div className="callout">
          <strong>Estimated recurring cost for {monthLabel(data.view.year, data.view.month)}: {data.formatMoney(estimate)}</strong>
          This counts active weekly, monthly, and yearly schedules that fall in the month. Paused items are excluded. Marking an item paid records one expense and moves only that schedule forward. Opening the app does not create payments.
        </div>
        {data.recurringExpenses.length === 0 ? (
          <EmptyState
            icon={Repeat}
            title="No recurring expenses"
            description="Add rent, bills, or subscriptions. Use Mark as paid when a due date arrives."
            action={
              <Button icon={Plus} onClick={() => setFormOpen(true)}>
                Add recurring expense
              </Button>
            }
          />
        ) : (
          SECTIONS.map(([key, title]) =>
            groups[key].length ? (
              <section key={key} className="stack">
                <h2 className="section-title">{title}</h2>
                <RecurringExpenseList
                  items={groups[key]}
                  categories={data.categories}
                  today={today}
                  formatMoney={data.formatMoney}
                  formatDate={data.formatDate}
                  onEdit={(item) => {
                    setEditing(item);
                    setFormOpen(true);
                  }}
                  onDelete={setPendingDelete}
                  onToggle={(item, status) => {
                    const result = data.setRecurringStatus(item.id, status);
                    if (!result.ok) data.notify(result.error, 'error');
                    else data.notify(status === 'paused' ? 'Recurring expense paused.' : 'Recurring expense resumed.');
                  }}
                  onPay={setPendingPay}
                />
              </section>
            ) : null,
          )
        )}
      </div>

      {formOpen ? (
        <Modal title={editing ? 'Edit recurring expense' : 'Add recurring expense'} onClose={requestClose} size="lg">
          <RecurringExpenseForm
            key={editing?.id || 'new'}
            categories={data.categories}
            initial={editing}
            onSubmit={save}
            onCancel={requestClose}
            onDirtyChange={(dirty) => {
              dirtyRef.current = dirty;
            }}
          />
        </Modal>
      ) : null}

      {pendingPay ? (
        <ConfirmDialog
          title="Mark as paid"
          message={`Record ${data.formatMoney(pendingPay.amount)} for "${pendingPay.description}" on ${data.formatDate(pendingPay.nextDueDate)} and move the next due date forward?`}
          confirmLabel="Mark as paid"
          tone="primary"
          onCancel={() => setPendingPay(null)}
          onConfirm={() => {
            const result = data.markRecurringPaid(pendingPay.id);
            if (!result.ok) data.notify(result.error || 'Payment was not recorded.', 'error');
            else data.notify('Payment recorded and the next due date was updated.');
            setPendingPay(null);
          }}
        />
      ) : null}

      {pendingDelete ? (
        <ConfirmDialog
          title="Delete recurring expense"
          message={`Delete "${pendingDelete.description}"? Transactions already recorded from it will stay.`}
          confirmLabel="Delete"
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            const result = data.deleteRecurring(pendingDelete.id);
            if (!result.ok) data.notify(result.error, 'error');
            else data.notify('Recurring expense deleted.');
            setPendingDelete(null);
          }}
        />
      ) : null}

      {confirmDiscard ? (
        <ConfirmDialog
          title="Discard changes"
          message="Close this form and lose the unsaved changes?"
          confirmLabel="Discard"
          onCancel={() => setConfirmDiscard(false)}
          onConfirm={() => {
            dirtyRef.current = false;
            setConfirmDiscard(false);
            setFormOpen(false);
            setEditing(null);
          }}
        />
      ) : null}
    </>
  );
}
