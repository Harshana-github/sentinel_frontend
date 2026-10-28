export const SEVERITIES = ['Critical', 'High', 'Medium', 'Low', 'Informational'];

export const SCAN_STATUSES = ['Queued', 'Running', 'Completed', 'Failed', 'Cancelled'];
export const ACTIVE_SCAN_STATUSES = ['Queued', 'Running'];

export const FINDING_STATUSES = ['Open', 'In Progress', 'Resolved', 'False Positive'];
export const OPEN_FINDING_STATUSES = ['Open', 'In Progress'];

export const PROJECT_STATUSES = ['Active', 'On Hold', 'Archived'];
export const PROJECT_ENVIRONMENTS = ['Production', 'Staging', 'Development'];

// Assessment profiles. An assessment scans several targets of one project at once: one scan
// job per target. `types` maps target types to required (blocks the start when the project has
// no ready target of that type), included (selected by default) or optional (not selected by
// default). `scanProfile` is the depth of every job; 'primary' plugins runs one plugin per job.
export const ASSESSMENT_PROFILES = [
  {
    key: 'quick',
    name: 'Quick Scan',
    description: 'Fast checks of websites and hosts. Good for a first look.',
    duration: '~10–20 min',
    scanProfile: 'Quick',
    plugins: 'primary',
    types: { web: 'included', host: 'included' },
  },
  {
    key: 'webapp',
    name: 'Web Application Assessment',
    description: 'The running web application, plus its source code and container image when the project has them.',
    duration: '~1–2 h',
    scanProfile: 'Standard',
    plugins: 'all',
    types: { web: 'required', repository: 'included', container: 'optional' },
  },
  {
    key: 'code',
    name: 'Source Code Assessment',
    description: 'Source code and infrastructure files. No live system is contacted.',
    duration: '~20–60 min',
    scanProfile: 'Standard',
    plugins: 'all',
    types: { repository: 'required', iac: 'included', artifact: 'optional' },
  },
  {
    key: 'full',
    name: 'Full Security Assessment',
    description: 'Every target of the project that an enabled plugin can scan.',
    duration: '~2–6 h',
    scanProfile: 'Deep',
    plugins: 'all',
    types: { web: 'included', repository: 'included', container: 'included', iac: 'included', host: 'included', artifact: 'included' },
  },
];

export const ASSESSMENT_STATUSES = ['Queued', 'Running', 'Completed', 'Completed with errors', 'Failed', 'Cancelled'];

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
  // `fixed` categories hold exactly the statuses Sentinel's workflow uses (PROJECT_STATUSES,
  // SCAN_STATUSES and so on). Their slug is the slug of that value; the Super Admin can only
  // change the name shown, the description and the badge colour.
  {
    key: 'project-statuses',
    title: 'Project statuses',
    singular: 'project status',
    description: 'The state of a project. Archived projects cannot be scanned.',
    fixed: true,
  },
  {
    key: 'scan-statuses',
    title: 'Scan statuses',
    singular: 'scan status',
    description: 'Set by the scan engine as a scan job moves through the queue.',
    fixed: true,
  },
  {
    key: 'assessment-statuses',
    title: 'Assessment statuses',
    singular: 'assessment status',
    description: 'Worked out from the scan jobs of an assessment.',
    fixed: true,
  },
  {
    key: 'finding-statuses',
    title: 'Finding statuses',
    singular: 'finding status',
    description: 'The triage state of a finding. Open and In progress count as open.',
    fixed: true,
  },
].map((category) => ({ ...category, extraFields: [{ key: 'tone', label: 'Badge colour', options: STATUS_TONES }] }));
