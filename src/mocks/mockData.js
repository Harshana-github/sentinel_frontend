// DEMONSTRATION DATA used in mock mode (VITE_USE_MOCK_DATA=true).
// Every organization, person, host and finding here is fictional. Domains use the
// reserved .example TLD and IP addresses come from documentation ranges (RFC 5737).
// Timestamps are relative to page load so the data always looks recent.

const MINUTE = 60_000;
const HOUR = 60;
const DAY = 24 * HOUR;
const pageLoadedAt = Date.now();
const minutesAgo = (minutes) => new Date(pageLoadedAt - minutes * MINUTE).toISOString();

// Demo sign-in accounts, one per panel. Passwords exist only in this mock.
export const demoAccounts = [
  {
    userId: 'usr-000',
    label: 'Super Admin',
    description: 'Sentinel company panel',
    email: 'superadmin@sentinel.local',
    username: 'superadmin',
    password: 'SuperAdmin@123',
  },
  {
    userId: 'usr-001',
    label: 'Organization Admin',
    description: 'Acme Security user panel',
    email: 'alex.morgan@acme.example',
    username: 'admin',
    password: 'Admin@123',
  },
];

// Sentinel company staff. They belong to no customer organization.
export const platformStaff = [
  { id: 'usr-000', name: 'Jordan Lee', email: 'superadmin@sentinel.local', role: 'Super Admin', status: 'Active', lastActiveAt: minutesAgo(15) },
];

// User panel modules, the same for every organization. `builtIn` modules have screens in
// the app, so the Super Admin can rename them but not delete them.
export const featureModules = [
  { key: 'projects', name: 'Projects', description: 'Create projects and manage scan targets.', builtIn: true },
  { key: 'scans', name: 'Scans', description: 'Run security scans and follow their progress.', builtIn: true },
  { key: 'findings', name: 'Findings', description: 'Review and triage vulnerability findings.', builtIn: true },
  { key: 'team', name: 'Users', description: 'See and manage the people in the organization.', builtIn: true },
];

// Permissions belong to a module. The Admin role has all of them. `builtIn` ones are
// checked by the app, so the Super Admin can edit them but not delete them.
export const featurePermissions = [
  { key: 'projects.create', name: 'Create project', description: 'Add a new project.', module: 'projects', builtIn: true },
  { key: 'targets.add', name: 'Add scan target', description: 'Add a target to a project.', module: 'projects', builtIn: true },
  { key: 'scans.start', name: 'Start scan', description: 'Run a new scan on a target.', module: 'scans', builtIn: true },
  { key: 'scans.cancel', name: 'Cancel scan', description: 'Stop a queued or running scan.', module: 'scans', builtIn: true },
  { key: 'findings.update', name: 'Update finding status', description: 'Mark findings as in progress, resolved or ignored.', module: 'findings', builtIn: true },
  { key: 'users.read', name: 'View users', description: 'See the list of users in the organization.', module: 'team', builtIn: true },
  { key: 'users.create', name: 'Create user', description: 'Add or invite a new user.', module: 'team', builtIn: true },
  { key: 'users.update', name: 'Update user', description: "Change a user's name, role or status.", module: 'team', builtIn: true },
  { key: 'users.delete', name: 'Delete user', description: 'Remove a user from the organization.', module: 'team', builtIn: true },
  { key: 'roles.read', name: 'View roles', description: 'See the roles and what each one can do.', module: 'team', builtIn: true },
  { key: 'roles.create', name: 'Create role', description: 'Add a new role.', module: 'team', builtIn: true },
  { key: 'roles.update', name: 'Update role', description: "Rename a role or change its permissions.", module: 'team', builtIn: true },
  { key: 'roles.delete', name: 'Delete role', description: 'Remove a role that nobody has.', module: 'team', builtIn: true },
];

// Product and software development company details, shown on the login page, in the
// sidebar and in the browser tab. Images are data URLs; a real backend would keep them in
// object storage and return URLs. `null` means "use the built-in default".
export const branding = {
  productName: 'Sentinel',
  tagline: 'AI Vulnerability Scanner',
  favicon: null,
  productLogo: null,
  company: {
    name: 'Example Software (Pvt) Ltd',
    logo: null,
    email: 'hello@company.example',
    phone: '+94 11 234 5678',
    website: 'https://www.company.example',
    address: '42 Example Road, Colombo 03, Sri Lanka',
  },
};

export const organizations = [
  {
    id: 'org-acme',
    slug: 'acme-security',
    name: 'Acme Security',
    status: 'active',
    contactEmail: 'security@acme.example',
    description: 'Security consultancy running assessments for its own products and clients.',
    createdAt: minutesAgo(420 * DAY),
  },
  {
    id: 'org-technova',
    slug: 'technova-solutions',
    name: 'TechNova Solutions',
    status: 'active',
    contactEmail: 'it-security@technova.example',
    description: 'Builds customer portals and mobile banking software.',
    createdAt: minutesAgo(260 * DAY),
  },
  {
    id: 'org-securecloud',
    slug: 'securecloud',
    name: 'SecureCloud Ltd',
    status: 'active',
    contactEmail: 'secops@securecloud.example',
    description: 'Managed cloud hosting provider with a public API platform.',
    createdAt: minutesAgo(190 * DAY),
  },
  {
    id: 'org-northwind',
    slug: 'northwind-retail',
    name: 'Northwind Retail',
    status: 'trial',
    contactEmail: 'web@northwind.example',
    description: 'Online retailer evaluating the platform during a 30-day trial.',
    createdAt: minutesAgo(12 * DAY),
  },
  {
    id: 'org-bluepeak',
    slug: 'bluepeak-logistics',
    name: 'BluePeak Logistics',
    status: 'suspended',
    contactEmail: 'admin@bluepeak.example',
    description: 'Account suspended after the trial ended.',
    createdAt: minutesAgo(95 * DAY),
  },
];

