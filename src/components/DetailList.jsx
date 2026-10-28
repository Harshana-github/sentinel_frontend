// Key/value pairs for detail pages. items: [{ label, value }]
// `columns` = 'auto' fills the width; 'single' stacks the pairs (for narrow side panels).
export default function DetailList({ items, columns = 'auto' }) {
  const layout = columns === 'single' ? 'grid-cols-1' : 'grid-cols-[repeat(auto-fill,minmax(200px,1fr))]';
  return (
    <dl className={`grid gap-x-5 gap-y-3.5 ${layout}`}>
      {items.map((item) => (
        <div key={item.label}>
          <dt className="mb-0.5 text-xs text-slate-500">{item.label}</dt>
          <dd className="break-words">{item.value ?? '—'}</dd>
        </div>
      ))}
    </dl>
  );
}
