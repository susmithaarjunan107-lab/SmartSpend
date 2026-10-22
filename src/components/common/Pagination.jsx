export default function Pagination({ page, pageCount, onPage }) {
  if (pageCount <= 1) return null;
  return (
    <nav className="pagination" aria-label="Pagination">
      <button type="button" className="btn btn--secondary btn--sm" onClick={() => onPage(page - 1)} disabled={page <= 1}>
        Previous
      </button>
      <span>
        Page {page} of {pageCount}
      </span>
      <button type="button" className="btn btn--secondary btn--sm" onClick={() => onPage(page + 1)} disabled={page >= pageCount}>
        Next
      </button>
    </nav>
  );
}