// Roles belong to one organization. Every organization has the system role `admin`, which
// always has every permission and cannot be changed. The other roles are created and edited
// by the organization itself; these are the ones the demo organizations start with.
export const ADMIN_ROLE_SLUG = 'admin';
const starterRoles = [
  { slug: 'security-analyst', name: 'Security Analyst', description: 'Runs scans and triages findings.', permissions: ['targets.add', 'scans.start', 'scans.cancel', 'findings.update', 'users.read'] },
  { slug: 'developer', name: 'Developer', description: 'Starts scans and fixes findings.', permissions: ['scans.start', 'findings.update', 'users.read'] },
  { slug: 'viewer', name: 'Viewer', description: 'Read-only access.', permissions: ['users.read'] },
];

export function adminRole(organizationId) {
  return {
    id: `${organizationId}:${ADMIN_ROLE_SLUG}`,
    organizationId,
    slug: ADMIN_ROLE_SLUG,
    name: 'Admin',
    description: 'Full access to every module and permission. Predefined by the system.',
    permissions: [],
    system: true,
  };
}

export const roles = ['org-acme', 'org-technova', 'org-securecloud', 'org-northwind', 'org-bluepeak'].flatMap((organizationId) => [
  adminRole(organizationId),
  ...starterRoles.map((role) => ({ ...role, id: `${organizationId}:${role.slug}`, organizationId, system: false })),
]);

// `role` is the slug of one of the organization's roles.
export const members = [
  { id: 'usr-001', organizationId: 'org-acme', name: 'Alex Morgan', email: 'alex.morgan@acme.example', role: 'admin', status: 'active', lastActiveAt: minutesAgo(5) },
  { id: 'usr-002', organizationId: 'org-acme', name: 'Priya Raman', email: 'priya.raman@acme.example', role: 'security-analyst', status: 'active', lastActiveAt: minutesAgo(3 * HOUR) },
  { id: 'usr-003', organizationId: 'org-acme', name: 'Daniel Okafor', email: 'daniel.okafor@acme.example', role: 'developer', status: 'active', lastActiveAt: minutesAgo(2 * DAY) },
  { id: 'usr-004', organizationId: 'org-acme', name: 'Mei Lin', email: 'mei.lin@acme.example', role: 'viewer', status: 'invited', lastActiveAt: null },
  { id: 'usr-005', organizationId: 'org-technova', name: 'Sofia Alvarez', email: 'sofia.alvarez@technova.example', role: 'admin', status: 'active', lastActiveAt: minutesAgo(1 * DAY) },
  { id: 'usr-006', organizationId: 'org-technova', name: 'Kasun Perera', email: 'kasun.perera@technova.example', role: 'security-analyst', status: 'active', lastActiveAt: minutesAgo(40) },
  { id: 'usr-007', organizationId: 'org-technova', name: 'James Whitfield', email: 'james.whitfield@technova.example', role: 'developer', status: 'active', lastActiveAt: minutesAgo(6 * HOUR) },
  { id: 'usr-008', organizationId: 'org-technova', name: 'Aisha Bello', email: 'aisha.bello@technova.example', role: 'developer', status: 'active', lastActiveAt: minutesAgo(4 * DAY) },
  { id: 'usr-009', organizationId: 'org-securecloud', name: "Liam O'Connor", email: 'liam.oconnor@securecloud.example', role: 'admin', status: 'active', lastActiveAt: minutesAgo(9 * HOUR) },
  { id: 'usr-010', organizationId: 'org-securecloud', name: 'Nimali Fernando', email: 'nimali.fernando@securecloud.example', role: 'security-analyst', status: 'active', lastActiveAt: minutesAgo(25) },
  { id: 'usr-011', organizationId: 'org-securecloud', name: 'Tom Becker', email: 'tom.becker@securecloud.example', role: 'admin', status: 'active', lastActiveAt: minutesAgo(3 * DAY) },
  { id: 'usr-012', organizationId: 'org-northwind', name: 'Grace Kim', email: 'grace.kim@northwind.example', role: 'admin', status: 'active', lastActiveAt: minutesAgo(2 * HOUR) },
  { id: 'usr-013', organizationId: 'org-bluepeak', name: 'Omar Haddad', email: 'omar.haddad@bluepeak.example', role: 'admin', status: 'active', lastActiveAt: minutesAgo(40 * DAY) },
];

