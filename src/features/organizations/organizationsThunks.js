import { createAsyncThunk } from '@reduxjs/toolkit';
import api, { callApi } from '../../services/api';
import * as mockApi from '../../mocks/mockApi';

export const fetchOrganizations = createAsyncThunk('organizations/fetchAll', () =>
  callApi(() => mockApi.getOrganizations(), () => api.get('/organizations')),
);

export const fetchOrganizationMembers = createAsyncThunk('organizations/fetchMembers', (organizationId) =>
  callApi(
    () => mockApi.getOrganizationMembers(organizationId),
    () => api.get(`/organizations/${organizationId}/members`),
  ),
);

// Super Admin only. Creates the organization and its first Admin.
// Returns { organization, admin: { name, email } }. The password is never returned.
export const createOrganization = createAsyncThunk('organizations/create', (organization) =>
  callApi(() => mockApi.createOrganization(organization), () => api.post('/organizations', organization)),
);

// Super Admin only. `changes` can contain `status` and/or `modules`.
export const updateOrganization = createAsyncThunk('organizations/update', ({ organizationId, changes }) =>
  callApi(
    () => mockApi.updateOrganization(organizationId, changes),
    () => api.patch(`/organizations/${organizationId}`, changes),
  ),
);
