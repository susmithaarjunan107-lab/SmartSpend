import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { useAppData } from '../../context/AppDataContext.jsx';

export default function CategoryExpenseChart({ data }) {
  const { formatMoney, preferences } = useAppData();
  const dark = preferences.theme === 'dark';
  const grid = dark ? '#2a3b4e' : '#e6ebf1';

  return (
    <div className="chart-frame">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={58} outerRadius={88} paddingAngle={2}>
            {data.map((entry) => (
              <Cell key={entry.categoryId || entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => formatMoney(value)}
            contentStyle={{ background: dark ? '#162232' : '#fff', border: `1px solid ${grid}`, borderRadius: 12, color: dark ? '#e8eef4' : '#12263a' }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
