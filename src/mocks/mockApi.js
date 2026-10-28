// In-memory stand-in for the FastAPI backend, used when VITE_USE_MOCK_DATA=true.
// Each function behaves like an API call: it waits briefly, checks who is signed in,
// validates input, throws an Error with a readable message on failure and returns a
// copy of the data. Changes live only in memory and are lost when the page reloads.
//
// Access rules (the real backend must enforce the same):
// - Super Admin sees every organization and the platform endpoints.
// - Organization users only see data that belongs to their own organization.
// - Changing data needs a role permission, and that permission's feature module must be
//   enabled for the organization. Both are read live from the database on every call.

import {
  FINDING_STATUSES,
  OPEN_FINDING_STATUSES,
  SCAN_STATUSES,
  SEVERITIES,
  MASTER_LISTS,
  STATUS_CATEGORIES,
  ASSESSMENT_PROFILES,
} from '../utils/constants';
import { loadStoredAuth } from '../utils/authStorage';
import { isSuperAdmin } from '../utils/roles';
import { projectCodeError } from '../utils/projectCode';
import { slugError, slugify } from '../utils/slug';
import {
  activities,
  demoAccounts,
  findingTemplates,
  members,
  branding,
  featureModules,
  featurePermissions,
  organizations,
  platformStaff,
  projects,
  ADMIN_ROLE_SLUG,
  assessments,
  adminRole,
  roles,
  integrationStatuses,
  licenses,
  pluginCategories,
  organizationStatuses,
  pluginInterfaces,
  pluginSources,
  scannerModules,
  targetTypes,
  scans,
  seedFindings,
  userStatuses,
} from './mockData';

const QUEUE_WAIT_MS = 4000;
const PROFILE_DURATION_MS = { Quick: 20_000, Standard: 35_000, Deep: 60_000 };
const FAIL_AT_PROGRESS = 30;
const NO_PERMISSION = 'You do not have permission to do this.';

const db = {
  branding: structuredClone(branding),
  modules: structuredClone(featureModules),
  permissions: structuredClone(featurePermissions),
  organizations: structuredClone(organizations),
  members: structuredClone(members),
  projects: structuredClone(projects),
  scans: structuredClone(scans),
  assessments: structuredClone(assessments),
  activities: structuredClone(activities),
  roles: structuredClone(roles),
  scanners: structuredClone(scannerModules),
  // Master data lists and status categories, keyed like MASTER_LISTS and STATUS_CATEGORIES.
  masters: structuredClone({
    'target-types': targetTypes,
    'plugin-sources': pluginSources,
    'plugin-categories': pluginCategories,
    'plugin-interfaces': pluginInterfaces,
    licenses,
    'organization-statuses': organizationStatuses,
    'user-statuses': userStatuses,
    'integration-statuses': integrationStatuses,
  }),
  // Sign-in accounts: { userId, email, username, password }. New organization admins are added here.
  accounts: demoAccounts.map(({ userId, email, username, password }) => ({ userId, email, username, password })),
  findings: [],
};

db.findings = seedFindings.map((seed) => {
  const template = findingTemplates.find((item) => item.id === seed.templateId);
  const scan = db.scans.find((item) => item.id === seed.scanId);
  return createFinding(template, scan, seed);
});

let nextScanNumber = 1013;
let nextFindingNumber = 2001 + seedFindings.length;
let nextId = 100;

// ---------- helpers ----------

function simulateLatency(ms = 350) {
  return new Promise((resolve) => setTimeout(resolve, ms + Math.random() * 250));
}

// Callers get a copy, so Redux state never shares (and freezes) objects held by the mock database.
const copy = (value) => structuredClone(value);
const newId = (prefix) => `${prefix}-${++nextId}`;
const nowIso = () => new Date().toISOString();
const isOpenFinding = (finding) => OPEN_FINDING_STATUSES.includes(finding.status);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MIN_PASSWORD_LENGTH = 8;
const newestFirst = (a, b) => b.createdAt.localeCompare(a.createdAt);

function countBySeverity(findings) {
  return Object.fromEntries(
    SEVERITIES.map((severity) => [severity, findings.filter((finding) => finding.severity === severity).length]),
  );
}

function countByStatus(scanList) {
  return Object.fromEntries(SCAN_STATUSES.map((status) => [status, scanList.filter((scan) => scan.status === status).length]));
}

function findOrganization(id) {
  return db.organizations.find((organization) => organization.id === id);
}

function findProject(id) {
  return db.projects.find((project) => project.id === id);
}

function findTarget(project, targetId) {
  return project?.targets.find((target) => target.id === targetId);
}

function moduleName(id) {
  return db.scanners.find((module) => module.id === id)?.name ?? id;
}

const organizationOfProject = (projectId) => findProject(projectId)?.organizationId;

function logActivity(type, message, organizationId, actor = loadStoredAuth()?.user?.name ?? 'System') {
  db.activities.unshift({ id: newId('act'), organizationId, type, message, actor, createdAt: nowIso() });
}

// ---------- session and access ----------

// The mock reads the signed-in user from the stored session, the way a backend reads the token.
function requireUser() {
  const user = loadStoredAuth()?.user;
  if (!user) throw new Error('Your session has expired. Please sign in again.');
  return user;
}

function requireSuperAdmin() {
  const user = requireUser();
  if (!isSuperAdmin(user)) throw new Error(NO_PERMISSION);
  return user;
}

// Customer actions belong to the user panel. The user's role needs the permission and
// the permission's module must exist.
function requirePermission(action) {
  const user = requireUser();
  if (isSuperAdmin(user)) throw new Error(NO_PERMISSION);
  if (!effectivePermissions(user.organizationId, user.roleSlug).includes(action)) throw new Error(NO_PERMISSION);
  return user;
}

const findRole = (organizationId, slug) => db.roles.find((role) => role.organizationId === organizationId && role.slug === slug);

// Permissions a role has right now. The Admin role always has every permission; other roles
// only keep permissions that still exist (the Super Admin may have deleted some).
function effectivePermissions(organizationId, roleSlug) {
  const role = findRole(organizationId, roleSlug);
  if (!role) return [];
  return db.permissions.filter((permission) => role.system || role.permissions.includes(permission.key)).map((permission) => permission.key);
}

function canAccess(user, organizationId) {
  return isSuperAdmin(user) || user.organizationId === organizationId;
}

