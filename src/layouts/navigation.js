import { can, hasModule, isSuperAdmin } from '../utils/roles';
import {
  BadgeInfo,
  Boxes,
  Building2,
  Database,
  FolderKanban,
  KeyRound,
  LayoutDashboard,
  LayoutGrid,
  Layers,
  Radar,
  Settings,
  ShieldAlert,
  Tags,
  Users,
  Zap,
} from 'lucide-react';

// Sidebar links for each panel. `title` and `label` are translation keys. `end` makes a link
// active only on its exact path. `module` hides a user panel link when that feature module is
// disabled, and `permission` hides it when the user's role does not have that permission.

// Grouped by what the Super Admin is doing: customers, who can do what, the scanning
// engine, the lists of values the app uses, and the platform itself.
const ADMIN_NAV = [
  { title: 'nav.overview', items: [{ to: '/admin', label: 'nav.dashboard', icon: LayoutDashboard, end: true }] },
  { title: 'nav.customers', items: [{ to: '/admin/organizations', label: 'nav.organizations', icon: Building2 }] },
  { title: 'nav.accessControl', items: [{ to: '/admin/modules', label: 'nav.modules', icon: LayoutGrid }] },
  { title: 'nav.scanningEngine', items: [{ to: '/admin/scanners', label: 'nav.plugins', icon: Boxes }] },
  {
    title: 'nav.configuration',
    items: [
      { to: '/admin/masters', label: 'nav.masters', icon: Database },
      { to: '/admin/statuses', label: 'nav.statuses', icon: Tags },
    ],
  },
  {
    title: 'nav.system',
    items: [
      { to: '/admin/branding', label: 'nav.branding', icon: BadgeInfo },
      { to: '/admin/settings', label: 'nav.settings', icon: Settings },
    ],
  },
];

// Ordered by the user's workflow: start a scan, follow it, then work on what it found.
const USER_NAV = [
  { title: 'nav.overview', items: [{ to: '/dashboard', label: 'nav.dashboard', icon: LayoutDashboard }] },
  {
    title: 'nav.scanning',
    items: [
      { to: '/quick-scan', label: 'nav.quickScan', icon: Zap, module: 'scans', permission: 'scans.start' },
      { to: '/scans', label: 'nav.scans', icon: Radar, module: 'scans' },
      { to: '/assessments', label: 'nav.assessments', icon: Layers, module: 'scans' },
    ],
  },
  { title: 'nav.results', items: [{ to: '/findings', label: 'nav.findings', icon: ShieldAlert, module: 'findings' }] },
  { title: 'nav.assets', items: [{ to: '/projects', label: 'nav.projects', icon: FolderKanban, module: 'projects' }] },
  {
    title: 'nav.organization',
    items: [
      { to: '/team', label: 'nav.users', icon: Users, module: 'team' },
      { to: '/roles', label: 'nav.roles', icon: KeyRound, module: 'team', permission: 'roles.read' },
      { to: '/settings', label: 'nav.settings', icon: Settings },
    ],
  },
];

export function navigationFor(user) {
  if (isSuperAdmin(user)) return ADMIN_NAV;
  return USER_NAV.map((section) => ({
    ...section,
    items: section.items.filter((item) => (!item.module || hasModule(user, item.module)) && (!item.permission || can(user, item.permission))),
  })).filter((section) => section.items.length > 0);
}
