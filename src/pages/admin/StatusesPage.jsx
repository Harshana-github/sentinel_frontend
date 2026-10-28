import { useState } from 'react';
import { Building2, CircleDot, FolderKanban, Layers, Plug, Radar, ShieldAlert, Users } from 'lucide-react';
import ListManager from '../../components/ListManager';
import PageHeader from '../../components/PageHeader';
import { STATUS_CATEGORIES } from '../../utils/constants';

const CATEGORY_ICONS = {
  'organization-statuses': Building2,
  'user-statuses': Users,
  'integration-statuses': Plug,
  'project-statuses': FolderKanban,
  'scan-statuses': Radar,
  'assessment-statuses': Layers,
  'finding-statuses': ShieldAlert,
};

export default function StatusesPage() {
  const [activeKey, setActiveKey] = useState(STATUS_CATEGORIES[0].key);
  const active = STATUS_CATEGORIES.find((category) => category.key === activeKey);

  return (
    <div className="fill-page">
      <PageHeader
        title="Statuses"
        description="Each status category has its own statuses. Names and badge colours apply everywhere the status is shown."
      />
      <div className="fill-grow grid gap-5 lg:grid-cols-[240px_1fr] lg:grid-rows-[minmax(0,1fr)]">
        <nav
          aria-label="Status categories"
          className="self-start rounded-lg border border-slate-200 bg-white p-2 shadow-sm lg:max-h-full lg:overflow-y-auto"
        >
          <p className="px-2.5 pt-1 pb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">Categories</p>
          <ul className="flex flex-col gap-0.5">
            {STATUS_CATEGORIES.map((category) => {
              const Icon = CATEGORY_ICONS[category.key] ?? CircleDot;
              const selected = category.key === activeKey;
              return (
                <li key={category.key}>
                  <button
                    type="button"
                    aria-current={selected ? 'true' : undefined}
                    onClick={() => setActiveKey(category.key)}
                    className={`flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm ${selected ? 'bg-blue-50 font-semibold text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                  >
                    <Icon size={16} aria-hidden="true" />
                    {category.title}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
        <ListManager key={active.key} list={active} />
      </div>
    </div>
  );
}