export const projects = [
  {
    id: 'prj-001',
    code: 'WEB',
    name: 'Main Website',
    organizationId: 'org-acme',
    description: 'Public marketing website and blog.',
    environment: 'Production',
    status: 'Active',
    owner: 'Priya Raman',
    createdAt: minutesAgo(180 * DAY),
    targets: [
      { id: 'tgt-001', name: 'Public website', type: 'web', value: 'https://www.acme.example', createdAt: minutesAgo(180 * DAY) },
      { id: 'tgt-002', name: 'Web server host', type: 'host', value: 'www.acme.example', createdAt: minutesAgo(2 * DAY + 5) },
    ],
  },
  {
    id: 'prj-002',
    code: 'PORTAL',
    name: 'Customer Portal',
    organizationId: 'org-technova',
    description: 'Self-service portal where customers manage accounts and invoices.',
    environment: 'Production',
    status: 'Active',
    owner: 'Kasun Perera',
    createdAt: minutesAgo(150 * DAY),
    targets: [
      { id: 'tgt-003', name: 'Portal web app', type: 'web', value: 'https://portal.technova.example', createdAt: minutesAgo(150 * DAY) },
      { id: 'tgt-004', name: 'Portal source code', type: 'repository', value: 'https://github.com/technova-demo/customer-portal', createdAt: minutesAgo(150 * DAY) },
      { id: 'tgt-005', name: 'Portal API image', type: 'container', value: 'registry.technova.example/portal-api:2.4.1', createdAt: minutesAgo(90 * DAY) },
    ],
  },
  {
    id: 'prj-003',
    code: 'API',
    name: 'API Security Assessment',
    organizationId: 'org-securecloud',
    description: 'Quarterly assessment of the public REST API before release.',
    environment: 'Staging',
    status: 'Active',
    owner: 'Nimali Fernando',
    createdAt: minutesAgo(60 * DAY),
    targets: [
      { id: 'tgt-006', name: 'Public REST API', type: 'web', value: 'https://api.staging.securecloud.example/v2', createdAt: minutesAgo(60 * DAY) },
      { id: 'tgt-007', name: 'API gateway source', type: 'repository', value: 'https://gitlab.com/securecloud-demo/api-gateway', createdAt: minutesAgo(60 * DAY) },
    ],
  },
  {
    id: 'prj-004',
    code: 'CLOUD-IAC',
    name: 'Cloud Platform IaC',
    organizationId: 'org-securecloud',
    description: 'Terraform modules and network edge for the hosting platform.',
    environment: 'Production',
    status: 'Active',
    owner: 'Tom Becker',
    createdAt: minutesAgo(110 * DAY),
    targets: [
      { id: 'tgt-008', name: 'Terraform platform modules', type: 'iac', value: 'https://github.com/securecloud-demo/terraform-platform', createdAt: minutesAgo(110 * DAY) },
      { id: 'tgt-009', name: 'Edge load balancer', type: 'host', value: '203.0.113.16', createdAt: minutesAgo(100 * DAY) },
    ],
  },
  {
    id: 'prj-005',
    code: 'MOBILE-API',
    name: 'Mobile Banking Backend',
    organizationId: 'org-technova',
    description: 'Payment and gateway services behind the mobile banking app.',
    environment: 'Staging',
    status: 'On Hold',
    owner: 'James Whitfield',
    createdAt: minutesAgo(45 * DAY),
    targets: [
      { id: 'tgt-010', name: 'Payments service build', type: 'artifact', value: 'payments-service-1.8.0.jar', createdAt: minutesAgo(45 * DAY) },
      { id: 'tgt-011', name: 'Mobile gateway image', type: 'container', value: 'registry.technova.example/mobile-gateway:1.2.0', createdAt: minutesAgo(45 * DAY) },
    ],
  },
  {
    id: 'prj-006',
    code: 'INTRANET',
    name: 'Legacy Intranet',
    organizationId: 'org-acme',
    description: 'Old intranet server, decommissioned in favour of the new portal.',
    environment: 'Development',
    status: 'Archived',
    owner: 'Daniel Okafor',
    createdAt: minutesAgo(400 * DAY),
    targets: [
      // The mock scan engine fails scans for any target whose value contains "unreachable".
      { id: 'tgt-012', name: 'Legacy intranet server', type: 'host', value: 'unreachable.intranet.acme.example', createdAt: minutesAgo(400 * DAY) },
    ],
  },
  {
    id: 'prj-007',
    code: 'STORE',
    name: 'Online Storefront',
    organizationId: 'org-northwind',
    description: 'Customer-facing shop evaluated during the trial.',
    environment: 'Production',
    status: 'Active',
    owner: 'Grace Kim',
    createdAt: minutesAgo(11 * DAY),
    targets: [
      { id: 'tgt-013', name: 'Storefront', type: 'web', value: 'https://shop.northwind.example', createdAt: minutesAgo(11 * DAY) },
    ],
  },
];

// Scanner integrations planned for the platform. None of these engines runs in the
// browser: in mock mode, scans and their findings are simulated.
// Master data: where a scanner plugin comes from. The Super Admin manages this list.
export const pluginSources = [
  { id: 'open-source', name: 'Open source', description: 'Public tool, e.g. Trivy' },
  { id: 'in-house', name: 'In-house', description: 'Built by our company' },
];

// Master data: the kind of check a scanner plugin performs.
export const pluginCategories = [
  { id: 'dast', name: 'DAST', description: 'Tests running web applications from the outside.' },
  { id: 'vulnerability-misconfiguration', name: 'Vulnerability & misconfiguration', description: 'Finds vulnerable packages and insecure settings.' },
  { id: 'secret-detection', name: 'Secret detection', description: 'Finds keys, passwords and tokens in code.' },
  { id: 'iac-security', name: 'IaC security', description: 'Checks Terraform, Kubernetes and similar files.' },
  { id: 'sbom-generation', name: 'SBOM generation', description: 'Lists the packages inside software.' },
  { id: 'vulnerability-scanning', name: 'Vulnerability scanning', description: 'Matches packages against known vulnerabilities.' },
  { id: 'network-discovery', name: 'Network discovery', description: 'Finds hosts, open ports and services.' },
  { id: 'tls-ssl-security', name: 'TLS/SSL security', description: 'Checks certificates and encryption settings.' },
  { id: 'api-security', name: 'API security', description: 'Tests REST and GraphQL APIs.' },
];

// Master data: what can be scanned. Ids are stored on project targets and plugins.
export const targetTypes = [
  { id: 'web', name: 'Web application', description: 'A running website or web app.', placeholder: 'https://app.example.com', format: 'url' },
  { id: 'repository', name: 'Source code repository', description: 'A Git repository.', placeholder: 'https://github.com/org/repo', format: 'url' },
  { id: 'container', name: 'Container image', description: 'A Docker or OCI image.', placeholder: 'registry.example.com/app:1.0.0', format: 'text' },
  { id: 'iac', name: 'Infrastructure as Code', description: 'Terraform, Kubernetes or CloudFormation files.', placeholder: 'https://github.com/org/terraform', format: 'url' },
  { id: 'host', name: 'Network / host', description: 'An IP address or host name.', placeholder: '192.0.2.10 or host.example.com', format: 'text' },
  { id: 'artifact', name: 'Application artifact', description: 'A built file such as a JAR or APK.', placeholder: 'service-1.0.0.jar', format: 'text' },
];

// Master data: how Sentinel runs a plugin. `kind` decides what the plugin form asks for.
export const pluginInterfaces = [
  { id: 'cli', name: 'CLI', description: 'Runs a command inside the container.', kind: 'command' },
  { id: 'rest-api', name: 'REST API', description: 'Sends the target to an HTTP endpoint.', kind: 'url' },
];

export const licenses = [
  { id: 'apache-2-0', name: 'Apache-2.0', description: 'Permissive open-source license.' },
  { id: 'mit', name: 'MIT', description: 'Permissive open-source license.' },
  { id: 'gpl-2-0', name: 'GPL-2.0', description: 'Copyleft open-source license.' },
  { id: 'proprietary', name: 'Proprietary', description: 'Owned by the company. Not open source.' },
];

// Status categories (see STATUS_CATEGORIES). `builtIn` statuses are used by the app's logic.
export const organizationStatuses = [
  { id: 'active', name: 'Active', description: 'Paying customer with full access.', tone: 'success', builtIn: true },
  { id: 'trial', name: 'Trial', description: 'Evaluating the platform.', tone: 'info', builtIn: true },
  { id: 'suspended', name: 'Suspended', description: 'Users cannot sign in.', tone: 'danger', builtIn: true },
];

