import { combineReducers, configureStore } from '@reduxjs/toolkit';
import adminReducer from '../features/admin/adminSlice';
import assessmentsReducer from '../features/assessments/assessmentsSlice';
import authReducer from '../features/auth/authSlice';
import brandingReducer from '../features/branding/brandingSlice';
import { logout } from '../features/auth/authThunks';
import dashboardReducer from '../features/dashboard/dashboardSlice';
import findingsReducer from '../features/findings/findingsSlice';
import mastersReducer from '../features/masters/mastersSlice';
import organizationsReducer from '../features/organizations/organizationsSlice';
import projectsReducer from '../features/projects/projectsSlice';
import rolesReducer from '../features/roles/rolesSlice';
import scannersReducer from '../features/scanners/scannersSlice';
import scansReducer from '../features/scans/scansSlice';
import uiReducer from '../features/ui/uiSlice';

const appReducer = combineReducers({
  admin: adminReducer,
  assessments: assessmentsReducer,
  auth: authReducer,
  branding: brandingReducer,
  dashboard: dashboardReducer,
  findings: findingsReducer,
  masters: mastersReducer,
  organizations: organizationsReducer,
  projects: projectsReducer,
  roles: rolesReducer,
  scanners: scannersReducer,
  scans: scansReducer,
  ui: uiReducer,
});

// Signing out resets every slice, so the next user never sees the previous user's data.
// Branding is public and kept, so the login page does not flash the defaults.
function rootReducer(state, action) {
  if (action.type === logout.fulfilled.type) return appReducer({ branding: state?.branding }, action);
  return appReducer(state, action);
}

export const store = configureStore({ reducer: rootReducer });
