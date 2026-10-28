import { createSlice } from '@reduxjs/toolkit';
import { addLoadCases, loadState, removeItem, replaceItem } from '../sliceHelpers';
import { createRole, deleteRole, fetchPermissionCatalog, fetchRoles, updateRole } from './rolesThunks';

const rolesSlice = createSlice({
  name: 'roles',
  // `catalog` is every module and permission a role can be given.
  initialState: { ...loadState(), catalog: loadState({ modules: [], permissions: [] }) },
  reducers: {},
  extraReducers: (builder) => {
    addLoadCases(builder, fetchRoles);
    addLoadCases(builder, fetchPermissionCatalog, { select: (state) => state.catalog, field: null });
    builder
      .addCase(createRole.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(updateRole.fulfilled, (state, action) => {
        state.items = replaceItem(state.items, action.payload);
      })
      .addCase(deleteRole.fulfilled, (state, action) => {
        state.items = removeItem(state.items, action.payload);
      });
  },
});

export const selectRolesState = (state) => state.roles;

export default rolesSlice.reducer;