export const userStatuses = [
  { id: 'active', name: 'Active', description: 'Has signed in at least once.', tone: 'success', builtIn: true },
  { id: 'invited', name: 'Invited', description: 'Account created, not signed in yet.', tone: 'warning', builtIn: true },
];

export const integrationStatuses = [
  { id: 'planned', name: 'Planned', description: 'Not started yet.', tone: 'neutral' },
  { id: 'in-development', name: 'In development', description: 'Being built and tested.', tone: 'info' },
  { id: 'available', name: 'Available', description: 'Ready to use in scans.', tone: 'success' },
];

// Scanner plugins. `source`, `category`, `targetTypes`, `interface`, `license` and
// `integrationStatus` hold master data ids. Open-source tools and the company's in-house tools are registered the
// same way: a container image plus a CLI command (with a {target} placeholder) or a REST endpoint.
export const scannerModules = [
  {
    id: 'zap',
    name: 'OWASP ZAP',
    version: '2.15.0',
    source: 'open-source',
    category: 'dast',
    purpose: 'Finds vulnerabilities in running web applications, such as XSS, SQL injection and missing security headers.',
    targetTypes: ['web'],
    image: 'zaproxy/zap-stable',
    license: 'apache-2-0',
    integrationStatus: 'in-development',
    interface: 'cli',
    command: 'zap-baseline.py -t {target} -J report.json',
    enabled: true,
  },
  {
    id: 'trivy',
    name: 'Trivy',
    version: '0.56.2',
    source: 'open-source',
    category: 'vulnerability-misconfiguration',
    purpose: 'Finds vulnerable packages and misconfigurations in images, repositories, filesystems and IaC.',
    targetTypes: ['repository', 'container', 'iac', 'artifact'],
    image: 'aquasec/trivy',
    license: 'apache-2-0',
    integrationStatus: 'in-development',
    interface: 'cli',
    command: 'trivy fs --format json {target}',
    enabled: true,
  },
  {
    id: 'gitleaks',
    name: 'Gitleaks',
    version: '8.21.2',
    source: 'open-source',
    category: 'secret-detection',
    purpose: 'Detects API keys, passwords and private keys in source code and git history.',
    targetTypes: ['repository'],
    image: 'zricethezav/gitleaks',
    license: 'mit',
    integrationStatus: 'planned',
    interface: 'cli',
    command: 'gitleaks detect --source {target} --report-format json',
    enabled: true,
  },
  {
    id: 'checkov',
    name: 'Checkov',
    version: '3.2.300',
    source: 'open-source',
    category: 'iac-security',
    purpose: 'Detects security and compliance issues in Terraform, Kubernetes and CloudFormation.',
    targetTypes: ['iac'],
    image: 'bridgecrew/checkov',
    license: 'apache-2-0',
    integrationStatus: 'planned',
    interface: 'cli',
    command: 'checkov -d {target} -o json',
    enabled: true,
  },
  {
    id: 'syft',
    name: 'Syft',
    version: '1.16.0',
    source: 'open-source',
    category: 'sbom-generation',
    purpose: 'Generates a software bill of materials (SBOM) listing packages, versions and licenses.',
    targetTypes: ['repository', 'container', 'artifact'],
    image: 'anchore/syft',
    license: 'apache-2-0',
    integrationStatus: 'planned',
    interface: 'cli',
    command: 'syft {target} -o json',
    enabled: true,
  },
  {
    id: 'grype',
    name: 'Grype',
    version: '0.84.0',
    source: 'open-source',
    category: 'vulnerability-scanning',
    purpose: 'Matches packages (often from a Syft SBOM) against known vulnerability databases.',
    targetTypes: ['repository', 'container', 'artifact'],
    image: 'anchore/grype',
    license: 'apache-2-0',
    integrationStatus: 'planned',
    interface: 'cli',
    command: 'grype {target} -o json',
    enabled: true,
  },
  {
    id: 'naabu',
    name: 'Naabu',
    category: 'network-discovery',
    purpose: 'Discovers open TCP ports and exposed services on hosts and network ranges.',
    targetTypes: ['web', 'host'],
    image: 'projectdiscovery/naabu',
    license: 'mit',
    integrationStatus: 'planned',
  },
  {
    id: 'testssl',
    name: 'testssl.sh',
    category: 'tls-ssl-security',
    purpose: 'Checks TLS protocol versions, cipher suites, certificates and related headers.',
    targetTypes: ['web', 'host'],
    image: 'drwetter/testssl.sh',
    license: 'gpl-2-0',
    integrationStatus: 'planned',
  },
  {
    id: 'internal-api-fuzzer',
    name: 'Internal API Fuzzer',
    version: '1.2.0',
    source: 'in-house',
    category: 'api-security',
    purpose: 'Company-built fuzzer that sends malformed requests to REST APIs and reports crashes and data leaks.',
    targetTypes: ['web'],
    image: 'registry.internal.example/security/api-fuzzer',
    license: 'proprietary',
    integrationStatus: 'in-development',
    interface: 'rest-api',
    command: 'https://scanner.internal.example/v1/scan',
    enabled: true,
  },
];