const visibleProjects = (user) => db.projects.filter((project) => canAccess(user, project.organizationId));
const visibleScans = (user) => db.scans.filter((scan) => canAccess(user, organizationOfProject(scan.projectId)));
const visibleFindings = (user) => db.findings.filter((finding) => canAccess(user, organizationOfProject(finding.projectId)));

// Returns the project if this user may see it. Projects of other organizations look "not found".
function requireProject(user, projectId) {
  const project = findProject(projectId);
  if (!project || !canAccess(user, project.organizationId)) throw new Error('Project not found.');
  return project;
}

// ---------- response shapes (the denormalised data an API would return) ----------

function createFinding(template, scan, { id, status = 'Open' }) {
  return {
    id,
    title: template.title,
    severity: template.severity,
    status,
    description: template.description,
    remediation: template.remediation,
    evidence: template.evidence,
    location: template.location,
    cwe: template.cwe ?? null,
    cve: template.cve ?? null,
    scanner: template.scanner,
    scanId: scan.id,
    projectId: scan.projectId,
    targetId: scan.targetId,
    discoveredAt: scan.finishedAt,
    updatedAt: scan.finishedAt,
  };
}

function withOrganizationCounts(organization) {
  const people = db.members.filter((member) => member.organizationId === organization.id);
  const admin = people.find((member) => member.role === ADMIN_ROLE_SLUG);
  return {
    ...organization,
    // Demo only: the mock keeps passwords in plain text so the Super Admin can copy them.
    admin: admin
      ? { name: admin.name, email: admin.email, status: admin.status, password: db.accounts.find((account) => account.userId === admin.id)?.password ?? null }
      : null,
    memberCount: db.members.filter((member) => member.organizationId === organization.id).length,
    projectCount: db.projects.filter((project) => project.organizationId === organization.id).length,
  };
}

function withProjectSummary(project) {
  const projectScans = db.scans.filter((scan) => scan.projectId === project.id);
  const lastScan = projectScans.toSorted(newestFirst)[0];
  return {
    ...project,
    organizationName: findOrganization(project.organizationId)?.name ?? 'Unknown',
    scanCount: projectScans.length,
    openFindingCount: db.findings.filter((finding) => finding.projectId === project.id && isOpenFinding(finding)).length,
    lastScanAt: lastScan?.createdAt ?? null,
  };
}

function withScanDetails(scan) {
  const project = findProject(scan.projectId);
  const target = findTarget(project, scan.targetId);
  const scanFindings = db.findings.filter((finding) => finding.scanId === scan.id);
  // durationMs only drives the mock engine and is not part of the API response.
  const { durationMs: _engineOnly, ...publicFields } = scan;
  return {
    ...publicFields,
    projectName: project.name,
    projectCode: project.code,
    organizationId: project.organizationId,
    organizationName: findOrganization(project.organizationId)?.name ?? 'Unknown',
    targetName: target.name,
    targetType: target.type,
    targetValue: target.value,
    findingCount: scanFindings.length,
    severityCounts: countBySeverity(scanFindings),
    assessmentId: scan.assessmentId ?? null,
    assessmentName: db.assessments.find((assessment) => assessment.id === scan.assessmentId)?.name ?? null,
  };
}

function withFindingDetails(finding) {
  const project = findProject(finding.projectId);
  const target = findTarget(project, finding.targetId);
  return {
    ...finding,
    scannerName: moduleName(finding.scanner),
    projectName: project.name,
    projectCode: project.code,
    organizationId: project.organizationId,
    organizationName: findOrganization(project.organizationId)?.name ?? 'Unknown',
    targetName: target.name,
    targetType: target.type,
    targetValue: target.value,
  };
}

// ---------- simulated scan engine ----------

// Moves scans forward based on the current time. Called before every read, so progress
// keeps advancing even while no page is polling.
function advanceScans() {
  const time = Date.now();

  for (const scan of db.scans) {
    if (scan.status === 'Queued' && time - Date.parse(scan.createdAt) >= QUEUE_WAIT_MS) {
      scan.status = 'Running';
      scan.startedAt = new Date(Date.parse(scan.createdAt) + QUEUE_WAIT_MS).toISOString();
    }
    if (scan.status !== 'Running') continue;

    const progress = Math.min(100, Math.floor(((time - Date.parse(scan.startedAt)) / scan.durationMs) * 100));
    const target = findTarget(findProject(scan.projectId), scan.targetId);

    if (target.value.includes('unreachable') && progress >= FAIL_AT_PROGRESS) {
      failScan(scan, target);
    } else if (progress >= 100) {
      completeScan(scan, target);
    } else {
      scan.progress = progress;
    }
  }
}

function failScan(scan, target) {
  scan.status = 'Failed';
  scan.progress = FAIL_AT_PROGRESS;
  scan.finishedAt = nowIso();
  scan.errorMessage = `Target unreachable: connection to ${target.value} timed out after 30 seconds (${moduleName(scan.tools[0])}).`;
  logActivity('scan', `Scan ${scan.id} failed: target unreachable`, organizationOfProject(scan.projectId), 'Scan worker');
}

function completeScan(scan, target) {
  scan.status = 'Completed';
  scan.progress = 100;
  scan.finishedAt = new Date(Date.parse(scan.startedAt) + scan.durationMs).toISOString();

  const newFindings = scan.tools.flatMap((tool) => {
    const templates = findingTemplates.filter((template) => template.scanner === tool);
    const count = 1 + Math.floor(Math.random() * Math.min(3, templates.length));
    return templates
      .toSorted(() => Math.random() - 0.5)
      .slice(0, count)
      .map((template) => createFinding(template, scan, { id: `FND-${nextFindingNumber++}` }));
  });
  db.findings.push(...newFindings);
  logActivity(
    'scan',
    `Scan ${scan.id} completed on ${target.name} with ${newFindings.length} findings`,
    organizationOfProject(scan.projectId),
    'Scan worker',
  );
}

// ---------- auth ----------

