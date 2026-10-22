import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAppData } from '../../context/AppDataContext.jsx';
import { formatCompactCurrency } from '../../utils/currency.js';

export default function IncomeExpenseChart({ data, showSavings = false }) {
  const { formatMoney, preferences } = useAppData();
  const currency = preferences.currency;
  const dark = preferences.theme === 'dark';
  const axis = dark ? '#a9b7c6' : '#5c6b7a';
  const grid = dark ? '#2a3b4e' : '#e6ebf1';

  return (
    <div className="chart-frame">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={grid} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: axis, fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis
            tickFormatter={(value) => formatCompactCurrency(value, currency)}
            tick={{ fill: axis, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={68}
          />
          <Tooltip
            formatter={(value) => formatMoney(value)}
            contentStyle={{ background: dark ? '#162232' : '#fff', border: `1px solid ${grid}`, borderRadius: 12, color: dark ? '#e8eef4' : '#12263a' }}
          />
          <Legend />
          <Bar dataKey="income" name="Income" fill="var(--chart-income)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expense" name="Expenses" fill="var(--chart-expense)" radius={[4, 4, 0, 0]} />
          {showSavings ? <Line type="monotone" dataKey="savings" name="Savings" stroke="#1d6fbf" strokeWidth={2} dot={false} /> : null}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
