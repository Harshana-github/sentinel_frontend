# Sentinel Frontend

Admin dashboard for **Sentinel AI Vulnerability Scanner**, built with React, Vite, Redux Toolkit, Axios and Tailwind CSS.

The app runs fully in the browser with **demonstration data** (mock mode), so you can explore every page without a backend. The code is laid out so each data call can be switched to the future FastAPI backend.

> Everything in mock mode is simulated. No scanner engine runs and no target is contacted. All organizations, people, hosts and findings are fictional.

## Prerequisites

- Node.js **20.19+** or **22.12+** (required by Vite 7)
- npm 10+

## Getting started

```bash
npm install
npm run dev
```

Then open the URL that Vite prints (normally http://localhost:5173).

Other scripts:

| Command                | What it does                                      |
| ---------------------- | ------------------------------------------------- |
| `npm run build`        | Production build into `dist/`                     |
| `npm run preview`      | Serve the production build locally                |
| `npm run lint`         | ESLint, including the React Hooks rules           |
| `npm run format`       | Format every file with Prettier (150 columns)     |
| `npm run format:check` | Check formatting without changing files (e.g. CI) |

Run `npm run lint` and `npm run format` before committing.

## Two panels

| Panel                 | Who uses it                                      | Home route   |
| --------------------- | ------------------------------------------------ | ------------ |
| **Super Admin panel** | The Sentinel company team that runs the platform | `/admin`     |
| **User panel**        | Customer organizations (their admins and users)  | `/dashboard` |

Everyone signs in at `/login` and lands on the right panel for their role. Opening a route of the other panel redirects you to your own home page.

**Super Admin panel (`/admin`)**

| Route                      | Page                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/admin`                   | Platform dashboard: totals and an overview of every organization                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `/admin/organizations`     | All customer organizations, plus **New organization** (creates the organization and its admin)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `/admin/organizations/:id` | Organization details, members and projects. **Suspend** or **Reactivate** the organization                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `/admin/modules`           | **Modules & permissions**: one page to create, read, update and delete modules and the permissions inside each module                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `/admin/scanners`          | **Scanner plugins**: register, edit, enable/disable and remove open-source and in-house tools (container image + CLI command with `{target}` or a REST endpoint)                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `/admin/masters`           | **Master data**: lists of values managed by the Super Admin, one tab each: target types, plugin sources, plugin categories, interfaces and licenses. Items still in use cannot be deleted                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `/admin/statuses`          | **Statuses**: fixed status categories, each with its own statuses. In the organization, user and integration categories the Super Admin adds, renames, recolours and deletes statuses; system statuses (used by the app's logic) can be edited but not deleted. The project, scan, assessment and finding categories hold exactly the statuses Sentinel's workflow uses: they can be renamed and recoloured only, and every badge, filter and chart in the user panel shows those names and colours. Records keep storing the workflow value (e.g. `In Progress`); its status item has the slug of that value (`in-progress`) |
| `/admin/branding`          | **Product & company**: favicon, product logo, product name and tagline, and the software development company's logo, name and contact details, with a live preview. Used by the browser tab, the sidebar and the login page                                                                                                                                                                                                                                                                                                                                                                                                   |
| `/admin/settings`          | Profile and app configuration                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |

**User panel**

| Route                        | Page                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/dashboard`                 | The organization's security overview                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `/projects`, `/projects/:id` | Projects and their scan targets                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `/scans`, `/scans/:id`       | Scan history and live progress                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `/findings`, `/findings/:id` | Vulnerability findings                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `/quick-scan`                | **Quick scan**: scan without setting up a project or targets. _Single scan_ takes one target type and address, a profile and the tools; _Full scan_ takes an address per target type (empty ones are skipped) and runs every enabled tool with the Deep profile as an assessment. Needs `scans.start` and an authorization confirmation. The targets are kept in the organization's _Quick scans_ project (code `QUICK`), created on first use                                                |
| `/assessments`               | **Assessments**: multi-target scans. _New assessment_ picks a project, a profile (Quick, Web Application, Source Code, Full) and the project's targets, shows a review with what will run, what is skipped and what blocks the start, and needs an authorization confirmation. Each target becomes its own scan job; the assessment's status is always worked out from its jobs. The detail page shows the jobs, skipped targets and consolidated findings, and can cancel the remaining jobs |
| `/team`                      | **Users**: people of the organization. _Add user_ sets their name, email, password and **role** (any of the organization's roles), then shows login details to copy and send. _Edit_ changes the name and role. Nobody can change their own role, and there is always at least one Admin                                                                                                                                                                                                      |
| `/roles`                     | **Roles**: create, rename and delete roles and choose their permissions, grouped by module. Admin is predefined and locked                                                                                                                                                                                                                                                                                                                                                                    |
| `/settings`                  | Profile, organization and app configuration                                                                                                                                                                                                                                                                                                                                                                                                                                                   |

Organization users only see their own organization's data.

### Slugs

Organizations, modules, permissions, scanner plugins, master data items and statuses each have a unique **slug** (lowercase letters, numbers and single hyphens, up to 50 characters; rules in `src/utils/slug.js`). Forms fill it in from the name, and it can be changed before saving. It cannot be changed afterwards, because other records refer to it. A permission's key is `<module slug>.<permission slug>`, for example `projects.create`. Status categories and master data lists have fixed slugs such as `organization-statuses`.

### Project codes

Every project has a short **code** such as `WEB` or `MOBILE-API`: uppercase letters, numbers and single hyphens, starting with a letter, 2 to 12 characters (rules in `src/utils/projectCode.js`). It must be unique within the organization. The Create project form suggests one from the name; it can be changed before saving.

### Feature modules and permissions

The Super Admin controls what each organization user can do:

- **Modules** (`Projects`, `Scans`, `Findings`, `Users`) are managed by the Super Admin and apply to every organization. Built-in modules can be renamed but not deleted. Deleting a custom module removes it from the user panel.
- **Permissions** belong to a module and are managed by the Super Admin (create, read, update, delete). Built-in permissions (the ones the app checks) can be edited but not deleted. Deleting a custom module deletes its permissions.
- **Roles** belong to one organization and are managed on its **Roles** page (`/roles`) by anyone with the `roles.*` permissions. Each role picks permissions from the Super Admin's modules. Every organization has the system role **Admin**: it always has every permission (including ones added later) and cannot be edited or deleted. A role that people still have cannot be deleted. Members store their role's slug.

How it works:

- The module and action lists live in `src/utils/constants.js` (`ORGANIZATION_ROLES`; modules and permissions are seeded in `src/mocks/mockData.js`).
- At sign-in, the user's session gets `modules` and `permissions`. The UI hides links and buttons with `hasModule(user, key)` and `can(user, action)` from `src/utils/roles.js`, and `ModuleRoute` guards the module pages.
- The mock API checks the **live** settings on every action and rejects anything not allowed, as the real backend must.
- Users see changes the next time they sign in.

## Demo accounts

| Account                            | Email (or username)                        | Password         | Panel        |
| ---------------------------------- | ------------------------------------------ | ---------------- | ------------ |
| Super Admin                        | `superadmin@sentinel.local` (`superadmin`) | `SuperAdmin@123` | `/admin`     |
| Organization Admin (Acme Security) | `alex.morgan@acme.example` (`admin`)       | `Admin@123`      | `/dashboard` |

In mock mode the login page lists these accounts, each with a **Use** button that fills in the form. If the Super Admin suspends an organization, its users can no longer sign in.

## Environment variables

Copy `.env.example` to `.env` (a ready-to-use `.env` is already included) and adjust as needed:

| Variable             | Default                        | Purpose                                      |
| -------------------- | ------------------------------ | -------------------------------------------- |
| `VITE_API_BASE_URL`  | `http://localhost:8000/api/v1` | Base URL of the FastAPI backend              |
| `VITE_USE_MOCK_DATA` | `true`                         | `true` uses demo data, `false` calls the API |

Restart `npm run dev` after changing `.env`.

Every `VITE_` variable is bundled into the JavaScript that ships to the browser, so anyone can read it. **Never put secrets in these files.**

## How mock mode works

- `src/mocks/mockData.js` holds the demonstration data: the demo accounts, 5 organizations, 13 customer users, 7 projects with scan targets, 12 scans, about 30 findings, activity entries and the scanner plugins (open-source tools plus one in-house example).
- `src/mocks/mockApi.js` is an in-memory stand-in for the backend. Each function waits 300–850 ms, checks the signed-in user, validates its input, throws an error with a readable message when something is wrong and returns a copy of the data, the way a real API call would. It applies the same access rules the backend must apply: the Super Admin sees everything, while organization users only see their own organization.
- The thunks call `callApi(mockHandler, apiRequest)` from `src/services/api.js`, which runs the mock handler in mock mode and the Axios request otherwise.

What you can try:

- Search and filter organizations, projects, scans and findings.
- Open organization, project, scan and finding detail pages.
- As Super Admin: create an organization and suspend or reactivate one. Each organization's members are listed on its detail page.
- As Super Admin: create an organization with its admin, copy the login details shown, sign out, then sign in as that admin with the password you set.
- As Super Admin: delete a custom module, sign out, then sign in as the Organization Admin to see the link or button disappear.
- As Organization Admin: create a project (a duplicate name returns an error) and add scan targets.
- Add a scan target to a project. Web, repository and IaC targets must be full URLs.
- Start a scan, either from **Start scan** or from a target row. You must tick the authorization checkbox. The scan waits in **Queued** for about 4 seconds, then runs: Quick about 20 s, Standard about 35 s, Deep about 60 s. When it completes it creates findings.
- A target whose address contains `unreachable` fails at 30%, which lets you see the **Failed** state.
- Cancel a queued or running scan, or **Run again** on a finished one.
- Change a finding's status (Open, In Progress, Resolved, False Positive).
- Watch the dashboard, scan list and scan detail refresh on their own while scans are active.

Limitations of the mock:

- Data lives in memory. **Reloading the page resets it**, but the login session is kept.
- Progress and findings are generated locally. They do not reflect any real scan.

## Switching to API mode

1. Set `VITE_USE_MOCK_DATA=false` and point `VITE_API_BASE_URL` at the backend.
2. Restart the dev server.

The shared Axios instance (`src/services/api.js`):

- uses `VITE_API_BASE_URL` and a 15-second timeout, and sends JSON;
- adds `Authorization: Bearer <token>` when a token is stored;
- turns errors into one readable message, using FastAPI's `detail` field when present;
- on a `401`, clears the session and returns to the login page.

The thunks currently expect the endpoints below. They are **placeholders** to agree with the backend team, not a finished contract.

| Thunk                                                        | Request                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `login`                                                      | `POST /auth/login` → `{ accessToken, user }`                                                                                                                                                                                                                                                                                                                                                |
| `fetchOrganizations`                                         | `GET /organizations` (the Super Admin gets all; users get their own)                                                                                                                                                                                                                                                                                                                        |
| `fetchOrganizationMembers`                                   | `GET /organizations/:id/members`                                                                                                                                                                                                                                                                                                                                                            |
| `createOrganization`                                         | `POST /organizations` with `{ name, adminName, adminEmail, adminPassword }` → `{ organization, admin: { name, email } }` (Super Admin; the password is never returned)                                                                                                                                                                                                                      |
| `updateOrganization`                                         | `PATCH /organizations/:id` with `{ status }` and/or `{ modules }` (Super Admin)                                                                                                                                                                                                                                                                                                             |
| `fetchPlatformSummary`                                       | `GET /admin/summary` (Super Admin)                                                                                                                                                                                                                                                                                                                                                          |
| `fetchProjects`                                              | `GET /projects`                                                                                                                                                                                                                                                                                                                                                                             |
| `createProject`                                              | `POST /projects`                                                                                                                                                                                                                                                                                                                                                                            |
| `addScanTarget`                                              | `POST /projects/:id/targets`                                                                                                                                                                                                                                                                                                                                                                |
| `fetchScans`                                                 | `GET /scans`                                                                                                                                                                                                                                                                                                                                                                                |
| `startScan`                                                  | `POST /scans`                                                                                                                                                                                                                                                                                                                                                                               |
| `cancelScan`                                                 | `POST /scans/:id/cancel`                                                                                                                                                                                                                                                                                                                                                                    |
| `fetchFindings`                                              | `GET /findings`                                                                                                                                                                                                                                                                                                                                                                             |
| `updateFindingStatus`                                        | `PATCH /findings/:id`                                                                                                                                                                                                                                                                                                                                                                       |
| `fetchDashboardSummary`                                      | `GET /dashboard/summary`                                                                                                                                                                                                                                                                                                                                                                    |
| `fetchScannerModules`                                        | `GET /scanner-modules`                                                                                                                                                                                                                                                                                                                                                                      |
| `registerScannerModule`                                      | `POST /scanner-modules` (Super Admin)                                                                                                                                                                                                                                                                                                                                                       |
| `updateScannerModule`                                        | `PATCH /scanner-modules/:id` (Super Admin)                                                                                                                                                                                                                                                                                                                                                  |
| `deleteScannerModule`                                        | `DELETE /scanner-modules/:id` (Super Admin)                                                                                                                                                                                                                                                                                                                                                 |
| `fetchBranding`                                              | `GET /branding` (public, the login page needs it)                                                                                                                                                                                                                                                                                                                                           |
| `updateBranding`                                             | `PUT /admin/branding` (Super Admin). Images are sent as data URLs in the mock; a real backend should store them in object storage and return URLs                                                                                                                                                                                                                                           |
| `fetchRoles` / `createRole` / `updateRole` / `deleteRole`    | `GET`, `POST`, `PATCH /:id`, `DELETE /:id` on `/roles` (own organization, needs `roles.*`)                                                                                                                                                                                                                                                                                                  |
| `startQuickScan`                                             | `POST /scans/quick` with `{ mode: 'single' \| 'full', inputs: [{ type, value }], profile, tools, authorized }` (needs `scans.start`). Returns `{ kind: 'scan' \| 'assessment', id }`                                                                                                                                                                                                        |
| `fetchAssessments` / `startAssessment` / `cancelAssessment`  | `GET /assessments`, `POST /assessments` with `{ projectId, profile, name, targetIds, authorized }`, `POST /assessments/:id/cancel` (needs `scans.start` / `scans.cancel`). Scans carry `assessmentId`                                                                                                                                                                                       |
| `fetchRoleOptions`                                           | `GET /members/role-options` → the organization's roles to choose from (needs `users.create` or `users.update`)                                                                                                                                                                                                                                                                              |
| `createMember` / `updateMember`                              | `POST /members`, `PATCH /members/:id` (needs `users.create` / `users.update`)                                                                                                                                                                                                                                                                                                               |
| `fetchPermissionCatalog`                                     | `GET /permission-catalog` → `{ modules, permissions }` (needs `roles.read`)                                                                                                                                                                                                                                                                                                                 |
| `fetchMasterItems`                                           | `GET /masters/:list` (any signed-in user; the Super Admin also gets usage counts)                                                                                                                                                                                                                                                                                                           |
| `createMasterItem` / `updateMasterItem` / `deleteMasterItem` | `POST`, `PUT /:id`, `DELETE /:id` on `/admin/masters/:list` (Super Admin). `:list` is `target-types`, `plugin-sources`, `plugin-categories`, `plugin-interfaces` or `licenses`, or a status category: `organization-statuses`, `user-statuses`, `integration-statuses`, `project-statuses`, `scan-statuses`, `assessment-statuses`, `finding-statuses` (the last four cannot get new items) |

The response shapes the UI expects are the objects returned by `src/mocks/mockApi.js`.

## Authentication and security notes

- Login is a **demo**. In mock mode, the demo accounts receive a fake token.
- **New organization admins:** creating an organization also creates its first user with the `Admin` role.
  - The Super Admin sets the admin's password in the form (**Password** and **Confirm password**, at least 8 characters).
  - After saving, the login details are shown with a **Copy login details** button. No email is sent: the Super Admin passes them on manually.
  - The API never returns the password.
  - The admin shows as `Invited` until their first sign-in, then as `Active`.
  - A real backend must store only a hash of the password and should ask the admin to change it on first sign-in. The mock does neither.
- The session (token and user) is stored in `localStorage` so it survives a refresh. That is fine for a demo, but a production build should prefer an httpOnly cookie issued by the backend.
- Route protection and hidden buttons in the browser only change what is shown. **The backend must verify the token, the user's role and the organization on every request**, exactly as the mock API does.
- Signing out resets the whole Redux store, so the next user never sees the previous user's data.
- The scan form's authorization checkbox is a UI consent gate. The backend must enforce scan authorization too.
- Access checks are kept simple: one `user.role` value plus the session's `modules` and `permissions` lists, checked by three small helpers in `src/utils/roles.js`.

## Folder structure

```
src/
├── app/store.js             Redux store
├── features/                One folder per feature: <name>Slice.js (state) + <name>Thunks.js (async calls)
│   ├── sliceHelpers.js      addLoadCases (loading / succeeded / failed, silent refresh), replaceItem, removeItem
│   ├── admin/               Platform summary, modules and permissions (Super Admin only)
│   ├── assessments/
│   ├── auth/
│   ├── branding/            Product and company details, BrandingEffect (tab title, favicon)
│   ├── dashboard/
│   ├── findings/
│   ├── masters/             Master data and statuses, useMasterList and useStatusList hooks
│   ├── organizations/       Organizations and their users
│   ├── projects/
│   ├── roles/
│   ├── scanners/
│   ├── scans/
│   └── ui/                  Toast notifications
├── components/              Reusable UI (tables, badges, modals, forms); ScanOptions.jsx holds the scan form pieces
├── layouts/                 App shell shared by both panels, plus navigation.js (each panel's sidebar links)
├── pages/
│   ├── admin/               Super Admin panel pages
│   ├── user/                User panel pages
│   └── *.jsx                Shared pages: Login, Settings, Not found
├── routes/                  ProtectedRoute (per panel), ModuleRoute (per feature module), PublicOnlyRoute, HomeRedirect
├── hooks/usePolling.js      Refreshes data while scans are running
├── services/api.js          Axios instance, error handling, mock/API switch
├── mocks/                   Demonstration data and the in-memory mock API
├── utils/                   Constants, formatting, session storage, roles, slugs, project codes, target addresses, chart colours
├── App.jsx                  Routes
├── main.jsx                 Entry point
└── index.css                Tailwind import, base styles and shared primitives (buttons, inputs)
```

## Styling

Styling uses **Tailwind CSS v4** through the `@tailwindcss/vite` plugin. There is no separate config file.

- Components use Tailwind utility classes directly in their JSX.
- `src/index.css` imports Tailwind and defines only base styles plus a few primitives used in many places: `btn`, `btn-primary`, `btn-secondary`, `btn-danger`, `btn-sm`, `icon-btn` and `input`.
- Colours that depend on data (status, severity, chart bars) are kept in lookup maps, for example in `StatusBadge.jsx`, `SeverityBadge.jsx` and `utils/colors.js`. The class names are written out in full so Tailwind can find them. Do not build them with string templates such as `bg-${color}-500`.

Data flow: **page → dispatch(thunk) → callApi → mock API or Axios → slice → useSelector → page**.

Shared data (lists, the session, toasts) lives in Redux. Temporary UI state (form fields, open dialogs, filters) stays in component state.

## Current limitations

- No automated tests or linter are configured yet.
- Mock data resets on page reload.
- Lists load everything at once, with no pagination.
- Projects and targets cannot be edited or deleted yet. Apart from the admin created with an organization, users cannot be added or edited. Organization details cannot be edited (only their status and modules).
- Users cannot change their password, and a lost password cannot be reset yet.
- Organizations and admins created in mock mode disappear when the page reloads, like all mock changes.
- Module and permission changes reach users only when they next sign in.
- Read requests are not filtered by module, because only actions are checked.
- Report export (PDF, HTML, JSON) and AI analysis from the platform architecture are not part of this frontend yet.
- The API endpoints above are assumptions until the FastAPI backend exists.