// Templates the mock scan engine uses to create findings. The evidence text is
// clearly marked as demonstration output, not real scanner output.
export const findingTemplates = [
  {
    id: 'zap-sqli', scanner: 'zap', severity: 'Critical', cwe: 'CWE-89',
    title: 'SQL injection in search parameter',
    location: 'GET /search?q=',
    description: 'User input in the "q" parameter is concatenated into a SQL query. An attacker can read or modify database records.',
    remediation: 'Use parameterised queries or an ORM for all database access and validate the input length and type.',
    evidence: "Request GET /search?q=test'-- returned HTTP 500 with a database syntax error in the response body.",
  },
  {
    id: 'zap-xss', scanner: 'zap', severity: 'High', cwe: 'CWE-79',
    title: 'Reflected cross-site scripting (XSS)',
    location: 'GET /products?category=',
    description: 'The "category" parameter is reflected in the page without output encoding, so injected script runs in the victim\'s browser.',
    remediation: 'Encode output for the HTML context and add a restrictive Content Security Policy.',
    evidence: 'Payload <script>alert(1)</script> in "category" was returned unencoded in the HTML response.',
  },
  {
    id: 'zap-csp', scanner: 'zap', severity: 'Medium', cwe: 'CWE-693',
    title: 'Content Security Policy header not set',
    location: 'All pages',
    description: 'Responses do not include a Content-Security-Policy header, which weakens protection against XSS and data injection.',
    remediation: "Add a Content-Security-Policy header that restricts script sources, starting with default-src 'self'.",
    evidence: 'No Content-Security-Policy header found on 42 of 42 crawled pages.',
  },
  {
    id: 'zap-cookie', scanner: 'zap', severity: 'Low', cwe: 'CWE-1275',
    title: 'Session cookie without SameSite attribute',
    location: 'Set-Cookie: session_id',
    description: 'The session cookie is sent on cross-site requests, which can help cross-site request forgery attacks.',
    remediation: 'Set SameSite=Lax (or Strict) together with the Secure and HttpOnly flags.',
    evidence: 'Set-Cookie: session_id=…; Path=/; HttpOnly (no SameSite attribute).',
  },
  {
    id: 'zap-server-header', scanner: 'zap', severity: 'Low', cwe: 'CWE-200',
    title: 'Server version disclosed in response headers',
    location: 'Server header',
    description: 'The Server header reveals the web server product and version, which helps attackers pick known exploits.',
    remediation: 'Remove or genericise the Server and X-Powered-By headers.',
    evidence: 'Server: nginx/1.18.0',
  },
  {
    id: 'trivy-xcrypto', scanner: 'trivy', severity: 'Critical', cve: 'CVE-2024-45337', cwe: 'CWE-285',
    title: 'golang.org/x/crypto: misuse of ServerConfig.PublicKeyCallback may cause authorization bypass',
    location: 'go.mod: golang.org/x/crypto v0.25.0',
    description: 'Applications using PublicKeyCallback incorrectly may authorise the wrong key. Fixed in v0.31.0.',
    remediation: 'Upgrade golang.org/x/crypto to v0.31.0 or later.',
    evidence: 'Installed version v0.25.0, fixed version v0.31.0.',
  },
  {
    id: 'trivy-http2', scanner: 'trivy', severity: 'High', cve: 'CVE-2023-44487', cwe: 'CWE-400',
    title: 'HTTP/2 Rapid Reset denial of service (nghttp2)',
    location: 'OS package: libnghttp2-14 1.43.0-1',
    description: 'A client can reset many HTTP/2 streams quickly and exhaust server resources.',
    remediation: 'Rebuild the image on an updated base image that ships a patched nghttp2.',
    evidence: 'Installed version 1.43.0-1, fixed version 1.43.0-1+deb11u1.',
  },
  {
    id: 'trivy-root-user', scanner: 'trivy', severity: 'Medium', cwe: 'CWE-250',
    title: 'Image runs as the root user',
    location: 'Dockerfile',
    description: 'No USER instruction is set, so the container process runs as root.',
    remediation: 'Add a non-root USER instruction to the Dockerfile.',
    evidence: 'Dockerfile has no USER instruction (rule DS002).',
  },
  {
    id: 'gitleaks-aws-key', scanner: 'gitleaks', severity: 'Critical', cwe: 'CWE-798',
    title: 'AWS access key committed to repository',
    location: 'config/settings.py:42',
    description: 'An AWS access key ID and secret are hard-coded in a committed file.',
    remediation: 'Revoke the key in AWS IAM now, remove it from git history and load credentials from a secret store.',
    evidence: 'Rule aws-access-token matched AKIA**************** (value redacted in the demo).',
  },
  {
    id: 'gitleaks-api-key', scanner: 'gitleaks', severity: 'High', cwe: 'CWE-798',
    title: 'Generic API key found in configuration file',
    location: '.env.production:7',
    description: 'A third-party API key is stored in a committed environment file.',
    remediation: 'Rotate the key, delete the file from the repository and add it to .gitignore.',
    evidence: 'Rule generic-api-key matched PAYMENT_API_KEY=sk_live_************ (value redacted in the demo).',
  },
  {
    id: 'gitleaks-private-key', scanner: 'gitleaks', severity: 'High', cwe: 'CWE-321',
    title: 'RSA private key found in git history',
    location: 'deploy/keys/id_rsa (commit 4f2a9c1)',
    description: 'A private key was committed and later deleted, but it is still present in git history.',
    remediation: 'Treat the key as compromised: replace it everywhere and rewrite history to remove it.',
    evidence: 'Rule private-key matched "-----BEGIN RSA PRIVATE KEY-----" in commit 4f2a9c1.',
  },
  {
    id: 'checkov-s3-public', scanner: 'checkov', severity: 'High', cwe: 'CWE-284',
    title: 'S3 bucket allows public read access',
    location: 'modules/storage/main.tf:18',
    description: 'The bucket ACL grants public-read, so anyone can list and download its objects.',
    remediation: 'Set the ACL to private and enable an S3 Block Public Access configuration.',
    evidence: 'Check CKV_AWS_20 failed for resource aws_s3_bucket.assets.',
  },
  {
    id: 'checkov-sg-ssh', scanner: 'checkov', severity: 'High', cwe: 'CWE-284',
    title: 'Security group allows SSH from 0.0.0.0/0',
    location: 'modules/network/security_groups.tf:31',
    description: 'Port 22 is open to the whole internet.',
    remediation: 'Limit SSH ingress to a VPN or bastion CIDR, or use a session manager instead of SSH.',
    evidence: 'Check CKV_AWS_24 failed for resource aws_security_group.bastion.',
  },
  {
    id: 'checkov-k8s-root', scanner: 'checkov', severity: 'Medium', cwe: 'CWE-250',
    title: 'Kubernetes container may run as root',
    location: 'k8s/api-deployment.yaml:24',
    description: 'The pod security context does not prevent containers from running as root.',
    remediation: 'Set runAsNonRoot: true and a non-zero runAsUser in the security context.',
    evidence: 'Check CKV_K8S_23 failed for Deployment api.',
  },
  {
    id: 'checkov-rds-encryption', scanner: 'checkov', severity: 'Medium', cwe: 'CWE-311',
    title: 'RDS instance storage is not encrypted',
    location: 'modules/database/main.tf:9',
    description: 'Database storage and snapshots are stored unencrypted.',
    remediation: 'Set storage_encrypted = true and use a KMS key. Existing instances must be migrated.',
    evidence: 'Check CKV_AWS_16 failed for resource aws_db_instance.main.',
  },
  {
    id: 'syft-sbom', scanner: 'syft', severity: 'Informational',
    title: 'Software bill of materials generated',
    location: 'SBOM (SPDX JSON)',
    description: 'An SBOM listing the packages and licenses was generated for this target.',
    remediation: 'No action needed. Keep the SBOM with the release for supply-chain tracking.',
    evidence: '412 packages catalogued across npm, Go modules and Debian packages.',
  },
  {
    id: 'syft-license', scanner: 'syft', severity: 'Low',
    title: 'Package with unknown license detected',
    location: 'node_modules/legacy-date-utils',
    description: 'A dependency does not declare a license, so its usage terms are unclear.',
    remediation: 'Confirm the license with the maintainer or replace the package.',
    evidence: 'Package legacy-date-utils@0.4.2 has no license metadata.',
  },
  {
    id: 'grype-log4shell', scanner: 'grype', severity: 'Critical', cve: 'CVE-2021-44228', cwe: 'CWE-502',
    title: 'Log4Shell remote code execution in log4j-core',
    location: 'log4j-core 2.14.1',
    description: 'JNDI lookups in log messages allow remote code execution.',
    remediation: 'Upgrade log4j-core to 2.17.1 or later.',
    evidence: 'Installed version 2.14.1, fixed version 2.17.1.',
  },
  {
    id: 'grype-spring4shell', scanner: 'grype', severity: 'Critical', cve: 'CVE-2022-22965', cwe: 'CWE-94',
    title: 'Spring Framework remote code execution (Spring4Shell)',
    location: 'spring-beans 5.3.17',
    description: 'Data binding on JDK 9+ can allow remote code execution.',
    remediation: 'Upgrade Spring Framework to 5.3.18 or later.',
    evidence: 'Installed version 5.3.17, fixed version 5.3.18.',
  },
  {
    id: 'grype-lodash', scanner: 'grype', severity: 'High', cve: 'CVE-2020-8203', cwe: 'CWE-1321',
    title: 'Prototype pollution in lodash',
    location: 'lodash 4.17.15',
    description: 'zipObjectDeep can be abused to modify Object.prototype.',
    remediation: 'Upgrade lodash to 4.17.20 or later.',
    evidence: 'Installed version 4.17.15, fixed version 4.17.20.',
  },
  {
    id: 'naabu-ssh', scanner: 'naabu', severity: 'Medium', cwe: 'CWE-200',
    title: 'SSH (22/tcp) exposed to the internet',
    location: '22/tcp',
    description: 'The SSH service is reachable from the internet and attracts brute-force attempts.',
    remediation: 'Restrict SSH to trusted networks or a VPN.',
    evidence: 'Port 22/tcp open.',
  },
  {
    id: 'naabu-mysql', scanner: 'naabu', severity: 'High', cwe: 'CWE-200',
    title: 'MySQL (3306/tcp) exposed to the internet',
    location: '3306/tcp',
    description: 'The database port is publicly reachable.',
    remediation: 'Block 3306/tcp at the firewall and allow only application servers.',
    evidence: 'Port 3306/tcp open.',
  },
  {
    id: 'naabu-alt-http', scanner: 'naabu', severity: 'Low',
    title: 'Alternate HTTP port (8080/tcp) open',
    location: '8080/tcp',
    description: 'An extra HTTP service is listening, possibly an admin or debug interface.',
    remediation: 'Confirm the service is needed. Close the port if it is not.',
    evidence: 'Port 8080/tcp open.',
  },
  {
    id: 'testssl-legacy-tls', scanner: 'testssl', severity: 'Medium', cwe: 'CWE-327',
    title: 'TLS 1.0 and TLS 1.1 are enabled',
    location: '443/tcp',
    description: 'Deprecated protocol versions with known weaknesses are still offered.',
    remediation: 'Disable TLS 1.0 and 1.1. Offer only TLS 1.2 and TLS 1.3.',
    evidence: 'TLS 1.0 offered (deprecated), TLS 1.1 offered (deprecated).',
  },
  {
    id: 'testssl-weak-ciphers', scanner: 'testssl', severity: 'Medium', cwe: 'CWE-327',
    title: 'Weak cipher suites supported',
    location: '443/tcp',
    description: 'The server accepts CBC-mode and 3DES cipher suites.',
    remediation: 'Allow only AEAD cipher suites (AES-GCM, ChaCha20-Poly1305).',
    evidence: 'Offered: TLS_RSA_WITH_3DES_EDE_CBC_SHA, TLS_RSA_WITH_AES_128_CBC_SHA.',
  },
  {
    id: 'testssl-hsts', scanner: 'testssl', severity: 'Low', cwe: 'CWE-319',
    title: 'HTTP Strict Transport Security (HSTS) not set',
    location: '443/tcp',
    description: 'Browsers can be downgraded to plain HTTP on the first visit.',
    remediation: 'Send Strict-Transport-Security: max-age=31536000; includeSubDomains.',
    evidence: 'No Strict-Transport-Security header.',
  },
  {
    id: 'testssl-cert-expiry', scanner: 'testssl', severity: 'Low',
    title: 'TLS certificate expires within 30 days',
    location: '443/tcp',
    description: 'The certificate will expire soon and cause browser errors.',
    remediation: 'Renew the certificate or enable automatic renewal.',
    evidence: 'Certificate valid until 21 days from scan date.',
  },
  {
    id: 'testssl-tls13', scanner: 'testssl', severity: 'Informational',
    title: 'TLS 1.3 is supported',
    location: '443/tcp',
    description: 'The server offers TLS 1.3.',
    remediation: 'No action needed.',
    evidence: 'TLS 1.3 offered (OK).',
  },
];

