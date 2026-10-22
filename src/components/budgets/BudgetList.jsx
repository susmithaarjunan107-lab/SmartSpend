import BudgetCard from './BudgetCard.jsx';

export default function BudgetList({ budgets, categories, formatMoney, onEdit, onDelete }) {
  if (!budgets.length) return null;
  return (
    <div className="budget-grid">
      {budgets.map((budget) => (
        <BudgetCard
          key={budget.id}
          budget={budget}
          categories={categories}
          formatMoney={formatMoney}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
