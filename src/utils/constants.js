export const SEVERITIES = ['Critical', 'High', 'Medium', 'Low', 'Informational'];

export const SCAN_STATUSES = ['Queued', 'Running', 'Completed', 'Failed', 'Cancelled'];
export const ACTIVE_SCAN_STATUSES = ['Queued', 'Running'];

export const FINDING_STATUSES = ['Open', 'In Progress', 'Resolved', 'False Positive'];
export const OPEN_FINDING_STATUSES = ['Open', 'In Progress'];

export const PROJECT_STATUSES = ['Active', 'On Hold', 'Archived'];
export const PROJECT_ENVIRONMENTS = ['Production', 'Staging', 'Development'];

export const ORGANIZATION_ROLES = ['Admin', 'Security Analyst', 'Developer', 'Viewer'];

export const SCAN_PROFILES = [
  { value: 'Quick', description: 'Fast checks with the most important rules.' },
  { value: 'Standard', description: 'Balanced coverage for regular assessments.' },
  { value: 'Deep', description: 'Full rule sets. Takes the longest.' },
];

// Lists of values on the Master Data page. Every item has an id, a name and a description;
// `extraFields` adds list-specific settings. `pluginField` is the scanner plugin field that
// stores an item's id, so items still in use cannot be deleted.
export const MASTER_LISTS = [
  {
    key: 'target-types',
    title: 'Target types',
    singular: 'target type',
    description: 'What can be scanned. Organizations pick one when they add a scan target.',
    nameHint: 'For example: Web application, Mobile app.',
    pluginField: 'targetTypes',
    extraFields: [
      { key: 'placeholder', label: 'Example value', hint: 'Shown as an example when adding a target.' },
      {
        key: 'format',
        label: 'Address format',
        options: [
          { value: 'url', label: 'Full URL (https://…)' },
          { value: 'text', label: 'Any value without spaces' },
        ],
      },
    ],
  },
  {
    key: 'plugin-sources',
    title: 'Plugin sources',
    singular: 'source',
    description: 'Where a scanner plugin comes from.',
    nameHint: 'For example: Open source, In-house, Commercial.',
    pluginField: 'source',
  },
  {
    key: 'plugin-categories',
    title: 'Plugin categories',
    singular: 'category',
    description: 'The kind of check a scanner plugin performs.',
    nameHint: 'For example: Secret detection, API security.',
    pluginField: 'category',
  },
  {
    key: 'plugin-interfaces',
    title: 'Interfaces',
    singular: 'interface',
    description: 'How Sentinel talks to a scanner plugin.',
    nameHint: 'For example: CLI, REST API.',
    pluginField: 'interface',
    extraFields: [
      {
        key: 'kind',
        label: 'Plugin asks for',
        options: [
          { value: 'command', label: 'A command with {target}' },
          { value: 'url', label: 'An endpoint URL' },
        ],
      },
    ],
  },
  {
    key: 'licenses',
    title: 'Licenses',
    singular: 'license',
    description: 'The license a scanner plugin is distributed under.',
    nameHint: 'For example: Apache-2.0, MIT, Proprietary.',
    pluginField: 'license',
  },
];

// Badge colours a status can use.
export const STATUS_TONES = [
  { value: 'success', label: 'Green (good)' },
  { value: 'info', label: 'Blue (in progress)' },
  { value: 'warning', label: 'Amber (needs attention)' },
  { value: 'danger', label: 'Red (blocked)' },
  { value: 'neutral', label: 'Grey (neutral)' },
];

// Status categories on the Statuses page. They are fixed because the app uses them; the
// Super Admin manages the statuses inside each one. `builtIn` statuses drive app behaviour
// (for example, a suspended organization cannot sign in), so they can be edited but not deleted.
export const STATUS_CATEGORIES = [
  {
    key: 'organization-statuses',
    title: 'Organization statuses',
    singular: 'organization status',
    description: 'The account state of a customer organization.',
    nameHint: 'For example: Active, Trial, Suspended.',
  },
  {
    key: 'user-statuses',
    title: 'User statuses',
    singular: 'user status',
    description: 'The account state of a person in an organization.',
    nameHint: 'For example: Active, Invited.',
  },
  {
    key: 'integration-statuses',
    title: 'Integration statuses',
    singular: 'integration status',
    description: 'How far the integration of a scanner plugin has come.',
    nameHint: 'For example: Planned, In development, Available.',
  },
].map((category) => ({ ...category, extraFields: [{ key: 'tone', label: 'Badge colour', options: STATUS_TONES }] }));