// `durationMs` is how long the mock engine takes to run the scan.
export const scans = [
  {
    id: 'SCN-1001', projectId: 'prj-001', targetId: 'tgt-001', profile: 'Standard', tools: ['zap', 'naabu', 'testssl'],
    status: 'Completed', progress: 100, initiatedBy: 'Priya Raman', errorMessage: null, durationMs: 38 * MINUTE,
    createdAt: minutesAgo(3 * DAY + 2), startedAt: minutesAgo(3 * DAY), finishedAt: minutesAgo(3 * DAY - 38),
  },
  {
    id: 'SCN-1002', projectId: 'prj-001', targetId: 'tgt-002', profile: 'Quick', tools: ['naabu', 'testssl'],
    status: 'Completed', progress: 100, initiatedBy: 'Alex Morgan', errorMessage: null, durationMs: 9 * MINUTE,
    createdAt: minutesAgo(2 * DAY + 1), startedAt: minutesAgo(2 * DAY), finishedAt: minutesAgo(2 * DAY - 9),
  },
  {
    id: 'SCN-1003', projectId: 'prj-002', targetId: 'tgt-004', profile: 'Standard', tools: ['gitleaks', 'trivy', 'syft', 'grype'],
    status: 'Completed', progress: 100, initiatedBy: 'Kasun Perera', errorMessage: null, durationMs: 14 * MINUTE,
    createdAt: minutesAgo(30 * HOUR + 1), startedAt: minutesAgo(30 * HOUR), finishedAt: minutesAgo(30 * HOUR - 14),
  },
  {
    id: 'SCN-1004', projectId: 'prj-002', targetId: 'tgt-005', profile: 'Quick', tools: ['trivy', 'syft', 'grype'],
    status: 'Completed', progress: 100, initiatedBy: 'Kasun Perera', errorMessage: null, durationMs: 6 * MINUTE,
    createdAt: minutesAgo(20 * HOUR + 1), startedAt: minutesAgo(20 * HOUR), finishedAt: minutesAgo(20 * HOUR - 6),
  },
  {
    id: 'SCN-1005', projectId: 'prj-003', targetId: 'tgt-006', profile: 'Deep', tools: ['zap', 'naabu', 'testssl'],
    status: 'Running', progress: 20, initiatedBy: 'Nimali Fernando', errorMessage: null, durationMs: 30 * MINUTE,
    createdAt: minutesAgo(7), startedAt: minutesAgo(6), finishedAt: null,
  },
  {
    id: 'SCN-1006', projectId: 'prj-003', targetId: 'tgt-007', profile: 'Standard', tools: ['gitleaks', 'trivy', 'grype'],
    status: 'Completed', progress: 100, initiatedBy: 'Nimali Fernando', errorMessage: null, durationMs: 11 * MINUTE,
    createdAt: minutesAgo(9 * HOUR + 1), startedAt: minutesAgo(9 * HOUR), finishedAt: minutesAgo(9 * HOUR - 11),
  },
  {
    id: 'SCN-1007', projectId: 'prj-004', targetId: 'tgt-008', profile: 'Standard', tools: ['checkov', 'trivy'],
    status: 'Completed', progress: 100, initiatedBy: 'Tom Becker', errorMessage: null, durationMs: 5 * MINUTE,
    createdAt: minutesAgo(4 * DAY + 1), startedAt: minutesAgo(4 * DAY), finishedAt: minutesAgo(4 * DAY - 5),
  },
  {
    id: 'SCN-1008', projectId: 'prj-006', targetId: 'tgt-012', profile: 'Quick', tools: ['naabu', 'testssl'],
    status: 'Failed', progress: 30, initiatedBy: 'Daniel Okafor', durationMs: 10 * MINUTE,
    errorMessage: 'Target unreachable: connection to unreachable.intranet.acme.example timed out after 30 seconds (naabu).',
    createdAt: minutesAgo(5 * DAY + 1), startedAt: minutesAgo(5 * DAY), finishedAt: minutesAgo(5 * DAY - 3),
  },
  {
    id: 'SCN-1009', projectId: 'prj-005', targetId: 'tgt-010', profile: 'Deep', tools: ['trivy', 'syft', 'grype'],
    status: 'Cancelled', progress: 42, initiatedBy: 'James Whitfield', errorMessage: null, durationMs: 40 * MINUTE,
    createdAt: minutesAgo(6 * DAY + 1), startedAt: minutesAgo(6 * DAY), finishedAt: minutesAgo(6 * DAY - 17),
  },
  {
    id: 'SCN-1010', projectId: 'prj-007', targetId: 'tgt-013', profile: 'Standard', tools: ['zap', 'testssl'],
    status: 'Completed', progress: 100, initiatedBy: 'Grace Kim', errorMessage: null, durationMs: 27 * MINUTE,
    createdAt: minutesAgo(7 * DAY + 1), startedAt: minutesAgo(7 * DAY), finishedAt: minutesAgo(7 * DAY - 27),
  },
  {
    id: 'SCN-1011', projectId: 'prj-004', targetId: 'tgt-009', profile: 'Quick', tools: ['naabu', 'testssl'],
    status: 'Completed', progress: 100, initiatedBy: 'Tom Becker', errorMessage: null, durationMs: 8 * MINUTE,
    createdAt: minutesAgo(10 * DAY + 1), startedAt: minutesAgo(10 * DAY), finishedAt: minutesAgo(10 * DAY - 8),
  },
  {
    // Queued at page load, so a scan starts and finishes in front of you during the demo.
    id: 'SCN-1012', projectId: 'prj-001', targetId: 'tgt-001', profile: 'Quick', tools: ['zap', 'naabu', 'testssl'],
    status: 'Queued', progress: 0, initiatedBy: 'Priya Raman', errorMessage: null, durationMs: 40_000,
    createdAt: minutesAgo(0), startedAt: null, finishedAt: null,
  },
];

