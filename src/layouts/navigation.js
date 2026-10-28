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

// Sidebar links for each panel. `end` makes a link active only on its exact path.
// `module` hides a user panel link when that feature module is disabled, and `permission`
// hides it when the user's role does not have that permission.

// Grouped by what the Super Admin is doing: customers, who can do what, the scanning
// engine, the lists of values the app uses, and the platform itself.
export const ADMIN_NAV = [
  { title: 'Overview', items: [{ to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true }] },
  {
    title: 'Customers',
    items: [{ to: '/admin/organizations', label: 'Organizations', icon: Building2 }],
  },
  {
    title: 'Access control',
    items: [{ to: '/admin/modules', label: 'Modules & Permissions', icon: LayoutGrid }],
  },
  {
    title: 'Scanning engine',
    items: [{ to: '/admin/scanners', label: 'Scanner Plugins', icon: Boxes }],
  },
  {
    title: 'Configuration',
    items: [
      { to: '/admin/masters', label: 'Master Data', icon: Database },
      { to: '/admin/statuses', label: 'Statuses', icon: Tags },
    ],
  },
  {
    title: 'System',
    items: [
      { to: '/admin/branding', label: 'Product & Company', icon: BadgeInfo },
      { to: '/admin/settings', label: 'Settings', icon: Settings },
    ],
  },
];

export const USER_NAV = [
  { title: 'Overview', items: [{ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }] },
  {
    title: 'Security',
    items: [
      { to: '/quick-scan', label: 'Quick scan', icon: Zap, module: 'scans', permission: 'scans.start' },
      { to: '/projects', label: 'Projects', icon: FolderKanban, module: 'projects' },
      { to: '/scans', label: 'Scans', icon: Radar, module: 'scans' },
      { to: '/assessments', label: 'Assessments', icon: Layers, module: 'scans' },
      { to: '/findings', label: 'Findings', icon: ShieldAlert, module: 'findings' },
    ],
  },
  {
    title: 'Organization',
    items: [
      { to: '/team', label: 'Users', icon: Users, module: 'team' },
      { to: '/roles', label: 'Roles', icon: KeyRound, module: 'team', permission: 'roles.read' },
      { to: '/settings', label: 'Settings', icon: Settings },
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
