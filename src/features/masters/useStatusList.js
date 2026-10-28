import { slugify } from '../../utils/slug';
import { useMasterList } from './useMasterList';

// Names and colours of a workflow status category (project, scan, assessment or finding
// statuses) from the Statuses page. Records store the status value itself, e.g. 'In Progress';
// its status item has the slug of that value. Falls back to the value while loading.
export function useStatusList(category) {
  const statuses = useMasterList(category);
  const find = (value) => statuses.find(slugify(value ?? ''));
  const labelOf = (value) => find(value)?.name ?? value;
  return {
    find,
    labelOf,
    toneOf: (value) => find(value)?.tone,
    // SelectFilter / <option> entries for a list of values, e.g. SCAN_STATUSES.
    options: (values) => values.map((value) => ({ value, label: labelOf(value) })),
  };
}
