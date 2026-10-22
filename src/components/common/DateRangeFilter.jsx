export default function DateRangeFilter({ startDate, endDate, onChange }) {
  return (
    <div className="date-range">
      <div className="field">
        <label htmlFor="filter-start">From</label>
        <input
          id="filter-start"
          type="date"
          value={startDate}
          onChange={(event) => onChange({ startDate: event.target.value, endDate })}
        />
      </div>
      <div className="field">
        <label htmlFor="filter-end">To</label>
        <input
          id="filter-end"
          type="date"
          value={endDate}
          onChange={(event) => onChange({ startDate, endDate: event.target.value })}
        />
      </div>
    </div>
  );
}
