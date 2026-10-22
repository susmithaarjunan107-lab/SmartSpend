import { PAYMENT_METHODS } from '../../utils/constants.js';
import { hasActiveFilters } from '../../utils/filters.js';
import DateRangeFilter from '../common/DateRangeFilter.jsx';
import SearchBar from '../common/SearchBar.jsx';

export default function TransactionFilters({ filters, categories, onChange, onClear, matchCount, totalCount, rangeError }) {
  const categoryOptions = categories.filter((category) => filters.type === 'all' || category.type === filters.type);

  return (
    <section className="card filters">
      <SearchBar
        id="transaction-search"
        value={filters.search}
        onChange={(search) => onChange({ search })}
        placeholder="Search description or notes"
      />
      <div className="filter-grid">
        <div className="field">
          <label htmlFor="filter-type">Type</label>
          <select id="filter-type" value={filters.type} onChange={(event) => onChange({ type: event.target.value })}>
            <option value="all">All types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="filter-category">Category</label>
          <select id="filter-category" value={filters.categoryId} onChange={(event) => onChange({ categoryId: event.target.value })}>
            <option value="all">All categories</option>
            {categoryOptions.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="filter-payment">Payment method</label>
          <select
            id="filter-payment"
            value={filters.paymentMethod}
            onChange={(event) => onChange({ paymentMethod: event.target.value })}
          >
            <option value="all">All methods</option>
            {PAYMENT_METHODS.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="filter-sort">Sort</label>
          <div className="choice-row">
            <select id="filter-sort" value={filters.sortBy} onChange={(event) => onChange({ sortBy: event.target.value })}>
              <option value="date">Date</option>
              <option value="amount">Amount</option>
              <option value="description">Description</option>
              <option value="category">Category</option>
            </select>
            <button
              type="button"
              className="btn btn--secondary"
              aria-pressed={filters.sortDir === 'asc'}
              onClick={() => onChange({ sortDir: filters.sortDir === 'asc' ? 'desc' : 'asc' })}
            >
              {filters.sortDir === 'asc' ? 'Ascending' : 'Descending'}
            </button>
          </div>
        </div>
      </div>
      <DateRangeFilter
        startDate={filters.startDate}
        endDate={filters.endDate}
        onChange={(range) => onChange(range)}
      />
      {rangeError ? (
        <p className="field-error" role="alert">
          {rangeError}
        </p>
      ) : null}
      <div className="filter-meta">
        <p className="muted">
          {matchCount} of {totalCount} transaction{totalCount === 1 ? '' : 's'} match
        </p>
        {hasActiveFilters(filters) ? (
          <button type="button" className="text-button" onClick={onClear}>
            Clear all filters
          </button>
        ) : null}
      </div>
    </section>
  );
}
