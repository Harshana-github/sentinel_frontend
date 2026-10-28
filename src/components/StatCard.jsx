import { Link } from 'react-router-dom';

export default function StatCard({ icon: Icon, label, value, detail, to }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3.5 rounded-lg border border-slate-200 bg-white p-4 text-inherit shadow-sm hover:border-blue-600 hover:no-underline"
    >
      <span className="grid size-10.5 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600" aria-hidden="true">
        <Icon size={20} />
      </span>
      <span className="flex flex-col">
        <span className="text-[13px] text-slate-500">{label}</span>
        <span className="text-2xl leading-tight font-bold">{value}</span>
        {detail && <span className="text-xs text-slate-500">{detail}</span>}
      </span>
    </Link>
  );
}
