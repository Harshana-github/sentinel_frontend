import { useEffect, useState } from 'react';
import { Boxes, Pencil, Plus, Power, PowerOff, Tags, Trash2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useMasterList } from '../../features/masters/useMasterList';
import { selectScannersState } from '../../features/scanners/scannersSlice';
import { deleteScannerModule, fetchScannerModules, updateScannerModule } from '../../features/scanners/scannersThunks';
import { showToast } from '../../features/ui/uiSlice';
import Alert from '../../components/Alert';
import AsyncContent from '../../components/AsyncContent';
import Card from '../../components/Card';
import DataTable from '../../components/DataTable';
import { FilterBar, SearchInput, SelectFilter } from '../../components/Filters';
import PageHeader from '../../components/PageHeader';
import PluginFormModal from '../../components/PluginFormModal';
import { CategoryStatusBadge } from '../../components/StatusBadge';
import { USE_MOCK_DATA } from '../../services/api';
import { includesText } from '../../utils/format';

function SummaryTile({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3.5 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <span className="grid size-10.5 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600" aria-hidden="true">
        <Icon size={20} />
      </span>
      <span className="flex flex-col">
        <span className="text-[13px] text-slate-500">{label}</span>
        <span className="text-2xl leading-tight font-bold">{value}</span>
      </span>
    </div>
  );
}

function SourceBadge({ name }) {
  return <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold whitespace-nowrap text-slate-600">{name}</span>;
}

