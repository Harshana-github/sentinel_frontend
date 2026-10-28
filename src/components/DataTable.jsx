import Pagination, { usePagination } from './Pagination';

// A plain table driven by a column list: [{ key, header, render?, className? }].
// `className` is applied to the header and body cells, e.g. 'text-right' for numbers.
// The header row stays visible when the table scrolls inside a fill card. Rows are paged
// (10, 25 or 50 per page); the pager only shows when there is more than one small page.
// `onRowClick(row)` makes the whole row clickable. Clicks on links, buttons and form controls
// inside the row keep their own behaviour. Keyboard users use the link in the row instead.
export default function DataTable({ columns, rows, caption, emptyMessage = 'No records found.', onRowClick }) {
  const pagination = usePagination(rows);

  return (
    <>
      <div className="table-scroll overflow-x-auto">
        <table className="w-full border-collapse text-left">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={`sticky top-0 z-10 bg-slate-50 px-5 py-2.5 text-xs font-semibold tracking-wide whitespace-nowrap text-slate-500 uppercase shadow-[inset_0_-1px_0_var(--color-slate-200)] ${column.className ?? ''}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-8 text-center text-slate-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              pagination.pageItems.map((row) => (
                <tr
                  key={row.id}
                  className={onRowClick ? 'cursor-pointer hover:bg-blue-50/40' : 'hover:bg-slate-50/60'}
                  onClick={
                    onRowClick &&
                    ((event) => {
                      if (event.target.closest('a, button, input, select, textarea, label')) return;
                      onRowClick(row);
                    })
                  }
                >
                  {columns.map((column) => (
                    <td key={column.key} className={`px-5 py-3 align-middle ${column.className ?? ''}`}>
                      {column.render ? column.render(row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Pagination pagination={pagination} label={caption?.toLowerCase() ?? 'rows'} />
    </>
  );
}
