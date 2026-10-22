import { useEffect, useMemo, useRef, useState } from 'react';
import { Download, Plus, Receipt } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext.jsx';
import Button from '../components/common/Button.jsx';
import ConfirmDialog from '../components/common/ConfirmDialog.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import Modal from '../components/common/Modal.jsx';
import Pagination from '../components/common/Pagination.jsx';
import Header from '../components/layout/Header.jsx';
import CategoryEditor from '../components/settings/CategoryEditor.jsx';
import TransactionFilters from '../components/transactions/TransactionFilters.jsx';
import TransactionForm from '../components/transactions/TransactionForm.jsx';
import TransactionList from '../components/transactions/TransactionList.jsx';
import { PAGE_SIZE } from '../utils/constants.js';
import { categoryName } from '../utils/categories.js';
import { transactionsToCsv, downloadTextFile } from '../utils/csvExport.js';
import { todayISO } from '../utils/dateUtils.js';
import { DEFAULT_FILTERS, filterTransactions } from '../utils/filters.js';

export default function TransactionsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const data = useAppData();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [categoryType, setCategoryType] = useState(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const dirtyRef = useRef(false);

  useEffect(() => {
    if (location.state?.compose) {
      setEditing(null);
      setFormOpen(true);
    }
  }, [location.state]);

  const rangeError =
    filters.startDate && filters.endDate && filters.startDate > filters.endDate
      ? 'Start date must be on or before the end date.'
      : '';

  const filtered = useMemo(() => {
    const active = rangeError ? { ...filters, startDate: '', endDate: '' } : filters;
    return filterTransactions(data.transactions, active, data.categories);
  }, [data.categories, data.transactions, filters, rangeError]);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const start = (safePage - 1) * PAGE_SIZE;
  const visible = filtered.slice(start, start + PAGE_SIZE);

  function updateFilters(patch) {
    setFilters((current) => {
      const next = { ...current, ...patch };
      if (patch.type && patch.type !== 'all' && next.categoryId !== 'all') {
        const category = data.categories.find((item) => item.id === next.categoryId);
        if (category && category.type !== next.type) next.categoryId = 'all';
      }
      return next;
    });
  }

  function requestClose() {
    if (dirtyRef.current) {
      setConfirmDiscard(true);
      return;
    }
    setFormOpen(false);
    setEditing(null);
    if (location.state?.compose) navigate(location.pathname, { replace: true, state: null });
  }

  function saveTransaction(values) {
    const result = editing ? data.updateTransaction(editing.id, values) : data.addTransaction(values);
    if (!result.ok) {
      if (result.error) data.notify(result.error, 'error');
      return result;
    }
    data.notify(editing ? 'Transaction updated.' : 'Transaction added.');
    dirtyRef.current = false;
    setFormOpen(false);
    setEditing(null);
    if (location.state?.compose) navigate(location.pathname, { replace: true, state: null });
    return result;
  }

  function exportCsv() {
    if (rangeError) {
      data.notify('Fix the date range before exporting.', 'error');
      return;
    }
    if (!filtered.length) {
      data.notify('No matching transactions to export.', 'error');
      return;
    }
    downloadTextFile(
      `smartspend-transactions-${todayISO()}.csv`,
      transactionsToCsv(filtered, data.categories, data.preferences.currency),
    );
    data.notify(`Exported ${filtered.length} transaction${filtered.length === 1 ? '' : 's'}.`);
  }

  return (
    <>
      <Header
        title="Transactions"
        subtitle="Search, filter, and export income and expenses"
        actions={
          <>
            <Button variant="secondary" icon={Download} onClick={exportCsv}>
              Export CSV
            </Button>
            <Button
              icon={Plus}
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              Add transaction
            </Button>
          </>
        }
      />
      <div className="stack">
        <TransactionFilters
          filters={filters}
          categories={data.categories}
          onChange={updateFilters}
          onClear={() => setFilters(DEFAULT_FILTERS)}
          matchCount={filtered.length}
          totalCount={data.transactions.length}
          rangeError={rangeError}
        />
        {data.transactions.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No transactions yet"
            description="Add income or an expense to start tracking this month."
            action={
              <Button icon={Plus} onClick={() => setFormOpen(true)}>
                Add transaction
              </Button>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState icon={Receipt} title="No transactions match" description="Adjust the search or clear the filters to see more records." />
        ) : (
          <section className="card">
            <p className="muted" style={{ marginBottom: 8 }}>
              Showing {start + 1}–{Math.min(start + PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <TransactionList
              transactions={visible}
              categories={data.categories}
              formatDate={data.formatDate}
              onView={setViewing}
              onEdit={(transaction) => {
                setEditing(transaction);
                setFormOpen(true);
              }}
              onDelete={setPendingDelete}
            />
            <Pagination page={safePage} pageCount={pageCount} onPage={setPage} />
          </section>
        )}
      </div>

      {formOpen ? (
        <Modal title={editing ? 'Edit transaction' : 'Add transaction'} onClose={requestClose} size="lg">
          <TransactionForm
            key={editing?.id || 'new'}
            categories={data.categories}
            initial={editing}
            onSubmit={saveTransaction}
            onCancel={requestClose}
            onDirtyChange={(dirty) => {
              dirtyRef.current = dirty;
            }}
            onCreateCategory={(type) => setCategoryType(type)}
          />
        </Modal>
      ) : null}

      {categoryType ? (
        <Modal title="New category" onClose={() => setCategoryType(null)}>
          <CategoryEditor
            type={categoryType}
            categories={data.categories}
            onCancel={() => setCategoryType(null)}
            onSave={(input) => {
              const result = data.addCategory({ ...input, type: categoryType });
              if (!result.ok) return result;
              data.notify('Category added.');
              setCategoryType(null);
              return result;
            }}
          />
        </Modal>
      ) : null}

      {viewing ? (
        <Modal title="Transaction details" onClose={() => setViewing(null)}>
          <dl className="detail-list">
            <dt>Description</dt>
            <dd>{viewing.description}</dd>
            <dt>Amount</dt>
            <dd>{data.formatMoney(viewing.amount)}</dd>
            <dt>Type</dt>
            <dd>{viewing.type === 'income' ? 'Income' : 'Expense'}</dd>
            <dt>Category</dt>
            <dd>{categoryName(data.categories, viewing.categoryId)}</dd>
            <dt>Date</dt>
            <dd>{data.formatDate(viewing.date)}</dd>
            <dt>Payment</dt>
            <dd>{viewing.paymentMethod}</dd>
            <dt>Notes</dt>
            <dd>{viewing.notes || '—'}</dd>
            <dt>Recorded</dt>
            <dd>{new Date(viewing.createdAt).toLocaleString()}</dd>
          </dl>
          <div className="inline-actions" style={{ marginTop: 12 }}>
            {viewing.isDemo ? <span className="badge badge--demo">Sample</span> : null}
            {viewing.recurringExpenseId ? <span className="badge">Created from a recurring expense</span> : null}
          </div>
          <div className="form-actions">
            <Button
              variant="secondary"
              onClick={() => {
                setEditing(viewing);
                setViewing(null);
                setFormOpen(true);
              }}
            >
              Edit
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setPendingDelete(viewing);
                setViewing(null);
              }}
            >
              Delete
            </Button>
          </div>
        </Modal>
      ) : null}

      {pendingDelete ? (
        <ConfirmDialog
          title="Delete transaction"
          message={`Delete "${pendingDelete.description}" for ${data.formatMoney(pendingDelete.amount)}? This cannot be undone.`}
          confirmLabel="Delete"
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            const result = data.deleteTransaction(pendingDelete.id);
            if (!result.ok) data.notify(result.error, 'error');
            else data.notify('Transaction deleted.');
            setPendingDelete(null);
          }}
        />
      ) : null}

      {confirmDiscard ? (
        <ConfirmDialog
          title="Discard changes"
          message="You have unsaved changes in this form. Close it and lose those changes?"
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
