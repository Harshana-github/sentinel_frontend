// Two kinds of users:
// - Super Admin: the Sentinel company team. Uses the platform panel at /admin.
// - Organization users: customers. They use the user panel and only see their own
//   organization's data.
//
// An organization user's session carries `modules` (features enabled for their
// organization) and `permissions` (actions their role may perform), set at sign-in.
// These checks only shape the UI. The backend must enforce the same rules.

export function isSuperAdmin(user) {
  return Boolean(user?.isSuperAdmin);
}

export function homePathFor(user) {
  return isSuperAdmin(user) ? '/admin' : '/dashboard';
}

export function hasModule(user, moduleKey) {
  return Boolean(user?.modules?.includes(moduleKey));
}

export function can(user, action) {
  return Boolean(user?.permissions?.includes(action));
}
