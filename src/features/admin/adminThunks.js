import { createAsyncThunk } from '@reduxjs/toolkit';
import api, { callApi } from '../../services/api';
import * as mockApi from '../../mocks/mockApi';

// Platform-wide data for the Super Admin panel.

export const fetchPlatformSummary = createAsyncThunk('admin/fetchSummary', () =>
  callApi(() => mockApi.getPlatformSummary(), () => api.get('/admin/summary')),
);

// Modules are the same for every organization. Super Admin only.

export const fetchModules = createAsyncThunk('admin/fetchModules', () =>
  callApi(() => mockApi.getModules(), () => api.get('/admin/modules')),
);

export const createModule = createAsyncThunk('admin/createModule', (module) =>
  callApi(() => mockApi.createModule(module), () => api.post('/admin/modules', module)),
);

export const updateModule = createAsyncThunk('admin/updateModule', ({ key, changes }) =>
  callApi(() => mockApi.updateModule(key, changes), () => api.put(`/admin/modules/${key}`, changes)),
);

export const deleteModule = createAsyncThunk('admin/deleteModule', (key) =>
  callApi(() => mockApi.deleteModule(key), () => api.delete(`/admin/modules/${key}`)),
);

// Permissions belong to a module. Super Admin only.

export const fetchPermissions = createAsyncThunk('admin/fetchPermissions', () =>
  callApi(() => mockApi.getPermissions(), () => api.get('/admin/permissions')),
);

export const createPermission = createAsyncThunk('admin/createPermission', (permission) =>
  callApi(() => mockApi.createPermission(permission), () => api.post('/admin/permissions', permission)),
);

export const updatePermission = createAsyncThunk('admin/updatePermission', ({ key, changes }) =>
  callApi(() => mockApi.updatePermission(key, changes), () => api.put(`/admin/permissions/${key}`, changes)),
);

export const deletePermission = createAsyncThunk('admin/deletePermission', (key) =>
  callApi(() => mockApi.deletePermission(key), () => api.delete(`/admin/permissions/${key}`)),
);