export async function login({ identifier, password }) {
  await simulateLatency(600);
  const normalized = identifier.trim().toLowerCase();
  const account = db.accounts.find((item) => item.email === normalized || item.username === normalized);
  if (!account || account.password !== password) {
    throw new Error('Invalid email/username or password.');
  }

  const person = [...platformStaff, ...db.members].find((item) => item.id === account.userId);
  const organization = findOrganization(person.organizationId);
  if (organization?.status === 'suspended') {
    throw new Error(`${organization.name} is suspended. Please contact the Sentinel team.`);
  }

  const user = {
    id: person.id,
    name: person.name,
    email: person.email,
    username: account.username,
    // Display name of the role; `roleSlug` is what permission checks use.
    role: findRole(person.organizationId, person.role)?.name ?? person.role,
    roleSlug: person.role,
    organizationId: organization?.id ?? null,
    organizationName: organization?.name ?? null,
    modules: organization ? db.modules.map((module) => module.key) : [],
    permissions: organization ? effectivePermissions(organization.id, person.role) : [],
  };
  if (organization) {
    // The first sign-in turns an invited member into an active one.
    if (person.status === 'invited') person.status = 'active';
    person.lastActiveAt = nowIso();
    logActivity('auth', `${user.name} signed in`, organization.id, user.name);
  }
  return copy({ accessToken: `demo-token-${Date.now()}`, user });
}

// ---------- organizations ----------

export async function getOrganizations() {
  await simulateLatency();
  const user = requireUser();
  return copy(db.organizations.filter((organization) => canAccess(user, organization.id)).map(withOrganizationCounts));
}

