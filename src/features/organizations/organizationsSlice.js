import { createSlice } from '@reduxjs/toolkit';
import {
  createMember,
  createOrganization,
  deleteMember,
  fetchOrganizationMembers,
  fetchOrganizations,
  updateMember,
  updateOrganization,
} from './organizationsThunks';
import { addLoadCases, loadState, removeItem, replaceItem } from '../sliceHelpers';

const initialState = {
  ...loadState(),
  // Members are loaded per organization: { [organizationId]: { items, status, error } }
  membersByOrganization: {},
};

const organizationsSlice = createSlice({
  name: 'organizations',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    addLoadCases(builder, fetchOrganizations);
    builder
      .addCase(createOrganization.fulfilled, (state, action) => {
        state.items.push(action.payload.organization);
      })
      .addCase(updateOrganization.fulfilled, (state, action) => {
        state.items = replaceItem(state.items, action.payload);
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
      })
      .addCase(createMember.fulfilled, (state, action) => {
        state.membersByOrganization[action.payload.organizationId]?.items.push(action.payload);
      })
      .addCase(updateMember.fulfilled, (state, action) => {
        const members = state.membersByOrganization[action.payload.organizationId];
        if (members) members.items = replaceItem(members.items, action.payload);
      })
      .addCase(deleteMember.fulfilled, (state, action) => {
        const members = state.membersByOrganization[action.payload.organizationId];
        if (members) members.items = removeItem(members.items, action.payload);
      });
  },
});

const emptyMembers = loadState();

export const selectOrganizationsState = (state) => state.organizations;
export const selectOrganizationById = (state, id) => state.organizations.items.find((item) => item.id === id);
export const selectMembersOf = (state, organizationId) => state.organizations.membersByOrganization[organizationId] ?? emptyMembers;

export default organizationsSlice.reducer;
