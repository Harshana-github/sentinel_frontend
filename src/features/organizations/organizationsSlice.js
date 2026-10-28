import { createSlice } from '@reduxjs/toolkit';
import {
  createOrganization,
  fetchOrganizationMembers,
  fetchOrganizations,
  updateOrganization,
} from './organizationsThunks';

const initialState = {
  items: [],
  status: 'idle',
  error: null,
  // Members are loaded per organization: { [organizationId]: { items, status, error } }
  membersByOrganization: {},
};

const organizationsSlice = createSlice({
  name: 'organizations',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrganizations.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchOrganizations.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchOrganizations.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(createOrganization.fulfilled, (state, action) => {
        state.items.push(action.payload.organization);
      })
      .addCase(updateOrganization.fulfilled, (state, action) => {
        const index = state.items.findIndex((organization) => organization.id === action.payload.id);
        if (index !== -1) state.items[index] = action.payload;
      })
      .addCase(fetchOrganizationMembers.pending, (state, action) => {
        const previous = state.membersByOrganization[action.meta.arg];
        state.membersByOrganization[action.meta.arg] = { items: previous?.items ?? [], status: 'loading', error: null };
      })
      .addCase(fetchOrganizationMembers.fulfilled, (state, action) => {
        state.membersByOrganization[action.meta.arg] = { items: action.payload, status: 'succeeded', error: null };
      })
      .addCase(fetchOrganizationMembers.rejected, (state, action) => {
        // The entry may be gone if the user signed out while the request was running.
        const previous = state.membersByOrganization[action.meta.arg];
        state.membersByOrganization[action.meta.arg] = { items: previous?.items ?? [], status: 'failed', error: action.error.message };
      });
  },
});

const emptyMembers = { items: [], status: 'idle', error: null };

export const selectOrganizationsState = (state) => state.organizations;
export const selectOrganizationById = (state, id) => state.organizations.items.find((item) => item.id === id);
export const selectMembersOf = (state, organizationId) =>
  state.organizations.membersByOrganization[organizationId] ?? emptyMembers;

export default organizationsSlice.reducer;
