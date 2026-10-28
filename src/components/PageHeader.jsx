import { Link } from 'react-router-dom';

export default function PageHeader({ title, description, breadcrumbs, actions }) {
  return (
    <header className="mb-5">
      {breadcrumbs && (
        <nav aria-label="Breadcrumb">
          <ol className="mb-1.5 flex flex-wrap gap-1.5 text-[13px] text-slate-500">
            {breadcrumbs.map((crumb, index) => (
              <li key={crumb.label} className="flex gap-1.5">
                {index > 0 && <span aria-hidden="true" className="text-slate-300">/</span>}
                {crumb.to ? <Link to={crumb.to}>{crumb.label}</Link> : <span aria-current="page">{crumb.label}</span>}
              </li>
            ))}
          </ol>
        </nav>
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] leading-tight font-bold">{title}</h1>
          {description && <p className="mt-1 max-w-3xl text-slate-500">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </header>
  );
}
