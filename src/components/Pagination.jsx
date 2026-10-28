import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const PAGE_SIZES = [10, 25, 50];

// Client-side paging for a list. Goes back to page 1 whenever the number of items changes
// (for example after a search), and never points past the last page.
export function usePagination(items, initialPageSize = PAGE_SIZES[0]) {
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [page, setPage] = useState(1);
  const [lastTotal, setLastTotal] = useState(items.length);

  if (items.length !== lastTotal) {
    setLastTotal(items.length);
    setPage(1);
  }

  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * pageSize;

  return {
    pageItems: items.slice(start, start + pageSize),
    page: currentPage,
    pageCount,
    pageSize,
    total: items.length,
    start,
    setPage,
    setPageSize: (size) => {
      setPageSize(size);
      setPage(1);
    },
  };
}

// Page numbers to show: always the first and last, the current one and its neighbours,
// with "…" for the gaps. For example 1 … 4 5 6 … 12.
function pageNumbers(page, pageCount) {
  const pages = [];
  for (let number = 1; number <= pageCount; number += 1) {
    if (number === 1 || number === pageCount || Math.abs(number - page) <= 1) pages.push(number);
    else if (pages.at(-1) !== '…') pages.push('…');
  }
  return pages;
}

// The bar under a paged list. Hidden when everything fits on the smallest page size.
// `sizes` are the page sizes offered; card grids use multiples of 12 so rows stay full.
export default function Pagination({ pagination, label = 'items', sizes = PAGE_SIZES }) {
  const { page, pageCount, pageSize, total, start, setPage, setPageSize } = pagination;
  if (total <= sizes[0]) return null;

  const end = Math.min(start + pageSize, total);
  const pageButton = 'grid h-8 min-w-8 cursor-pointer place-items-center rounded-md px-2 text-[13px] disabled:cursor-not-allowed disabled:opacity-40';

  return (
    <nav aria-label={`${label} pages`} className="flex flex-wrap items-center gap-3 border-t border-slate-200 px-5 py-2.5 text-[13px] text-slate-500">
      <p aria-live="polite">
        Showing{' '}
        <span className="font-semibold text-slate-700">
          {start + 1}–{end}
        </span>{' '}
        of <span className="font-semibold text-slate-700">{total}</span> {label}
      </p>

      <label className="flex items-center gap-2">
        Rows per page
        <select className="input h-8 w-auto py-0 pr-7" value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
          {sizes.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </label>

      <ul className="flex items-center gap-1 sm:ml-auto">
        <li>
          <button
            type="button"
            className={`${pageButton} hover:bg-slate-100`}
            aria-label="Previous page"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            <ChevronLeft size={16} aria-hidden="true" />
          </button>
        </li>
        {pageNumbers(page, pageCount).map((number, index) =>
          number === '…' ? (
            <li key={`gap-${index}`} className="px-1" aria-hidden="true">
              …
            </li>
          ) : (
            <li key={number}>
              <button
                type="button"
                className={`${pageButton} ${number === page ? 'bg-blue-600 font-semibold text-white' : 'text-slate-700 hover:bg-slate-100'}`}
                aria-label={`Page ${number}`}
                aria-current={number === page ? 'page' : undefined}
                onClick={() => setPage(number)}
              >
                {number}
              </button>
            </li>
          ),
        )}
        <li>
          <button
            type="button"
            className={`${pageButton} hover:bg-slate-100`}
            aria-label="Next page"
            disabled={page === pageCount}
            onClick={() => setPage(page + 1)}
          >
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </li>
      </ul>
    </nav>
  );
}
