import { useEffect, useState } from 'react';
import { Boxes, Pencil, Plus, Power, PowerOff, Tags, Terminal, Trash2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useMasterList } from '../../features/masters/useMasterList';
import { selectScannersState } from '../../features/scanners/scannersSlice';
import { deleteScannerModule, fetchScannerModules, updateScannerModule } from '../../features/scanners/scannersThunks';
import { showToast } from '../../features/ui/uiSlice';
import AsyncContent from '../../components/AsyncContent';
import CopyButton from '../../components/CopyButton';
import Pagination, { usePagination } from '../../components/Pagination';
import Card from '../../components/Card';
import { FilterBar, SearchInput, SelectFilter } from '../../components/Filters';
import PageHeader from '../../components/PageHeader';
import PluginFormModal from '../../components/PluginFormModal';
import { EmptyState } from '../../components/StateMessage';
import { CategoryStatusBadge } from '../../components/StatusBadge';
import { includesText } from '../../utils/format';
import { useConfirm } from '../../components/ConfirmDialog';
import { useTranslation } from '../../i18n';

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

function EnabledSwitch({ plugin, disabled, onToggle }) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={plugin.enabled}
      aria-label={t('plugins.enabledLabel', { name: plugin.name })}
      title={plugin.enabled ? t('plugins.enabled') : t('plugins.disabled')}
      disabled={disabled}
      onClick={onToggle}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors disabled:cursor-wait ${plugin.enabled ? 'bg-blue-600' : 'bg-slate-300'}`}
    >
      <span
        className={`inline-block size-4 rounded-full bg-white shadow transition-transform ${plugin.enabled ? 'translate-x-4.5' : 'translate-x-0.5'}`}
      />
    </button>
  );
}

const VISIBLE_TARGETS = 2;
const CARD_PAGE_SIZES = [12, 24, 48];

// `names` holds the master data lookups ({ sources, categories, targetTypes, interfaces, licenses }).
// Every section has a fixed height, so the command box and footer line up across a row of cards.
function PluginCard({ plugin, names, busy, onToggle, onEdit, onDelete }) {
  const { t } = useTranslation();
  const [showFullCommand, setShowFullCommand] = useState(false);
  const targetNames = plugin.targetTypes.map((type) => names.targetTypes.nameOf(type));
  const hiddenTargets = targetNames.slice(VISIBLE_TARGETS);

  return (
    <article
      className={`flex w-full flex-col rounded-lg border bg-white shadow-sm transition-colors ${plugin.enabled ? 'border-slate-200 hover:border-blue-300' : 'border-dashed border-slate-300 bg-slate-50/60'}`}
    >
      <div className="flex items-start gap-3 p-4 pb-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600" aria-hidden="true">
          <Boxes size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[15px] font-semibold" title={plugin.name}>
            {plugin.name} <span className="font-mono text-xs font-normal text-slate-500">v{plugin.version}</span>
          </h2>
          <p className="truncate text-xs text-slate-500" title={names.categories.nameOf(plugin.category)}>
            {names.categories.nameOf(plugin.category)}
          </p>
        </div>
        <EnabledSwitch plugin={plugin} disabled={busy} onToggle={onToggle} />
      </div>

      <div className="flex flex-1 flex-col gap-3 px-4 pb-4">
        <p className="line-clamp-2 h-10 text-[13px] leading-5 text-slate-600" title={plugin.purpose}>
          {plugin.purpose || t('common.noDescription')}
        </p>

        <dl className="flex items-center gap-x-3 text-xs whitespace-nowrap text-slate-500">
          <div className="flex min-w-0 items-center gap-1">
            <dt className="sr-only">{t('plugins.source')}</dt>
            <dd className="rounded bg-slate-100 px-1.5 py-0.5 font-semibold text-slate-600">{names.sources.nameOf(plugin.source)}</dd>
          </div>
          <div className="flex min-w-0 items-center gap-1">
            <dt>{t('plugins.license')}</dt>
            <dd className="truncate font-medium text-slate-700">{names.licenses.nameOf(plugin.license)}</dd>
          </div>
          <div className="ml-auto flex min-w-0 items-center">
            <dt className="sr-only">{t('slug.label')}</dt>
            <dd className="truncate">
              <code>{plugin.id}</code>
            </dd>
          </div>
        </dl>

        {/* One line only: the first targets, then "+N" with the rest in its tooltip. */}
        <ul className="flex h-6 items-center gap-1 overflow-hidden" aria-label={t('plugins.targetTypesList', { types: targetNames.join(', ') })}>
          {targetNames.slice(0, VISIBLE_TARGETS).map((name) => (
            <li key={name} className="truncate rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[11px] whitespace-nowrap">
              {name}
            </li>
          ))}
          {hiddenTargets.length > 0 && (
            <li className="shrink-0 rounded bg-blue-50 px-1.5 py-0.5 text-[11px] font-semibold text-blue-700" title={hiddenTargets.join(', ')}>
              +{hiddenTargets.length}
            </li>
          )}
        </ul>

        <div className="mt-auto rounded-md bg-slate-900 text-[11px] text-slate-300">
          <div className="flex items-center gap-1 border-b border-slate-700/70 py-1 pr-1 pl-2.5">
            <Terminal size={12} aria-hidden="true" className="text-slate-400" />
            <span className="font-semibold text-slate-400">{names.interfaces.nameOf(plugin.interface)}</span>
            <button
              type="button"
              className="ml-auto cursor-pointer rounded px-1.5 py-0.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              aria-expanded={showFullCommand}
              onClick={() => setShowFullCommand((shown) => !shown)}
            >
              {showFullCommand ? t('plugins.showLess') : t('plugins.showAll')}
            </button>
            <CopyButton
              value={plugin.command}
              label={t('plugins.copyCommand', { name: plugin.name })}
              className="grid size-6 cursor-pointer place-items-center rounded text-slate-400 hover:bg-slate-800 hover:text-white"
            />
          </div>
          <code
            className={`block bg-transparent px-2.5 py-2 font-mono text-slate-100 ${showFullCommand ? 'break-all whitespace-pre-wrap' : 'truncate'}`}
            title={plugin.command}
          >
            {plugin.command}
          </code>
        </div>
      </div>

      <div className="flex h-12 items-center gap-2 border-t border-slate-200 px-4">
        <CategoryStatusBadge category="integration-statuses" value={plugin.integrationStatus} />
        <div className="ml-auto flex shrink-0 gap-0.5">
          <button
            type="button"
            className="icon-btn size-7.5"
            aria-label={t('common.editItem', { name: plugin.name })}
            title={t('common.edit')}
            onClick={onEdit}
          >
            <Pencil size={15} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="icon-btn size-7.5 hover:text-red-700"
            aria-label={t('common.deleteItem', { name: plugin.name })}
            title={t('common.delete')}
            disabled={busy}
            onClick={onDelete}
          >
            <Trash2 size={15} aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
}

export default function ScannerModulesPage() {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const confirm = useConfirm();
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
  const licenses = useMasterList('licenses');
  const names = { sources, categories, targetTypes, interfaces, licenses };
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    dispatch(fetchScannerModules());
  }, [dispatch]);

  async function toggleEnabled(plugin) {
    setBusyId(plugin.id);
    try {
      await dispatch(updateScannerModule({ id: plugin.id, changes: { enabled: !plugin.enabled } })).unwrap();
      dispatch(showToast({ message: t(plugin.enabled ? 'plugins.disabledToast' : 'plugins.enabledToast', { name: plugin.name }) }));
    } catch (saveError) {
      dispatch(showToast({ type: 'error', message: saveError.message }));
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(plugin) {
    const confirmed = await confirm({
      title: t('plugins.deleteTitle'),
      message: t('plugins.deleteMessage', { name: plugin.name }),
      confirmLabel: t('common.delete'),
      danger: true,
    });
    if (!confirmed) return;
    setBusyId(plugin.id);
    try {
      await dispatch(deleteScannerModule(plugin.id)).unwrap();
      dispatch(showToast({ message: t('common.deletedToast', { name: plugin.name }) }));
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

  const pagination = usePagination(visible, CARD_PAGE_SIZES[0]);

  const coverage = targetTypes.items.map((type) => ({
    ...type,
    plugins: items.filter((plugin) => plugin.enabled && plugin.targetTypes.includes(type.id)),
  }));

  return (
    <>
      <div className="fill-page">
        <PageHeader
          title={t('nav.plugins')}
          description={t('plugins.description')}
          actions={
            <button type="button" className="btn btn-primary" onClick={() => setEditing(null)}>
              <Plus size={16} aria-hidden="true" />
              {t('plugins.register')}
            </button>
          }
        />

        <AsyncContent status={status} error={error} hasData={items.length > 0} onRetry={() => dispatch(fetchScannerModules())}>
          <div className="mb-5 grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
            <SummaryTile icon={Boxes} label={t('plugins.registered')} value={items.length} />
            <SummaryTile icon={Power} label={t('plugins.enabled')} value={items.filter((plugin) => plugin.enabled).length} />
            <SummaryTile icon={PowerOff} label={t('plugins.disabled')} value={items.filter((plugin) => !plugin.enabled).length} />
            <SummaryTile icon={Tags} label={t('plugins.sources')} value={sources.items.length} />
          </div>

          <Card flush fill>
            <FilterBar resultCount={visible.length}>
              <SearchInput label={t('common.search')} placeholder={t('plugins.searchPlaceholder')} value={search} onChange={setSearch} />
              <SelectFilter
                label={t('plugins.source')}
                allLabel={t('plugins.allSources')}
                value={sourceFilter}
                onChange={setSourceFilter}
                options={sources.items.map((source) => ({ value: source.id, label: sources.nameOf(source.id) }))}
              />
              <SelectFilter
                label={t('plugins.category')}
                allLabel={t('plugins.allCategories')}
                value={categoryFilter}
                onChange={setCategoryFilter}
                options={categories.items.map((category) => ({ value: category.id, label: categories.nameOf(category.id) }))}
              />
            </FilterBar>
            {/* fill-scroll makes the grid scroll inside the full-height card. */}
            <div className="fill-scroll bg-slate-50/60 p-4">
              {visible.length === 0 ? (
                <EmptyState title={items.length ? t('common.noMatches') : t('plugins.empty')} />
              ) : (
                <ul className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
                  {pagination.pageItems.map((plugin) => (
                    <li key={plugin.id} className="flex">
                      <PluginCard
                        plugin={plugin}
                        names={names}
                        busy={busyId === plugin.id}
                        onToggle={() => toggleEnabled(plugin)}
                        onEdit={() => setEditing(plugin)}
                        onDelete={() => handleDelete(plugin)}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <Pagination pagination={pagination} sizes={CARD_PAGE_SIZES} />
          </Card>
        </AsyncContent>
      </div>

      {/* Below the full-height plugin list, so it never squeezes it. */}
      {items.length > 0 && (
        <div className="mt-5">
          <Card title={t('plugins.coverage')}>
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3">
              {coverage.map((type) => (
                <li key={type.id} className="rounded-md border border-slate-200 p-3">
                  <p className="mb-2 flex items-center justify-between gap-2">
                    <span className="font-semibold">{targetTypes.nameOf(type.id)}</span>
                    <span className="text-xs text-slate-500">{type.plugins.length}</span>
                  </p>
                  {type.plugins.length === 0 ? (
                    <p className="text-xs text-amber-700">{t('scanOptions.noTools')}</p>
                  ) : (
                    <ul className="flex flex-wrap gap-1">
                      {type.plugins.map((plugin) => (
                        <li key={plugin.id} className="rounded bg-blue-50 px-1.5 py-0.5 text-[11px] font-medium text-blue-700">
                          {plugin.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {editing !== undefined && <PluginFormModal plugin={editing ?? undefined} onClose={() => setEditing(undefined)} />}
    </>
  );
}
