import { useMemo, useState } from 'react';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { useAppData } from '../../context/AppDataContext.jsx';
import CategoryExpenseChart from '../dashboard/CategoryExpenseChart.jsx';
import IncomeExpenseChart from '../dashboard/IncomeExpenseChart.jsx';
import SpendingTrendChart from '../dashboard/SpendingTrendChart.jsx';
import Button from '../common/Button.jsx';
import EmptyState from '../common/EmptyState.jsx';
import { categoryName } from '../../utils/categories.js';
import {
  budgetSnapshot,
  dailySpending,
  highestExpenses,
  monthOverMonthSeries,
  monthlySeries,
  paymentMethodBreakdown,
  spendingByCategory,
  topExpenseCategories,
  transactionsInRange,
} from '../../utils/calculations.js';
import { downloadTextFile, rowsToCsv, transactionsToCsv } from '../../utils/csvExport.js';
import { formatPercent } from '../../utils/currency.js';
import { monthLabel, resolvePeriod, todayISO } from '../../utils/dateUtils.js';
import { BarChart3 } from 'lucide-react';

const PRESETS = [
  { id: 'month', label: 'This month' },
  { id: '6', label: 'Last 6 months' },
  { id: '12', label: 'Last 12 months' },
  { id: 'year', label: 'This year' },
];

const PAYMENT_COLORS = ['#0F7A56', '#1D6FBF', '#C42333', '#B86E00', '#6D4AFF', '#0E8A8A', '#C43E78', '#3D4C8A', '#8A5A2A'];