// Findings of the seeded scans. Their details come from `findingTemplates`.
export const seedFindings = [
  { id: 'FND-2001', scanId: 'SCN-1001', templateId: 'zap-sqli', status: 'In Progress' },
  { id: 'FND-2002', scanId: 'SCN-1001', templateId: 'zap-csp', status: 'Open' },
  { id: 'FND-2003', scanId: 'SCN-1001', templateId: 'zap-cookie', status: 'Open' },
  { id: 'FND-2004', scanId: 'SCN-1001', templateId: 'naabu-ssh', status: 'Resolved' },
  { id: 'FND-2005', scanId: 'SCN-1001', templateId: 'testssl-legacy-tls', status: 'Open' },
  { id: 'FND-2006', scanId: 'SCN-1002', templateId: 'testssl-hsts', status: 'Open' },
  { id: 'FND-2007', scanId: 'SCN-1002', templateId: 'naabu-alt-http', status: 'False Positive' },
  { id: 'FND-2008', scanId: 'SCN-1003', templateId: 'gitleaks-aws-key', status: 'Open' },
  { id: 'FND-2009', scanId: 'SCN-1003', templateId: 'gitleaks-private-key', status: 'In Progress' },
  { id: 'FND-2010', scanId: 'SCN-1003', templateId: 'grype-lodash', status: 'Open' },
  { id: 'FND-2011', scanId: 'SCN-1003', templateId: 'trivy-xcrypto', status: 'Open' },
  { id: 'FND-2012', scanId: 'SCN-1003', templateId: 'syft-sbom', status: 'Open' },
  { id: 'FND-2013', scanId: 'SCN-1003', templateId: 'syft-license', status: 'Open' },
  { id: 'FND-2014', scanId: 'SCN-1004', templateId: 'trivy-http2', status: 'Open' },
  { id: 'FND-2015', scanId: 'SCN-1004', templateId: 'trivy-root-user', status: 'Open' },
  { id: 'FND-2016', scanId: 'SCN-1004', templateId: 'grype-log4shell', status: 'Open' },
  { id: 'FND-2017', scanId: 'SCN-1006', templateId: 'gitleaks-api-key', status: 'Resolved' },
  { id: 'FND-2018', scanId: 'SCN-1006', templateId: 'grype-spring4shell', status: 'Open' },
  { id: 'FND-2019', scanId: 'SCN-1006', templateId: 'trivy-xcrypto', status: 'Open' },
  { id: 'FND-2020', scanId: 'SCN-1007', templateId: 'checkov-s3-public', status: 'Open' },
  { id: 'FND-2021', scanId: 'SCN-1007', templateId: 'checkov-sg-ssh', status: 'In Progress' },
  { id: 'FND-2022', scanId: 'SCN-1007', templateId: 'checkov-k8s-root', status: 'Open' },
  { id: 'FND-2023', scanId: 'SCN-1007', templateId: 'checkov-rds-encryption', status: 'Resolved' },
  { id: 'FND-2024', scanId: 'SCN-1010', templateId: 'zap-xss', status: 'Open' },
  { id: 'FND-2025', scanId: 'SCN-1010', templateId: 'zap-server-header', status: 'Open' },
  { id: 'FND-2026', scanId: 'SCN-1010', templateId: 'testssl-weak-ciphers', status: 'Open' },
  { id: 'FND-2027', scanId: 'SCN-1011', templateId: 'naabu-mysql', status: 'Open' },
  { id: 'FND-2028', scanId: 'SCN-1011', templateId: 'testssl-cert-expiry', status: 'Open' },
  { id: 'FND-2029', scanId: 'SCN-1011', templateId: 'testssl-tls13', status: 'Open' },
];

