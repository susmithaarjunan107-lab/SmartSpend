import { useEffect, useRef, useState } from 'react';
import { PieChart, Plus } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext.jsx';
import BudgetForm from '../components/budgets/BudgetForm.jsx';
import BudgetList from '../components/budgets/BudgetList.jsx';
import Button from '../components/common/Button.jsx';
import ConfirmDialog from '../components/common/ConfirmDialog.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import Modal from '../components/common/Modal.jsx';
import Header from '../components/layout/Header.jsx';
import { budgetSnapshot } from '../utils/calculations.js';
import { monthLabel } from '../utils/dateUtils.js';

export default function BudgetsPage() {
  const data = useAppData();
  const location = useLocation();
  const navigate = useNavigate();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const dirtyRef = useRef(false);

  useEffect(() => {
    if (location.state?.compose) {
      setEditing(null);
      setFormOpen(true);
    }
  }, [location.state]);

  if (!data.view) return null;
  const snapshot = budgetSnapshot(data.budgets, data.transactions, data.view.year, data.view.month);
  const rows = [...(snapshot.overall ? [snapshot.overall] : []), ...snapshot.categories];

  function requestClose() {
    if (dirtyRef.current) {
      setConfirmDiscard(true);
      return;
    }
    setFormOpen(false);
    setEditing(null);
    if (location.state?.compose) navigate(location.pathname, { replace: true, state: null });
  }

  function saveBudget(values) {
    const result = editing ? data.updateBudget(editing.id, values) : data.addBudget(values);
    if (!result.ok) {
      if (result.error) data.notify(result.error, 'error');
      return result;
    }
    data.notify(editing ? 'Budget updated.' : 'Budget saved.');
    if (values.month !== data.view.month || values.year !== data.view.year) data.setView(values.year, values.month);
    dirtyRef.current = false;
    setFormOpen(false);
    setEditing(null);
    if (location.state?.compose) navigate(location.pathname, { replace: true, state: null });
    return result;
  }

  return (
    <>
      <Header
        title="Budgets"
        subtitle={monthLabel(data.view.year, data.view.month)}
        showMonth
        actions={
          <Button
            icon={Plus}
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            Create budget
          </Button>
        }
      />
      <div className="stack">
        <div className="callout">
          <strong>Overall budget and category budgets are separate.</strong>
          The overall monthly budget is one cap on all spending. Category budgets track individual categories and are not added into that cap.
          {snapshot.overall
            ? ` This month the overall limit is ${data.formatMoney(snapshot.overall.limit)} and ${data.formatMoney(snapshot.overall.spent)} has been spent.`
            : ' No overall budget is set for this month.'}{' '}
          Category budgets allocate {data.formatMoney(snapshot.allocated)}, with {data.formatMoney(snapshot.spentInBudgetedCategories)} spent in those categories.
          Expenses in categories without their own budget still count toward the overall budget.
        </div>
        {rows.length === 0 ? (
          <EmptyState
            icon={PieChart}
            title="No budgets for this month"
            description="Set an overall spending cap, a category limit, or both. Progress updates when expenses change."
            action={
              <Button icon={Plus} onClick={() => setFormOpen(true)}>
                Create budget
              </Button>
            }
          />
        ) : (
          <BudgetList
            budgets={rows}
            categories={data.categories}
            formatMoney={data.formatMoney}
            onEdit={(budget) => {
              setEditing(budget);
              setFormOpen(true);
            }}
            onDelete={setPendingDelete}
          />
        )}
      </div>

      {formOpen ? (
        <Modal title={editing ? 'Edit budget' : 'Create budget'} onClose={requestClose}>
          <BudgetForm
            key={editing?.id || `new-${data.view.year}-${data.view.month}`}
            categories={data.categories}
            initial={editing}
            defaultMonth={data.view.month}
            defaultYear={data.view.year}
            onSubmit={saveBudget}
            onCancel={requestClose}
            onDirtyChange={(dirty) => {
              dirtyRef.current = dirty;
            }}
          />
        </Modal>
      ) : null}

      {pendingDelete ? (
        <ConfirmDialog
          title="Delete budget"
          message="Delete this budget? Existing transactions stay in your ledger."
          confirmLabel="Delete"
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            const result = data.deleteBudget(pendingDelete.id);
            if (!result.ok) data.notify(result.error, 'error');
            else data.notify('Budget deleted.');
            setPendingDelete(null);
          }}
        />
      ) : null}

      {confirmDiscard ? (
        <ConfirmDialog
          title="Discard changes"
          message="Close this form and lose the unsaved budget changes?"
          confirmLabel="Discard"
          onCancel={() => setConfirmDiscard(false)}
          onConfirm={() => {
            dirtyRef.current = false;
            setConfirmDiscard(false);
            setFormOpen(false);
            setEditing(null);
            if (location.state?.compose) navigate(location.pathname, { replace: true, state: null });
          }}
        />
      ) : null}
    </>
  );
}