// Creates the organization together with its first Admin account, using the password the
// Super Admin chose. The password is never sent back in the response.
export async function createOrganization({ name, slug, adminName, adminEmail, adminPassword }) {
  await simulateLatency(500);
  requireSuperAdmin();
  const trimmedName = name.trim();
  if (db.organizations.some((organization) => organization.name.toLowerCase() === trimmedName.toLowerCase())) {
    throw new Error(`An organization named "${trimmedName}" already exists.`);
  }
  const organizationSlug = resolveSlug(slug, trimmedName);
  if (db.organizations.some((organization) => organization.slug === organizationSlug)) {
    throw new Error(`The slug "${organizationSlug}" is already used by another organization.`);
  }
  const normalizedAdminEmail = adminEmail.trim().toLowerCase();
  if (!adminName.trim()) throw new Error("Enter the organization admin's name.");
  if (!EMAIL_PATTERN.test(normalizedAdminEmail)) throw new Error("Enter a valid email for the organization admin.");
  if (db.accounts.some((account) => account.email === normalizedAdminEmail)) {
    throw new Error(`A user with the email ${normalizedAdminEmail} already exists.`);
  }
  if ((adminPassword ?? '').length < MIN_PASSWORD_LENGTH) {
    throw new Error(`The admin password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  }

  const organization = {
    id: newId('org'),
    slug: organizationSlug,
    name: trimmedName,
    status: 'trial',
    contactEmail: null,
    description: '',
    createdAt: nowIso(),
  };
  const admin = {
    id: newId('usr'),
    organizationId: organization.id,
    name: adminName.trim(),
    email: normalizedAdminEmail,
    role: ADMIN_ROLE_SLUG,
    status: 'invited',
    lastActiveAt: null,
  };

  db.organizations.push(organization);
  db.roles.push(adminRole(organization.id));
  db.members.push(admin);
  db.accounts.push({ userId: admin.id, email: admin.email, username: admin.email, password: adminPassword });
  logActivity('organization', `Organization ${organization.name} created with admin ${admin.name}`, organization.id);

  return copy({
    organization: withOrganizationCounts(organization),
    admin: { name: admin.name, email: admin.email },
  });
}

// Super Admin changes an organization's status.
export async function updateOrganization(organizationId, { status }) {
  await simulateLatency();
  requireSuperAdmin();
  const organization = findOrganization(organizationId);
  if (!organization) throw new Error('Organization not found.');

  if (status !== undefined) {
    if (!isMasterItem('organization-statuses', status)) throw new Error('Unknown organization status.');
    organization.status = status;
    logActivity('organization', `Organization status changed to ${masterName('organization-statuses', status)}`, organization.id);
  }
  return copy(withOrganizationCounts(organization));
}

export async function getOrganizationMembers(organizationId) {
  await simulateLatency();
  const user = requireUser();
  if (!findOrganization(organizationId) || !canAccess(user, organizationId)) throw new Error('Organization not found.');
  return copy(
    db.members
      .filter((member) => member.organizationId === organizationId)
      .map((member) => ({ ...member, roleName: findRole(organizationId, member.role)?.name ?? member.role })),
  );
}

// ---------- projects ----------

export async function getProjects() {
  await simulateLatency();
  const user = requireUser();
  advanceScans();
  return copy(visibleProjects(user).map(withProjectSummary).sort(newestFirst));
}

// New projects always belong to the signed-in user's organization.
export async function createProject({ name, code, environment, description }) {
  await simulateLatency(500);
  const user = requirePermission('projects.create');

  const trimmedName = name.trim();
  const duplicate = db.projects.some(
    (project) => project.organizationId === user.organizationId && project.name.toLowerCase() === trimmedName.toLowerCase(),
  );
  if (duplicate) throw new Error(`Your organization already has a project named "${trimmedName}".`);
  const projectCode = (code ?? '').trim().toUpperCase();
  const codeProblem = projectCodeError(projectCode);
  if (codeProblem) throw new Error(`Project code: ${codeProblem}`);
  if (db.projects.some((project) => project.organizationId === user.organizationId && project.code === projectCode)) {
    throw new Error(`The project code ${projectCode} is already used in your organization.`);
  }

  const project = {
    id: newId('prj'),
    code: projectCode,
    name: trimmedName,
    organizationId: user.organizationId,
    description: description.trim(),
    environment,
    status: 'Active',
    owner: user.name,
    createdAt: nowIso(),
    targets: [],
  };
  db.projects.push(project);
  logActivity('project', `Project ${project.name} created`, project.organizationId);
  return copy(withProjectSummary(project));
}

export async function addScanTarget(projectId, { name, type, value }) {
  await simulateLatency(500);
  const user = requirePermission('targets.add');
  const project = requireProject(user, projectId);
  if (project.status === 'Archived') throw new Error('Archived projects cannot get new targets.');
  const targetType = db.masters['target-types'].find((item) => item.id === type);
  if (!targetType) throw new Error('Choose a target type.');
  const trimmedValue = value.trim();
  if (targetType.format === 'url' && !/^https?:\/\/\S+$/.test(trimmedValue)) throw new Error('Enter a full URL starting with https://');
  if (project.targets.some((target) => target.value.toLowerCase() === trimmedValue.toLowerCase())) {
    throw new Error(`"${trimmedValue}" is already a target of this project.`);
  }

  project.targets.push({ id: newId('tgt'), name: name.trim(), type, value: trimmedValue, createdAt: nowIso() });
  logActivity('project', `Target "${name.trim()}" added to ${project.name}`, project.organizationId);
  return copy(withProjectSummary(project));
}

// ---------- scans ----------

export async function getScans() {
  await simulateLatency(250);
  const user = requireUser();
  advanceScans();
  return copy(visibleScans(user).toSorted(newestFirst).map(withScanDetails));
}

export async function startScan({ projectId, targetId, profile, tools }) {
  await simulateLatency(500);
  const user = requirePermission('scans.start');
  const project = requireProject(user, projectId);
  const target = findTarget(project, targetId);
  if (!target) throw new Error('Select a target.');
  if (project.status === 'Archived') throw new Error('Archived projects cannot be scanned.');
  if (!PROFILE_DURATION_MS[profile]) throw new Error('Select a scan profile.');
  if (!tools?.length) throw new Error('Select at least one scanner module.');
  const unsupported = tools.filter(
    (tool) => !db.scanners.find((module) => module.id === tool && module.enabled)?.targetTypes.includes(target.type),
  );
  if (unsupported.length) {
    throw new Error(`${unsupported.map(moduleName).join(', ')} cannot scan this target type.`);
  }

  const scan = queueScan(user, project, target, profile, tools);
  return copy(withScanDetails(scan));
}

// Creates one queued scan job. Assessments call this once per target.
function queueScan(user, project, target, profile, tools, assessmentId = null) {
  const scan = {
    id: `SCN-${nextScanNumber++}`,
    projectId: project.id,
    targetId: target.id,
    assessmentId,
    profile,
    tools,
    status: 'Queued',
    progress: 0,
    initiatedBy: user.name,
    errorMessage: null,
    durationMs: PROFILE_DURATION_MS[profile],
    createdAt: nowIso(),
    startedAt: null,
    finishedAt: null,
  };
  db.scans.push(scan);
  logActivity('scan', `Scan ${scan.id} queued for ${target.name}`, project.organizationId);
  return scan;
}

export async function cancelScan(scanId) {
  await simulateLatency();
  const user = requirePermission('scans.cancel');
  advanceScans();
  const scan = visibleScans(user).find((item) => item.id === scanId);
  if (!scan) throw new Error('Scan not found.');
  if (scan.status !== 'Queued' && scan.status !== 'Running') {
    throw new Error(`Scan ${scan.id} is already ${scan.status.toLowerCase()} and cannot be cancelled.`);
  }
  scan.status = 'Cancelled';
  scan.finishedAt = nowIso();
  logActivity('scan', `Scan ${scan.id} cancelled`, organizationOfProject(scan.projectId));
  return copy(withScanDetails(scan));
}

// ---------- findings ----------

export async function getFindings() {
  await simulateLatency();
  const user = requireUser();
  advanceScans();
  return copy(
    visibleFindings(user)
      .toSorted((a, b) => b.discoveredAt.localeCompare(a.discoveredAt))
      .map(withFindingDetails),
  );
}

export async function updateFindingStatus(findingId, status) {
  await simulateLatency();
  const user = requirePermission('findings.update');
  const finding = visibleFindings(user).find((item) => item.id === findingId);
  if (!finding) throw new Error('Finding not found.');
  if (!FINDING_STATUSES.includes(status)) throw new Error('Unknown finding status.');
  finding.status = status;
  finding.updatedAt = nowIso();
  logActivity('finding', `${finding.id} marked ${status}: ${finding.title}`, organizationOfProject(finding.projectId));
  return copy(withFindingDetails(finding));
}

// ---------- user panel dashboard ----------

export async function getDashboardSummary() {
  await simulateLatency();
  const user = requireUser();
  advanceScans();
  const userScans = visibleScans(user);
  const userFindings = visibleFindings(user);
  const openFindings = userFindings.filter(isOpenFinding);

  return copy({
    totals: {
      projects: visibleProjects(user).length,
      scans: userScans.length,
      vulnerabilities: userFindings.length,
      openVulnerabilities: openFindings.length,
      members: db.members.filter((member) => canAccess(user, member.organizationId)).length,
    },
    openSeverityCounts: countBySeverity(openFindings),
    scanStatusCounts: countByStatus(userScans),
    recentScans: userScans.toSorted(newestFirst).slice(0, 6).map(withScanDetails),
    recentActivity: db.activities.filter((activity) => canAccess(user, activity.organizationId)).slice(0, 8),
  });
}

// ---------- super admin (platform) ----------

export async function getPlatformSummary() {
  await simulateLatency();
  requireSuperAdmin();
  advanceScans();
  const openFindings = db.findings.filter(isOpenFinding);

  const organizationRows = db.organizations.map((organization) => {
    const projectIds = db.projects.filter((project) => project.organizationId === organization.id).map((project) => project.id);
    const organizationScans = db.scans.filter((scan) => projectIds.includes(scan.projectId));
    return {
      id: organization.id,
      name: organization.name,
      status: organization.status,
      userCount: db.members.filter((member) => member.organizationId === organization.id).length,
      projectCount: projectIds.length,
      scanCount: organizationScans.length,
      openFindingCount: openFindings.filter((finding) => projectIds.includes(finding.projectId)).length,
      lastScanAt: organizationScans.toSorted(newestFirst)[0]?.createdAt ?? null,
    };
  });

  return copy({
    totals: {
      organizations: db.organizations.length,
      activeOrganizations: db.organizations.filter((organization) => organization.status !== 'suspended').length,
      users: db.members.length,
      scans: db.scans.length,
      openVulnerabilities: openFindings.length,
    },
    scanStatusCounts: countByStatus(db.scans),
    openSeverityCounts: countBySeverity(openFindings),
    organizations: organizationRows,
  });
}

// ---------- assessments ----------

let nextAssessmentNumber = 1003;
const TERMINAL_SCAN_STATUSES = ['Completed', 'Failed', 'Cancelled'];

// The overall status always comes from the jobs, so it can never disagree with them.
function assessmentStatus(assessment, jobs) {
  const count = (status) => jobs.filter((job) => job.status === status).length;
  if (jobs.length === 0) return assessment.cancelled ? 'Cancelled' : 'Failed';
  if (count('Running')) return 'Running';
  if (count('Queued')) return count('Completed') + count('Failed') + count('Cancelled') ? 'Running' : 'Queued';
  if (assessment.cancelled) return 'Cancelled';
  if (count('Failed')) return count('Completed') ? 'Completed with errors' : 'Failed';
  if (count('Cancelled')) return count('Cancelled') === jobs.length ? 'Cancelled' : 'Completed with errors';
  return 'Completed';
}

function withAssessmentDetails(assessment) {
  const project = findProject(assessment.projectId);
  const jobs = db.scans.filter((scan) => scan.assessmentId === assessment.id);
  const jobIds = jobs.map((job) => job.id);
  const jobFindings = db.findings.filter((finding) => jobIds.includes(finding.scanId));
  return copy({
    ...assessment,
    profileName: ASSESSMENT_PROFILES.find((profile) => profile.key === assessment.profile)?.name ?? assessment.profile,
    projectName: project.name,
    projectCode: project.code,
    organizationId: project.organizationId,
    status: assessmentStatus(assessment, jobs),
    jobIds,
    jobCount: jobs.length,
    finishedJobCount: jobs.filter((job) => TERMINAL_SCAN_STATUSES.includes(job.status)).length,
    // Average of the jobs' progress, for one overall progress bar.
    progress: jobs.length ? Math.round(jobs.reduce((sum, job) => sum + (TERMINAL_SCAN_STATUSES.includes(job.status) ? 100 : job.progress), 0) / jobs.length) : 0,
    findingCount: jobFindings.length,
    severityCounts: countBySeverity(jobFindings),
  });
}

// The enabled plugins that would scan a target in this profile.
function assessmentPlugins(profile, targetType) {
  const plugins = db.scanners.filter((plugin) => plugin.enabled && plugin.targetTypes.includes(targetType));
  return profile.plugins === 'primary' ? plugins.slice(0, 1) : plugins;
}

export async function getAssessments() {
  await simulateLatency(250);
  const user = requireUser();
  advanceScans();
  return db.assessments
    .filter((assessment) => canAccess(user, organizationOfProject(assessment.projectId)))
    .toSorted(newestFirst)
    .map(withAssessmentDetails);
}

// Plans the assessment into one scan job per selected target and queues them.
// The person must confirm they are authorized to test every selected target.
export async function startAssessment({ projectId, profile: profileKey, name, targetIds, authorized }) {
  await simulateLatency(600);
  const user = requirePermission('scans.start');
  const project = requireProject(user, projectId);
  if (project.status === 'Archived') throw new Error('Archived projects cannot be scanned.');
  if (!authorized) throw new Error('Confirm that you are authorized to test these targets.');
  const profile = ASSESSMENT_PROFILES.find((item) => item.key === profileKey);
  if (!profile) throw new Error('Choose an assessment profile.');

  const selected = project.targets.filter((target) => (targetIds ?? []).includes(target.id));
  const planned = selected
    .filter((target) => profile.types[target.type])
    .map((target) => ({ target, tools: assessmentPlugins(profile, target.type).map((plugin) => plugin.id) }))
    .filter((job) => job.tools.length > 0);
  if (planned.length === 0) throw new Error('Select at least one target that can be scanned in this profile.');
  const missingRequired = Object.entries(profile.types)
    .filter(([type, rule]) => rule === 'required' && !planned.some((job) => job.target.type === type))
    .map(([type]) => masterName('target-types', type));
  if (missingRequired.length) throw new Error(`This profile needs a ${missingRequired.join(' and a ')} target.`);

  const plannedIds = planned.map((job) => job.target.id);
  const assessment = {
    id: `ASM-${nextAssessmentNumber++}`,
    projectId: project.id,
    name: (name ?? '').trim() || `${profile.name} · ${project.name}`,
    profile: profile.key,
    createdBy: user.name,
    createdAt: nowIso(),
    cancelled: false,
    skipped: project.targets
      .filter((target) => !plannedIds.includes(target.id) && profile.types[target.type])
      .map((target) => ({
        targetId: target.id,
        targetName: target.name,
        reason: assessmentPlugins(profile, target.type).length ? 'Not selected' : 'No enabled plugin can scan this target type',
      })),
  };
  db.assessments.push(assessment);
  planned.forEach((job) => queueScan(user, project, job.target, profile.scanProfile, job.tools, assessment.id));
  logActivity('scan', `Assessment ${assessment.id} started with ${planned.length} scan ${planned.length === 1 ? 'job' : 'jobs'}`, project.organizationId);
  return withAssessmentDetails(assessment);
}

// Cancels the queued and running jobs. Finished jobs and their findings are kept.
export async function cancelAssessment(assessmentId) {
  await simulateLatency();
  const user = requirePermission('scans.cancel');
  advanceScans();
  const assessment = db.assessments.find((item) => item.id === assessmentId && canAccess(user, organizationOfProject(item.projectId)));
  if (!assessment) throw new Error('Assessment not found.');
  const active = db.scans.filter((scan) => scan.assessmentId === assessment.id && (scan.status === 'Queued' || scan.status === 'Running'));
  if (active.length === 0) throw new Error('This assessment has no queued or running jobs.');
  active.forEach((scan) => {
    scan.status = 'Cancelled';
    scan.finishedAt = nowIso();
  });
  assessment.cancelled = true;
  logActivity('scan', `Assessment ${assessment.id} cancelled`, organizationOfProject(assessment.projectId));
  return withAssessmentDetails(assessment);
}

// ---------- users of an organization (organization panel) ----------

const withRoleName = (member) => copy({ ...member, roleName: findRole(member.organizationId, member.role)?.name ?? member.role });

// The roles a user can be given: every role of the organization, Admin included.
export async function getRoleOptions() {
  await simulateLatency(200);
  const user = requireUser();
  if (!['users.create', 'users.update'].some((action) => effectivePermissions(user.organizationId, user.roleSlug).includes(action))) {
    throw new Error(NO_PERMISSION);
  }
  return db.roles
    .filter((role) => role.organizationId === user.organizationId)
    .map(({ slug, name, description, system }) => ({ slug, name, description, system, permissionCount: effectivePermissions(user.organizationId, slug).length }));
}

// Adds a person to the signed-in user's organization with the chosen role and password.
// Like organization admins, they start as Invited and the details are sent by hand.
export async function createMember({ name, email, password, role }) {
  await simulateLatency(400);
  const user = requirePermission('users.create');
  const trimmedName = (name ?? '').trim();
  const normalizedEmail = (email ?? '').trim().toLowerCase();
  if (trimmedName.length < 2) throw new Error('Enter the full name.');
  if (!EMAIL_PATTERN.test(normalizedEmail)) throw new Error('Enter a valid email address.');
  if (db.accounts.some((account) => account.email === normalizedEmail)) throw new Error(`A user with the email ${normalizedEmail} already exists.`);
  if ((password ?? '').length < MIN_PASSWORD_LENGTH) throw new Error(`The password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  if (!findRole(user.organizationId, role)) throw new Error('Choose a role.');

  const member = { id: newId('usr'), organizationId: user.organizationId, name: trimmedName, email: normalizedEmail, role, status: 'invited', lastActiveAt: null };
  db.members.push(member);
  db.accounts.push({ userId: member.id, email: member.email, username: member.email, password });
  logActivity('user', `${member.name} was added as ${findRole(user.organizationId, role).name}`, user.organizationId);
  return withRoleName(member);
}

// Changes a person's name and/or role. Nobody can change their own role, and the
// organization always keeps at least one Admin.
export async function updateMember(memberId, { name, role }) {
  await simulateLatency();
  const user = requirePermission('users.update');
  const member = db.members.find((item) => item.id === memberId && item.organizationId === user.organizationId);
  if (!member) throw new Error('User not found.');
  if (name !== undefined) {
    if (name.trim().length < 2) throw new Error('Enter the full name.');
    member.name = name.trim();
  }
  if (role !== undefined && role !== member.role) {
    if (!findRole(user.organizationId, role)) throw new Error('Choose a role.');
    if (member.id === user.id) throw new Error('You cannot change your own role. Ask another admin.');
    const admins = db.members.filter((item) => item.organizationId === user.organizationId && item.role === ADMIN_ROLE_SLUG);
    if (member.role === ADMIN_ROLE_SLUG && admins.length === 1) throw new Error('The organization needs at least one Admin.');
    member.role = role;
    logActivity('user', `${member.name} is now ${findRole(user.organizationId, role).name}`, user.organizationId);
  }
  return withRoleName(member);
}

// Removes a person and their sign-in account. Nobody can delete themselves, and the
// organization always keeps at least one Admin.
export async function deleteMember(memberId) {
  await simulateLatency();
  const user = requirePermission('users.delete');
  const member = db.members.find((item) => item.id === memberId && item.organizationId === user.organizationId);
  if (!member) throw new Error('User not found.');
  if (member.id === user.id) throw new Error('You cannot delete your own account.');
  const admins = db.members.filter((item) => item.organizationId === user.organizationId && item.role === ADMIN_ROLE_SLUG);
  if (member.role === ADMIN_ROLE_SLUG && admins.length === 1) throw new Error('The organization needs at least one Admin.');
  db.members = db.members.filter((item) => item.id !== memberId);
  db.accounts = db.accounts.filter((account) => account.userId !== memberId);
  logActivity('user', `${member.name} was removed`, user.organizationId);
  return { id: memberId, organizationId: member.organizationId };
}

// ---------- roles (organization panel) ----------

function roleWithDetails(role) {
  return copy({
    ...role,
    permissions: effectivePermissions(role.organizationId, role.slug),
    memberCount: db.members.filter((member) => member.organizationId === role.organizationId && member.role === role.slug).length,
  });
}

function requireCustomRole(user, roleId) {
  const role = db.roles.find((item) => item.id === roleId && item.organizationId === user.organizationId);
  if (!role) throw new Error('Role not found.');
  if (role.system) throw new Error('The Admin role is predefined and cannot be changed.');
  return role;
}

function validateRole(user, { name, description, permissions }, ignoreId) {
  const trimmed = (name ?? '').trim();
  if (trimmed.length < 2 || trimmed.length > 40) throw new Error('The role name must be 2 to 40 characters.');
  const duplicate = db.roles.some((role) => role.organizationId === user.organizationId && role.id !== ignoreId && role.name.toLowerCase() === trimmed.toLowerCase());
  if (duplicate) throw new Error(`A role named "${trimmed}" already exists.`);
  const known = db.permissions.map((permission) => permission.key);
  return {
    name: trimmed,
    description: (description ?? '').trim(),
    permissions: known.filter((key) => (permissions ?? []).includes(key)),
  };
}

// The modules and permissions the Super Admin defined, for choosing a role's permissions.
export async function getPermissionCatalog() {
  await simulateLatency();
  requirePermission('roles.read');
  return copy({ modules: db.modules, permissions: db.permissions });
}

export async function getRoles() {
  await simulateLatency();
  const user = requirePermission('roles.read');
  return db.roles.filter((role) => role.organizationId === user.organizationId).map(roleWithDetails);
}

export async function createRole(input) {
  await simulateLatency();
  const user = requirePermission('roles.create');
  const fields = validateRole(user, input);
  const slug = resolveSlug(input.slug, fields.name);
  if (findRole(user.organizationId, slug)) throw new Error(`The slug "${slug}" is already used by another role.`);
  const role = { id: `${user.organizationId}:${slug}`, organizationId: user.organizationId, slug, ...fields, system: false };
  db.roles.push(role);
  logActivity('role', `Role "${role.name}" created`, user.organizationId);
  return roleWithDetails(role);
}

export async function updateRole(roleId, input) {
  await simulateLatency();
  const user = requirePermission('roles.update');
  const role = requireCustomRole(user, roleId);
  Object.assign(role, validateRole(user, { ...role, ...input }, roleId));
  logActivity('role', `Role "${role.name}" updated`, user.organizationId);
  return roleWithDetails(role);
}

export async function deleteRole(roleId) {
  await simulateLatency();
  const user = requirePermission('roles.delete');
  const role = requireCustomRole(user, roleId);
  const memberCount = db.members.filter((member) => member.organizationId === user.organizationId && member.role === role.slug).length;
  if (memberCount > 0) throw new Error(`${memberCount} ${memberCount === 1 ? 'person has' : 'people have'} this role. Give them another role first.`);
  db.roles = db.roles.filter((item) => item.id !== roleId);
  logActivity('role', `Role "${role.name}" deleted`, user.organizationId);
  return { id: roleId };
}

// ---------- product and company details ----------

const IMAGE_LIMITS = { favicon: 100 * 1024, productLogo: 512 * 1024, logo: 512 * 1024 };
const IMAGE_PATTERN = /^data:image\/(png|jpeg|svg\+xml|webp|x-icon|vnd\.microsoft\.icon);base64,/;

function validateImage(field, value) {
  if (value === null) return null;
  if (typeof value !== 'string' || !IMAGE_PATTERN.test(value)) throw new Error('Images must be PNG, JPG, SVG, WebP or ICO.');
  // A base64 data URL is about 4/3 of the file size.
  if ((value.length * 3) / 4 > IMAGE_LIMITS[field]) throw new Error(`That image is too large (max ${IMAGE_LIMITS[field] / 1024} KB).`);
  return value;
}

// Public: the login page shows these before anyone signs in.
export async function getBranding() {
  await simulateLatency(150);
  return copy(db.branding);
}

export async function updateBranding(input) {
  await simulateLatency();
  requireSuperAdmin();
  const text = (value) => (value ?? '').trim();
  const company = input.company ?? {};
  const next = {
    productName: text(input.productName),
    tagline: text(input.tagline),
    favicon: validateImage('favicon', input.favicon ?? null),
    productLogo: validateImage('productLogo', input.productLogo ?? null),
    company: {
      name: text(company.name),
      logo: validateImage('logo', company.logo ?? null),
      email: text(company.email),
      phone: text(company.phone),
      website: text(company.website),
      address: text(company.address),
    },
  };
  if (next.productName.length < 2 || next.productName.length > 40) throw new Error('The product name must be 2 to 40 characters.');
  if (next.tagline.length > 80) throw new Error('Keep the tagline under 80 characters.');
  if (next.company.name.length < 2) throw new Error('Enter the company name.');
  if (next.company.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next.company.email)) throw new Error('Enter a valid company email.');
  if (next.company.website && !/^https?:\/\/\S+$/.test(next.company.website)) throw new Error('The website must start with http:// or https://');
  db.branding = next;
  return copy(db.branding);
}

// ---------- modules ----------

const MODULE_NAME_MAX = 40;
// The slug the user typed, or one made from the name. Throws if it is not valid.
function resolveSlug(slug, name) {
  const value = (slug ?? '').trim() || slugify(name);
  const error = slugError(value);
  if (error) throw new Error(`Slug: ${error}`);
  return value;
}

function validateModule(name, description, ignoreKey) {
  const trimmed = name?.trim() ?? '';
  if (trimmed.length < 2 || trimmed.length > MODULE_NAME_MAX) throw new Error(`Module name must be 2 to ${MODULE_NAME_MAX} characters.`);
  if (db.modules.some((module) => module.key !== ignoreKey && module.name.toLowerCase() === trimmed.toLowerCase())) {
    throw new Error('A module with this name already exists.');
  }
  return { name: trimmed, description: description?.trim() ?? '' };
}

export async function getModules() {
  await simulateLatency();
  requireSuperAdmin();
  return copy(db.modules);
}

export async function createModule(input) {
  await simulateLatency();
  requireSuperAdmin();
  const fields = validateModule(input.name, input.description);
  const key = resolveSlug(input.slug, fields.name);
  if (db.modules.some((module) => module.key === key)) throw new Error(`The slug "${key}" is already used by another module.`);
  const module = { key, ...fields, builtIn: false };
  db.modules.push(module);
  return copy(module);
}

export async function updateModule(key, { name, description }) {
  await simulateLatency();
  requireSuperAdmin();
  const module = db.modules.find((item) => item.key === key);
  if (!module) throw new Error('Module not found.');
  Object.assign(module, validateModule(name, description, key));
  return copy(module);
}

export async function deleteModule(key) {
  await simulateLatency();
  requireSuperAdmin();
  const module = db.modules.find((item) => item.key === key);
  if (!module) throw new Error('Module not found.');
  if (module.builtIn) throw new Error('Built-in modules cannot be deleted.');
  db.modules = db.modules.filter((item) => item.key !== key);
  // A module's permissions go with it.
  db.permissions = db.permissions.filter((permission) => permission.module !== key);
  return { key };
}

// ---------- permissions ----------

function validatePermission({ module, name, description }, ignoreKey) {
  if (!db.modules.some((item) => item.key === module)) throw new Error('Choose a module.');
  const trimmed = name?.trim() ?? '';
  if (trimmed.length < 2 || trimmed.length > MODULE_NAME_MAX) throw new Error(`Permission name must be 2 to ${MODULE_NAME_MAX} characters.`);
  const duplicate = db.permissions.some(
    (item) => item.key !== ignoreKey && item.module === module && item.name.toLowerCase() === trimmed.toLowerCase(),
  );
  if (duplicate) throw new Error('This module already has a permission with this name.');
  return { module, name: trimmed, description: description?.trim() ?? '' };
}

export async function getPermissions() {
  await simulateLatency();
  requireSuperAdmin();
  return copy(db.permissions);
}

export async function createPermission(input) {
  await simulateLatency();
  requireSuperAdmin();
  const fields = validatePermission(input);
  // The permission key is "<module slug>.<permission slug>", e.g. "projects.create".
  const key = `${fields.module}.${resolveSlug(input.slug, fields.name)}`;
  if (db.permissions.some((item) => item.key === key)) throw new Error(`The key "${key}" is already used by another permission.`);
  const permission = { key, ...fields, builtIn: false };
  db.permissions.push(permission);
  return copy(permission);
}

// The module cannot be changed after creation, because the key is built from it.
export async function updatePermission(key, { name, description }) {
  await simulateLatency();
  requireSuperAdmin();
  const permission = db.permissions.find((item) => item.key === key);
  if (!permission) throw new Error('Permission not found.');
  Object.assign(permission, validatePermission({ module: permission.module, name, description }, key));
  return copy(permission);
}

export async function deletePermission(key) {
  await simulateLatency();
  requireSuperAdmin();
  const permission = db.permissions.find((item) => item.key === key);
  if (!permission) throw new Error('Permission not found.');
  if (permission.builtIn) throw new Error('Built-in permissions cannot be deleted.');
  db.permissions = db.permissions.filter((item) => item.key !== key);
  return { key };
}

// ---------- master data ----------

function masterList(list) {
  const config = [...MASTER_LISTS, ...STATUS_CATEGORIES].find((item) => item.key === list);
  if (!config) throw new Error('Unknown master data list.');
  return config;
}

function validateMasterItem(list, input, ignoreId) {
  const { name, description } = input;
  const trimmed = name?.trim() ?? '';
  if (trimmed.length < 2 || trimmed.length > MODULE_NAME_MAX) throw new Error(`Name must be 2 to ${MODULE_NAME_MAX} characters.`);
  if (db.masters[list].some((item) => item.id !== ignoreId && item.name.toLowerCase() === trimmed.toLowerCase())) {
    throw new Error(`A ${masterList(list).singular} with this name already exists.`);
  }
  const extras = {};
  for (const field of masterList(list).extraFields ?? []) {
    const value = (input[field.key] ?? '').trim();
    if (field.options && !field.options.some((option) => option.value === value)) throw new Error(`Choose a value for ${field.label}.`);
    extras[field.key] = value;
  }
  return { name: trimmed, description: description?.trim() ?? '', ...extras };
}

// What uses an item, as { plugins, targets, organizations, users } counts.
function masterUsage(list, id) {
  if (list === 'organization-statuses') return { organizations: db.organizations.filter((item) => item.status === id).length };
  if (list === 'user-statuses') return { users: db.members.filter((item) => item.status === id).length };
  const pluginField = list === 'integration-statuses' ? 'integrationStatus' : masterList(list).pluginField;
  const plugins = db.scanners.filter((plugin) => [plugin[pluginField]].flat().includes(id)).length;
  const targets = list === 'target-types' ? db.projects.flatMap((project) => project.targets).filter((target) => target.type === id).length : 0;
  return { plugins, targets };
}

const withUsage = (list, item) => copy({ ...item, usage: masterUsage(list, item.id) });

const isMasterItem = (list, id) => db.masters[list].some((item) => item.id === id);
const masterName = (list, id) => db.masters[list].find((item) => item.id === id)?.name ?? id;

// Names are added so the user panel can show them without reading master data.
function withPluginNames(plugin) {
  return copy({
    ...plugin,
    sourceName: masterName('plugin-sources', plugin.source),
    categoryName: masterName('plugin-categories', plugin.category),
    interfaceName: masterName('plugin-interfaces', plugin.interface),
    licenseName: masterName('licenses', plugin.license),
    statusName: masterName('integration-statuses', plugin.integrationStatus),
  });
}

// Every signed-in user can read master data (the user panel needs target types).
// Only the Super Admin sees usage and can change it.
export async function getMasterItems(list) {
  await simulateLatency();
  const user = requireUser();
  masterList(list);
  return isSuperAdmin(user) ? db.masters[list].map((item) => withUsage(list, item)) : copy(db.masters[list]);
}

export async function createMasterItem(list, input) {
  await simulateLatency();
  requireSuperAdmin();
  const fields = validateMasterItem(list, input);
  const id = resolveSlug(input.slug, fields.name);
  if (db.masters[list].some((item) => item.id === id)) throw new Error(`The slug "${id}" is already used in this list.`);
  db.masters[list].push({ id, ...fields, builtIn: false });
  return withUsage(list, { id, ...fields, builtIn: false });
}

export async function updateMasterItem(list, id, input) {
  await simulateLatency();
  requireSuperAdmin();
  const item = db.masters[list]?.find((entry) => entry.id === id);
  if (!item) throw new Error('Item not found.');
  Object.assign(item, validateMasterItem(list, input, id));
  return withUsage(list, item);
}

// An item still in use cannot be deleted.
export async function deleteMasterItem(list, id) {
  await simulateLatency();
  requireSuperAdmin();
  const item = db.masters[list]?.find((entry) => entry.id === id);
  if (!item) throw new Error('Item not found.');
  if (item.builtIn) throw new Error(`${item.name} is used by Sentinel itself and cannot be deleted.`);
  const inUse = Object.values(masterUsage(list, id)).reduce((sum, count) => sum + count, 0);
  if (inUse > 0) throw new Error(`${item.name} is still in use. Change those records first.`);
  db.masters[list] = db.masters[list].filter((entry) => entry.id !== id);
  return { id };
}

// ---------- scanner modules ----------

export async function getScannerModules() {
  await simulateLatency();
  requireUser();
  return db.scanners.map(withPluginNames);
}

function validatePlugin(input, ignoreId) {
  const text = (value) => (value ?? '').trim();
  const plugin = {
    name: text(input.name),
    version: text(input.version),
    source: input.source,
    category: input.category,
    purpose: text(input.purpose),
    targetTypes: (input.targetTypes ?? []).filter((type) => isMasterItem('target-types', type)),
    interface: input.interface,
    command: text(input.command),
    image: text(input.image),
    license: input.license,
    integrationStatus: input.integrationStatus,
    enabled: Boolean(input.enabled),
  };
  if (plugin.name.length < 2) throw new Error('Enter the plugin name.');
  if (db.scanners.some((item) => item.id !== ignoreId && item.name.toLowerCase() === plugin.name.toLowerCase())) {
    throw new Error('A plugin with this name is already registered.');
  }
  if (!plugin.version) throw new Error('Enter the plugin version.');
  if (!isMasterItem('plugin-sources', plugin.source)) throw new Error('Choose where the plugin comes from.');
  if (!isMasterItem('plugin-categories', plugin.category)) throw new Error('Choose a category.');
  if (plugin.targetTypes.length === 0) throw new Error('Select at least one target type.');
  const pluginInterface = db.masters['plugin-interfaces'].find((item) => item.id === plugin.interface);
  if (!pluginInterface) throw new Error('Choose how Sentinel runs the plugin.');
  if (pluginInterface.kind === 'command' && !plugin.command.includes('{target}')) throw new Error('The command must contain {target}.');
  if (pluginInterface.kind === 'url' && !/^https?:\/\//.test(plugin.command)) throw new Error('Enter the endpoint URL (http or https).');
  if (!plugin.image) throw new Error('Enter the container image.');
  if (!isMasterItem('licenses', plugin.license)) throw new Error('Choose a license.');
  if (!isMasterItem('integration-statuses', plugin.integrationStatus)) throw new Error('Choose a status.');
  return plugin;
}

export async function registerScannerModule(input) {
  await simulateLatency();
  requireSuperAdmin();
  const plugin = validatePlugin(input);
  const id = resolveSlug(input.slug, plugin.name);
  if (db.scanners.some((item) => item.id === id)) throw new Error(`The slug "${id}" is already used by another plugin.`);
  db.scanners.push({ id, ...plugin });
  return withPluginNames({ id, ...plugin });
}

export async function updateScannerModule(id, input) {
  await simulateLatency();
  requireSuperAdmin();
  const plugin = db.scanners.find((item) => item.id === id);
  if (!plugin) throw new Error('Plugin not found.');
  Object.assign(plugin, validatePlugin({ ...plugin, ...input }, id));
  return withPluginNames(plugin);
}

// Past scans keep the plugin id, so their history still shows which tool ran.
export async function deleteScannerModule(id) {
  await simulateLatency();
  requireSuperAdmin();
  if (!db.scanners.some((item) => item.id === id)) throw new Error('Plugin not found.');
  db.scanners = db.scanners.filter((item) => item.id !== id);
  return { id };
}
