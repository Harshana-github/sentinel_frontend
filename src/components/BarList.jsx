import { Link } from 'react-router-dom';

// Simple horizontal bar chart. items: [{ key, label, count, barClass, to? }]
export default function BarList({ items, label }) {
  const total = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <ul className="flex flex-col gap-3" aria-label={label}>
      {items.map((item) => {
        const percent = total ? Math.round((item.count / total) * 100) : 0;
        const rowClasses = 'mb-1 flex justify-between text-inherit';
        const text = (
          <>
            <span className="font-medium">{item.label}</span>
            <span>
              {item.count} <span className="text-slate-500">({percent}%)</span>
            </span>
          </>
        );
        return (
          <li key={item.key}>
            {item.to ? (
              <Link to={item.to} className={rowClasses}>
                {text}
              </Link>
            ) : (
              <div className={rowClasses}>{text}</div>
            )}
            <div className="h-2 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
              <div className={`h-full rounded-full ${item.barClass}`} style={{ width: `${percent}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