// Newest first. Each entry belongs to one organization, so users only see their own.
export const activities = [
  { id: 'act-013', organizationId: 'org-securecloud', type: 'scan', message: 'Scan SCN-1005 started on Public REST API', actor: 'Nimali Fernando', createdAt: minutesAgo(6) },
  { id: 'act-012', organizationId: 'org-securecloud', type: 'finding', message: 'FND-2021 marked In Progress: Security group allows SSH from 0.0.0.0/0', actor: 'Tom Becker', createdAt: minutesAgo(2 * HOUR) },
  { id: 'act-011', organizationId: 'org-securecloud', type: 'scan', message: 'Scan SCN-1006 completed with 3 findings', actor: 'Scan worker', createdAt: minutesAgo(9 * HOUR - 11) },
  { id: 'act-010', organizationId: 'org-securecloud', type: 'finding', message: 'FND-2017 marked Resolved: Generic API key found in configuration file', actor: 'Nimali Fernando', createdAt: minutesAgo(8 * HOUR) },
  { id: 'act-009', organizationId: 'org-technova', type: 'scan', message: 'Scan SCN-1004 completed with 3 findings', actor: 'Scan worker', createdAt: minutesAgo(20 * HOUR - 6) },
  { id: 'act-008', organizationId: 'org-technova', type: 'scan', message: 'Scan SCN-1003 completed with 6 findings', actor: 'Scan worker', createdAt: minutesAgo(30 * HOUR - 14) },
  { id: 'act-007', organizationId: 'org-acme', type: 'scan', message: 'Scan SCN-1002 completed with 2 findings', actor: 'Scan worker', createdAt: minutesAgo(2 * DAY - 9) },
  { id: 'act-006', organizationId: 'org-acme', type: 'project', message: 'Target "Web server host" added to Main Website', actor: 'Alex Morgan', createdAt: minutesAgo(2 * DAY + 5) },
  { id: 'act-005', organizationId: 'org-acme', type: 'finding', message: 'FND-2004 marked Resolved: SSH (22/tcp) exposed to the internet', actor: 'Priya Raman', createdAt: minutesAgo(2 * DAY + 60) },
  { id: 'act-004', organizationId: 'org-acme', type: 'scan', message: 'Scan SCN-1001 completed with 5 findings', actor: 'Scan worker', createdAt: minutesAgo(3 * DAY - 38) },
  { id: 'act-003', organizationId: 'org-acme', type: 'scan', message: 'Scan SCN-1008 failed: target unreachable', actor: 'Scan worker', createdAt: minutesAgo(5 * DAY - 3) },
  { id: 'act-002', organizationId: 'org-technova', type: 'scan', message: 'Scan SCN-1009 cancelled', actor: 'James Whitfield', createdAt: minutesAgo(6 * DAY - 17) },
  { id: 'act-001', organizationId: 'org-northwind', type: 'project', message: 'Project Online Storefront created', actor: 'Grace Kim', createdAt: minutesAgo(11 * DAY) },
];
