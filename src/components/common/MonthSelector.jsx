import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext.jsx';
import { currentYearMonth, shiftMonth } from '../../utils/dateUtils.js';

export default function MonthSelector() {
  const { view, setView } = useAppData();
  if (!view) return null;
  const value = `${view.year}-${String(view.month).padStart(2, '0')}`;

  function move(offset) {
    const next = shiftMonth(view.year, view.month, offset);
    setView(next.year, next.month);
  }

  return (
    <div className="month-selector">
      <button type="button" className="icon-btn" onClick={() => move(-1)} aria-label="Previous month">
        <ChevronLeft size={18} />
      </button>
      <label className="sr-only" htmlFor="selected-month">
        Selected month
      </label>
      <input
        id="selected-month"
        type="month"
        value={value}
        onChange={(event) => {
          const [year, month] = event.target.value.split('-').map(Number);
          if (year && month) setView(year, month);
        }}
      />
      <button type="button" className="icon-btn" onClick={() => move(1)} aria-label="Next month">
        <ChevronRight size={18} />
      </button>
      <button
        type="button"
        className="text-button"
        onClick={() => {
          const now = currentYearMonth();
          setView(now.year, now.month);
        }}
      >
        This month
      </button>
    </div>
  );
}