export default function ReportsDashboard() {
  const data = useAppData();
  const [preset, setPreset] = useState('6');
  const [year, setYear] = useState(data.view.year);
  const [month, setMonth] = useState(data.view.month);

  const period = resolvePeriod(preset, year, month);
  const ranged = useMemo(
    () => transactionsInRange(data.transactions, period.start, period.end),
    [data.transactions, period.end, period.start],
  );
  const series = monthlySeries(data.transactions, period.seriesEndYear, period.seriesEndMonth, period.seriesLength);
  const comparisons = monthOverMonthSeries(data.transactions, period.seriesEndYear, period.seriesEndMonth, period.seriesLength);
  const byCategory = spendingByCategory(ranged, data.categories);
  const payments = paymentMethodBreakdown(ranged).map((item, index) => ({
    ...item,
    categoryId: item.name,
    color: PAYMENT_COLORS[index % PAYMENT_COLORS.length],
  }));
  const top = topExpenseCategories(ranged, data.categories, 5);
  const highest = highestExpenses(ranged, 5);
  const daily = dailySpending(data.transactions, year, month);
  const budgets = budgetSnapshot(data.budgets, data.transactions, year, month);
  const hasActivity = ranged.some((item) => item.type === 'income' || item.type === 'expense');
  const budgetRows = [...(budgets.overall ? [{ ...budgets.overall, name: 'Overall monthly budget' }] : []), ...budgets.categories.map((item) => ({ ...item, name: categoryName(data.categories, item.categoryId) }))];

  function exportTransactions() {
    if (!ranged.length) {
      data.notify('No transactions in this period to export.', 'error');
      return;
    }
    downloadTextFile(`smartspend-report-transactions-${todayISO()}.csv`, transactionsToCsv(ranged, data.categories, data.preferences.currency));
    data.notify(`Exported ${ranged.length} transactions.`);
  }

  function exportSummary() {
    if (!series.length) {
      data.notify('Nothing to export for this period.', 'error');
      return;
    }
    const monthly = rowsToCsv(
      ['Month', 'Income', 'Expenses', 'Savings'],
      series.map((point) => ({ Month: point.label, Income: point.income, Expenses: point.expense, Savings: point.savings })),
    );
    const categories = rowsToCsv(
      ['Category', 'Amount'],
      byCategory.map((item) => ({ Category: item.name, Amount: item.value })),
    );
    downloadTextFile(`smartspend-report-summary-${todayISO()}.csv`, `${monthly}\n\n${categories}`);
    data.notify('Report summary exported.');
  }

  return (
    <div className="stack">
      <section className="card">
        <div className="spread">
          <div className="preset-row" role="group" aria-label="Report period">
            {PRESETS.map((item) => (
              <button key={item.id} type="button" className={`choice${preset === item.id ? ' is-selected' : ''}`} onClick={() => setPreset(item.id)}>
                {item.label}
              </button>
            ))}
          </div>
          <div className="inline-actions">
            <label className="sr-only" htmlFor="report-month">
              Report month
            </label>
            <input
              id="report-month"
              type="month"
              value={`${year}-${String(month).padStart(2, '0')}`}
              onChange={(event) => {
                const [nextYear, nextMonth] = event.target.value.split('-').map(Number);
                if (nextYear && nextMonth) {
                  setYear(nextYear);
                  setMonth(nextMonth);
                }
              }}
            />
            <Button variant="secondary" onClick={exportTransactions}>
              Export transactions
            </Button>
            <Button variant="secondary" onClick={exportSummary}>
              Export summary
            </Button>
          </div>
        </div>
        <p className="muted" style={{ marginTop: 10 }}>
          {data.formatDate(period.start)} – {data.formatDate(period.end)}. Budget utilization below uses {monthLabel(year, month)} only.
        </p>
      </section>

      {!hasActivity ? (
        <EmptyState icon={BarChart3} title="Not enough data for this period" description="Add transactions or choose another month. Charts use the records stored in this browser." />
      ) : (
        <>
          <section className="charts-grid">
            <article className="card">
              <header className="card-header">
                <div>
                  <h2>{preset === 'month' ? 'Daily expense trend' : 'Monthly expense trend'}</h2>
                  <p>{preset === 'month' ? monthLabel(year, month) : 'Expenses across the selected period'}</p>
                </div>
              </header>
              <SpendingTrendChart data={preset === 'month' ? daily : series} />
            </article>
            <article className="card">
              <header className="card-header">
                <h2>Category breakdown</h2>
              </header>
              {byCategory.length ? <CategoryExpenseChart data={byCategory} /> : <p className="chart-empty">No expenses in this period.</p>}
            </article>
          </section>

          <article className="card">
            <header className="card-header">
              <div>
                <h2>Income, expenses, and savings</h2>
                <p>Savings is income minus expenses and can be negative.</p>
              </div>
            </header>
            <IncomeExpenseChart data={series} showSavings />
          </article>

          <section className="report-grid">
            <article className="card">
              <header className="card-header">
                <h2>Payment methods</h2>
              </header>
              {payments.length ? (
                <div className="chart-frame">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={payments} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                        {payments.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => data.formatMoney(value)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="chart-empty">No expenses in this period.</p>
              )}
            </article>
            <article className="card">
              <header className="card-header">
                <h2>Top five categories</h2>
              </header>
              {top.length === 0 ? (
                <p className="muted">No expense categories in this period.</p>
              ) : (
                <ol className="legend-list">
                  {top.map((item) => (
                    <li key={item.categoryId} className="legend-item">
                      <span>{item.name}</span>
                      <strong>{data.formatMoney(item.value)}</strong>
                    </li>
                  ))}
                </ol>
              )}
            </article>
          </section>

          <section className="report-grid">
            <article className="card">
              <header className="card-header">
                <h2>Highest expenses</h2>
              </header>
              {highest.length === 0 ? (
                <p className="muted">No individual expenses in this period.</p>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Description</th>
                        <th>Date</th>
                        <th className="num">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {highest.map((item) => (
                        <tr key={item.id}>
                          <td>
                            {item.description}
                            <p className="muted">{categoryName(data.categories, item.categoryId)}</p>
                          </td>
                          <td>{data.formatDate(item.date)}</td>
                          <td className="num">{data.formatMoney(item.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </article>
            <article className="card">
              <header className="card-header">
                <div>
                  <h2>Budget utilization</h2>
                  <p>{monthLabel(year, month)}</p>
                </div>
              </header>
              {budgetRows.length === 0 ? (
                <p className="muted">No budgets for the selected month.</p>
              ) : (
                <ul className="legend-list">
                  {budgetRows.map((item) => (
                    <li key={item.id} className="legend-item">
                      <span>
                        {item.name}
                        <br />
                        <small className="muted">
                          {data.formatMoney(item.spent)} of {data.formatMoney(item.limit)} · {formatPercent(item.percent, 0)}
                        </small>
                      </span>
                      <span className={`badge badge--${item.status === 'exceeded' ? 'danger' : item.status === 'warning' ? 'warning' : 'income'}`}>
                        {item.status === 'exceeded' ? 'Over' : item.status === 'warning' ? 'Warning' : 'On track'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          </section>

          <article className="card">
            <header className="card-header">
              <h2>Month-over-month spending</h2>
            </header>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Month</th>
                    <th className="num">Expenses</th>
                    <th className="num">Change</th>
                    <th className="num">Percent</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisons.map((point) => (
                    <tr key={`${point.year}-${point.month}`}>
                      <td>{point.label}</td>
                      <td className="num">{data.formatMoney(point.expense)}</td>
                      <td className="num">{data.formatMoney(point.comparison.change)}</td>
                      <td className="num">
                        {point.comparison.comparable ? formatPercent(point.comparison.percent, 1) : 'No baseline'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </>
      )}
    </div>
  );
}
