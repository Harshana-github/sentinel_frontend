// A plain table driven by a column list: [{ key, header, render?, className? }].
// `className` is applied to the header and body cells, e.g. 'text-right' for numbers.
export default function DataTable({ columns, rows, caption, emptyMessage = 'No records found.' }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={`px-5 py-2.5 text-xs font-semibold tracking-wide whitespace-nowrap text-slate-500 uppercase ${column.className ?? ''}`}
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
            rows.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50/60">
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
  );
}
