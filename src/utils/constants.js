// Values the app stores and checks. Their labels are translations: for example the label of
// the severity 'High' is `severity.High`, and of the scan profile 'Deep' `scanProfiles.Deep.name`.

export const SEVERITIES = ['Critical', 'High', 'Medium', 'Low', 'Informational'];

export const SCAN_STATUSES = ['Queued', 'Running', 'Completed', 'Failed', 'Cancelled'];
export const ACTIVE_SCAN_STATUSES = ['Queued', 'Running'];

export const FINDING_STATUSES = ['Open', 'In Progress', 'Resolved', 'False Positive'];
export const OPEN_FINDING_STATUSES = ['Open', 'In Progress'];

export const PROJECT_STATUSES = ['Active', 'On Hold', 'Archived'];
export const PROJECT_ENVIRONMENTS = ['Production', 'Staging', 'Development'];

export const ASSESSMENT_STATUSES = ['Queued', 'Running', 'Completed', 'Completed with errors', 'Failed', 'Cancelled'];

// Scan depth. Labels: scanProfiles.<value>.
export const SCAN_PROFILES = ['Quick', 'Standard', 'Deep'];

// Assessment profiles (labels: assessmentProfiles.<key>). An assessment scans several targets of
// one project at once: one scan job per target. `types` maps target types to required (blocks
// the start when the project has no target of that type), included (selected by default) or
// optional (not selected by default). `scanProfile` is the depth of every job; 'primary'
// plugins runs one plugin per job, 'all' every matching plugin.
export const ASSESSMENT_PROFILES = [
  { key: 'quick', scanProfile: 'Quick', plugins: 'primary', types: { web: 'included', host: 'included' } },
  { key: 'webapp', scanProfile: 'Standard', plugins: 'all', types: { web: 'required', repository: 'included', container: 'optional' } },
  { key: 'code', scanProfile: 'Standard', plugins: 'all', types: { repository: 'required', iac: 'included', artifact: 'optional' } },
  {
    key: 'full',
    scanProfile: 'Deep',
    plugins: 'all',
    types: { web: 'included', repository: 'included', container: 'included', iac: 'included', host: 'included', artifact: 'included' },
  },
];

// Lists of values on the Master Data page (labels: masters.lists.<key>). Every item has an id,
// a name and a description, each with an optional Japanese version (nameJa, descriptionJa).
// `extraFields` adds list-specific settings (labels: masters.fields.<key>); a field with
// `options` is a choice. `pluginField` is the scanner plugin field that stores an item's id,
// so items still in use cannot be deleted.
export const MASTER_LISTS = [
  {
    key: 'target-types',
    pluginField: 'targetTypes',
    extraFields: [{ key: 'placeholder' }, { key: 'format', options: ['url', 'text'] }],
  },
  { key: 'plugin-sources', pluginField: 'source' },
  { key: 'plugin-categories', pluginField: 'category' },
  { key: 'plugin-interfaces', pluginField: 'interface', extraFields: [{ key: 'kind', options: ['command', 'url'] }] },
  { key: 'licenses', pluginField: 'license' },
];

// Badge colours a status can use. Labels: statuses.tones.<value>.
export const STATUS_TONES = ['success', 'info', 'warning', 'danger', 'neutral'];

// Status categories on the Statuses page (labels: statuses.categories.<key>). The categories are
// fixed because the app uses them; the Super Admin manages the statuses inside each one.
// `builtIn` statuses drive app behaviour (for example, a suspended organization cannot sign in),
// so they can be edited but not deleted. `fixed` categories hold exactly the statuses Sentinel's
// workflow uses (PROJECT_STATUSES, SCAN_STATUSES and so on); their slug is the slug of that
// value, and only the name, the description and the badge colour can be changed.
export const STATUS_CATEGORIES = [
  { key: 'organization-statuses' },
  { key: 'user-statuses' },
  { key: 'integration-statuses' },
  { key: 'project-statuses', fixed: true },
  { key: 'scan-statuses', fixed: true },
  { key: 'assessment-statuses', fixed: true },
  { key: 'finding-statuses', fixed: true },
].map((category) => ({ ...category, extraFields: [{ key: 'tone', options: STATUS_TONES }] }));
