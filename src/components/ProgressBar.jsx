export default function ProgressBar({ value, label, className = 'h-2' }) {
  return (
    <div
      className={`overflow-hidden rounded-full bg-slate-100 ${className}`}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
    >
      <div className="h-full rounded-full bg-blue-600 transition-[width] duration-400" style={{ width: `${value}%` }} />
    </div>
  );
}
