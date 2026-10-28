import { useState } from 'react';
import ListManager from '../../components/ListManager';
import PageHeader from '../../components/PageHeader';
import { MASTER_LISTS } from '../../utils/constants';
import { useTranslation } from '../../i18n';

export default function MasterDataPage() {
  const { t } = useTranslation();
  const [activeKey, setActiveKey] = useState(MASTER_LISTS[0].key);
  const active = MASTER_LISTS.find((list) => list.key === activeKey);

  return (
    <div className="fill-page">
      <PageHeader title={t('nav.masters')} description={t('masters.description')} />
      <div className="mb-4 flex flex-wrap gap-1 border-b border-slate-200" role="tablist" aria-label={t('nav.masters')}>
        {MASTER_LISTS.map((list) => {
          const selected = list.key === activeKey;
          return (
            <button
              key={list.key}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActiveKey(list.key)}
              className={`-mb-px cursor-pointer border-b-2 px-3 py-2 text-sm font-medium ${selected ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
            >
              {t(`masters.lists.${list.key}.title`)}
            </button>
          );
        })}
      </div>
      <ListManager key={active.key} list={active} textKey={`masters.lists.${active.key}`} />
    </div>
  );
}
