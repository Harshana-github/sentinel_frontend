import { createAsyncThunk } from '@reduxjs/toolkit';
import api, { callApi } from '../../services/api';
import * as mockApi from '../../mocks/mockApi';

// Roles of the signed-in user's organization. Each call needs the matching roles.* permission.

export const fetchRoles = createAsyncThunk('roles/fetchAll', () =>
  callApi(
    () => mockApi.getRoles(),
    () => api.get('/roles'),
  ),
);

// Modules and permissions defined by the Super Admin: { modules, permissions }.
export const fetchPermissionCatalog = createAsyncThunk('roles/fetchCatalog', () =>
  callApi(
    () => mockApi.getPermissionCatalog(),
    () => api.get('/permission-catalog'),
  ),
);

export const createRole = createAsyncThunk('roles/create', (role) =>
  callApi(
    () => mockApi.createRole(role),
    () => api.post('/roles', role),
  ),
);

export const updateRole = createAsyncThunk('roles/update', ({ id, changes }) =>
  callApi(
    () => mockApi.updateRole(id, changes),
    () => api.patch(`/roles/${encodeURIComponent(id)}`, changes),
  ),
);

export const deleteRole = createAsyncThunk('roles/delete', (id) =>
  callApi(
    () => mockApi.deleteRole(id),
    () => api.delete(`/roles/${encodeURIComponent(id)}`),
  ),
);
