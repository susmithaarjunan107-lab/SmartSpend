import { Search } from 'lucide-react';

export default function SearchBar({ id = 'search', value, onChange, placeholder = 'Search' }) {
  return (
    <div className="search">
      <Search size={16} aria-hidden="true" />
      <label className="sr-only" htmlFor={id}>
        Search
      </label>
      <input
        id={id}
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
