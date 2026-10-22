import { PieChart, Plus, PiggyBank, Receipt, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext.jsx';
import BudgetOverview from '../components/dashboard/BudgetOverview.jsx';
import CategoryExpenseChart from '../components/dashboard/CategoryExpenseChart.jsx';
import IncomeExpenseChart from '../components/dashboard/IncomeExpenseChart.jsx';
import RecentTransactions from '../components/dashboard/RecentTransactions.jsx';
import SpendingTrendChart from '../components/dashboard/SpendingTrendChart.jsx';
import SummaryCard from '../components/dashboard/SummaryCard.jsx';
import Button from '../components/common/Button.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import ProgressBar from '../components/common/ProgressBar.jsx';
import Header from '../components/layout/Header.jsx';
import {
  budgetSnapshot,
  dailySpending,
  largestExpenseCategory,
  monthOverMonth,
  monthTotals,
  monthlySeries,
  spendingByCategory,
  transactionsInMonth,
} from '../utils/calculations.js';
import { formatPercent } from '../utils/currency.js';
import { monthLabel, previousMonth, todayISO } from '../utils/dateUtils.js';
import { partitionRecurring } from '../utils/recurring.js';

function comparisonText(change) {
  if (!change.comparable) return 'No spending last month to compare';
  if (change.direction === 'flat') return 'Same as last month';
  const word = change.direction === 'up' ? 'more' : 'less';
  return `${formatPercent(Math.abs(change.percent), 1)} ${word} than last month`;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { transactions, budgets, recurringExpenses, categories, view, formatMoney, formatDate } = useAppData();
  if (!view) return null;

  const monthTransactions = transactionsInMonth(transactions, view.year, view.month);
  const totals = monthTotals(transactions, view.year, view.month);
  const previous = previousMonth(view.year, view.month);
  const previousTotals = monthTotals(transactions, previous.year, previous.month);
  const change = monthOverMonth(totals.expense, previousTotals.expense);
  const snapshot = budgetSnapshot(budgets, transactions, view.year, view.month);
  const largest = largestExpenseCategory(monthTransactions, categories);
  const daily = dailySpending(transactions, view.year, view.month);
  const byCategory = spendingByCategory(monthTransactions, categories);
  const series = monthlySeries(transactions, view.year, view.month, 6);
  const recent = monthTransactions
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date) || String(b.createdAt).localeCompare(String(a.createdAt)))
    .slice(0, 5);
  const groups = partitionRecurring(recurringExpenses, todayISO());
  const upcoming = [...groups.overdue, ...groups.upcoming].slice(0, 4);
  const hasDailySpend = daily.some((day) => day.expense > 0);
  const hasSeries = series.some((point) => point.income > 0 || point.expense > 0);

  return (
    <>
      <Header
        title="Dashboard"
        subtitle={monthLabel(view.year, view.month)}
        showMonth
        actions={
          <>
            <Button variant="secondary" icon={PieChart} onClick={() => navigate('/budgets', { state: { compose: true } })}>
              Create budget
            </Button>
            <Button icon={Plus} onClick={() => navigate('/transactions', { state: { compose: true } })}>
              Add transaction
            </Button>
          </>
        }
      />

      {transactions.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Add your first transaction"
          description="Income and expenses you record here update the dashboard, budgets, and reports immediately. You can also load sample data from Settings."
          action={
            <Button icon={Plus} onClick={() => navigate('/transactions', { state: { compose: true } })}>
              Add transaction
            </Button>
          }
        />
      ) : (
        <div className="stack">
          <section className="summary-grid">
            <SummaryCard label="Total income" value={formatMoney(totals.income)} hint="Selected month" icon={Wallet} tone="positive" />
            <SummaryCard
              label="Total expenses"
              value={formatMoney(totals.expense)}
              hint={comparisonText(change)}
              icon={Receipt}
              tone="expense"
            />
            <SummaryCard
              label="Remaining budget"
              value={snapshot.overall ? formatMoney(snapshot.overall.remaining) : 'Not set'}
              hint={
                snapshot.overall
                  ? `${formatPercent(snapshot.overall.percent, 0)} of ${formatMoney(snapshot.overall.limit)} used`
                  : 'Set an overall monthly budget'
              }
              icon={PieChart}
              tone={snapshot.overall?.status === 'exceeded' ? 'expense' : 'positive'}
              extra={
                snapshot.overall ? (
                  <ProgressBar percent={snapshot.overall.percent} status={snapshot.overall.status} label="Overall budget used" />
                ) : null
              }
            />
            <SummaryCard
              label="Net savings"
              value={formatMoney(totals.savings)}
              hint="Income minus expenses"
              icon={PiggyBank}
              tone={totals.savings < 0 ? 'expense' : 'positive'}
            />
          </section>

          <section className="insight-row" aria-label="Month insights">
            <span className="insight">
              Spending this month: <strong>{formatMoney(totals.expense)}</strong>
            </span>
            <span className="insight">
              Versus last month: <strong>{comparisonText(change)}</strong>
            </span>
            <span className="insight">
              Budget used:{' '}
              <strong>{snapshot.overall ? formatPercent(snapshot.overall.percent, 0) : 'No overall budget'}</strong>
            </span>
            <span className="insight">
              Largest category: <strong>{largest ? `${largest.name} (${formatMoney(largest.amount)})` : 'None yet'}</strong>
            </span>
          </section>

          {monthTransactions.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="Nothing recorded in this month"
              description="Choose another month or add a transaction dated in this period."
              action={
                <Button onClick={() => navigate('/transactions', { state: { compose: true } })}>Add transaction</Button>
              }
            />
          ) : null}

          <section className="charts-grid">
            <article className="card">
              <header className="card-header">
                <div>
                  <h2>Spending trend</h2>
                  <p>Daily expenses for the selected month</p>
                </div>
              </header>
              {hasDailySpend ? <SpendingTrendChart data={daily} /> : <p className="chart-empty">No expenses to chart in this month.</p>}
            </article>
            <article className="card">
              <header className="card-header">
                <div>
                  <h2>Spending by category</h2>
                  <p>Expense totals for the selected month</p>
                </div>
              </header>
              {byCategory.length ? <CategoryExpenseChart data={byCategory} /> : <p className="chart-empty">No category spending yet.</p>}
            </article>
          </section>

          <article className="card">
            <header className="card-header">
              <div>
                <h2>Income versus expenses</h2>
                <p>Six months ending in {monthLabel(view.year, view.month)}</p>
              </div>
            </header>
            {hasSeries ? <IncomeExpenseChart data={series} /> : <p className="chart-empty">Not enough activity for this chart.</p>}
          </article>

          <section className="split">
            <article className="card">
              <header className="card-header">
                <h2>Recent transactions</h2>
              </header>
              <RecentTransactions transactions={recent} categories={categories} formatDate={formatDate} />
            </article>
            <div className="stack">
              <article className="card">
                <header className="card-header">
                  <h2>Budget progress</h2>
                </header>
                <BudgetOverview snapshot={snapshot} categories={categories} formatMoney={formatMoney} />
              </article>
              <article className="card">
                <header className="card-header">
                  <h2>Upcoming recurring</h2>
                </header>
                {upcoming.length === 0 ? (
                  <p className="muted">No overdue or upcoming recurring expenses.</p>
                ) : (
                  <ul className="stack" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {upcoming.map((item) => (
                      <li key={item.id} className="spread">
                        <div>
                          <strong>{item.description}</strong>
                          <p className="muted">{formatDate(item.nextDueDate)}</p>
                        </div>
                        <span className={`badge ${item.nextDueDate < todayISO() ? 'badge--danger' : 'badge--warning'}`}>
                          {item.nextDueDate < todayISO() ? 'Overdue' : formatMoney(item.amount)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