export default function ScannerModulesPage() {
  const dispatch = useDispatch();
  const { items, status, error } = useSelector(selectScannersState);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  // undefined = closed, null = registering, a plugin = editing.
  const [editing, setEditing] = useState();
  const [busyId, setBusyId] = useState(null);
  const sources = useMasterList('plugin-sources');
  const categories = useMasterList('plugin-categories');
  const targetTypes = useMasterList('target-types');
  const interfaces = useMasterList('plugin-interfaces');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    dispatch(fetchScannerModules());
  }, [dispatch]);


  async function toggleEnabled(plugin) {
    setBusyId(plugin.id);
    try {
      await dispatch(updateScannerModule({ id: plugin.id, changes: { enabled: !plugin.enabled } })).unwrap();
      dispatch(showToast({ message: `${plugin.name} ${plugin.enabled ? 'disabled' : 'enabled'}.` }));
    } catch (saveError) {
      dispatch(showToast({ type: 'error', message: saveError.message }));
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(plugin) {
    if (!window.confirm(`Remove ${plugin.name}? Organizations will no longer be able to use it. Past scans are kept.`)) return;
    setBusyId(plugin.id);
    try {
      await dispatch(deleteScannerModule(plugin.id)).unwrap();
      dispatch(showToast({ message: `${plugin.name} removed.` }));
    } catch (deleteError) {
      dispatch(showToast({ type: 'error', message: deleteError.message }));
      setBusyId(null);
    }
  }

  const visible = items.filter(
    (plugin) =>
      (!sourceFilter || plugin.source === sourceFilter) &&
      (!categoryFilter || plugin.category === categoryFilter) &&
      (includesText(plugin.name, search) || includesText(categories.nameOf(plugin.category), search) || includesText(plugin.image, search)),
  );

  const columns = [
    {
      key: 'name',
      header: 'Plugin',
      render: (plugin) => (
        <div className="flex min-w-52 flex-col gap-0.5">
          <span className="font-semibold">
            {plugin.name} <span className="font-mono text-xs font-normal text-slate-500">v{plugin.version}</span>
          </span>
          <span className="text-xs text-slate-500">
            {categories.nameOf(plugin.category)} · <code>{plugin.id}</code>
          </span>
        </div>
      ),
    },
    { key: 'source', header: 'Source', render: (plugin) => <SourceBadge name={sources.nameOf(plugin.source)} /> },
    {
      key: 'targetTypes',
      header: 'Targets',
      render: (plugin) => (
        <ul className="flex max-w-64 flex-wrap gap-1">
          {plugin.targetTypes.map((type) => (
            <li key={type} className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[11px] whitespace-nowrap">
              {targetTypes.nameOf(type)}
            </li>
          ))}
        </ul>
      ),
    },
    {
      key: 'runs',
      header: 'Runs with',
      render: (plugin) => (
        <div className="flex max-w-72 flex-col gap-0.5">
          <span className="text-xs font-semibold">{interfaces.nameOf(plugin.interface)}</span>
          <code className="truncate text-[11px] text-slate-500" title={plugin.command}>
            {plugin.command}
          </code>
        </div>
      ),
    },
    { key: 'integrationStatus', header: 'Status', render: (plugin) => <CategoryStatusBadge category="integration-statuses" value={plugin.integrationStatus} /> },
    {
      key: 'enabled',
      header: 'Enabled',
      className: 'text-center',
      render: (plugin) => (
        <button
          type="button"
          role="switch"
          aria-checked={plugin.enabled}
          aria-label={`${plugin.name} enabled`}
          disabled={busyId === plugin.id}
          onClick={() => toggleEnabled(plugin)}
          className={`relative inline-flex h-5 w-9 cursor-pointer items-center rounded-full transition-colors disabled:cursor-wait ${plugin.enabled ? 'bg-blue-600' : 'bg-slate-300'}`}
        >
          <span className={`inline-block size-4 rounded-full bg-white shadow transition-transform ${plugin.enabled ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
        </button>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (plugin) => (
        <div className="flex justify-end gap-1">
          <button type="button" className="icon-btn" aria-label={`Edit ${plugin.name}`} title="Edit" onClick={() => setEditing(plugin)}>
            <Pencil size={16} aria-hidden="true" />
          </button>
          <button type="button" className="icon-btn hover:text-red-700" aria-label={`Remove ${plugin.name}`} title="Remove" disabled={busyId === plugin.id} onClick={() => handleDelete(plugin)}>
            <Trash2 size={16} aria-hidden="true" />
          </button>
        </div>
      ),
    },
  ];

  const toolsByTargetType = targetTypes.items.map(({ id: type, name }) => ({
    id: type,
    type: name,
    tools:
      items
        .filter((plugin) => plugin.enabled && plugin.targetTypes.includes(type))
        .map((plugin) => plugin.name)
        .join(', ') || '—',
  }));

  return (
    <>
      <PageHeader
        title="Scanner plugins"
        description="Register open-source and in-house security tools. Every plugin runs in its own isolated container through the same interface."
        actions={
          <button type="button" className="btn btn-primary" onClick={() => setEditing(null)}>
            <Plus size={16} aria-hidden="true" />
            Register plugin
          </button>
        }
      />
      {USE_MOCK_DATA && (
        <Alert className="mb-5">No scanning engine is connected to this demo. Plugins are saved, but scans and findings are simulated in the browser.</Alert>
      )}

      <AsyncContent status={status} error={error} hasData={items.length > 0} onRetry={() => dispatch(fetchScannerModules())}>
        <div className="mb-5 grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
          <SummaryTile icon={Boxes} label="Registered plugins" value={items.length} />
          <SummaryTile icon={Power} label="Enabled" value={items.filter((plugin) => plugin.enabled).length} />
          <SummaryTile icon={PowerOff} label="Disabled" value={items.filter((plugin) => !plugin.enabled).length} />
          <SummaryTile icon={Tags} label="Sources" value={sources.items.length} />
        </div>

        <div className="flex flex-col gap-5">
          <Card flush>
            <FilterBar resultCount={visible.length}>
              <SearchInput label="Search plugins" placeholder="Search by name, category or image" value={search} onChange={setSearch} />
              <SelectFilter label="Filter by source" allLabel="All sources" value={sourceFilter} onChange={setSourceFilter} options={sources.items.map((source) => ({ value: source.id, label: source.name }))} />
              <SelectFilter label="Filter by category" allLabel="All categories" value={categoryFilter} onChange={setCategoryFilter} options={categories.items.map((category) => ({ value: category.id, label: category.name }))} />
            </FilterBar>
            <DataTable columns={columns} rows={visible} caption="Scanner plugins" emptyMessage="No plugins match your search." />
          </Card>

          <Card title="Enabled plugins by target type" flush>
            <DataTable
              caption="Enabled plugins by target type"
              columns={[
                { key: 'type', header: 'Target type' },
                { key: 'tools', header: 'Plugins' },
              ]}
              rows={toolsByTargetType}
            />
          </Card>
        </div>
      </AsyncContent>

      {editing !== undefined && <PluginFormModal plugin={editing ?? undefined} onClose={() => setEditing(undefined)} />}
    </>
  );
}
