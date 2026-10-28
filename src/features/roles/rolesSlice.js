import { createSlice } from '@reduxjs/toolkit';
import { createRole, deleteRole, fetchPermissionCatalog, fetchRoles, updateRole } from './rolesThunks';

const initialState = {
  items: [],
  status: 'idle',
  error: null,
  catalog: { modules: [], permissions: [], status: 'idle', error: null },
};

const rolesSlice = createSlice({
  name: 'roles',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRoles.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchRoles.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchRoles.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(fetchPermissionCatalog.pending, (state) => {
        state.catalog.status = 'loading';
        state.catalog.error = null;
      })
      .addCase(fetchPermissionCatalog.fulfilled, (state, action) => {
        state.catalog = { ...action.payload, status: 'succeeded', error: null };
      })
      .addCase(fetchPermissionCatalog.rejected, (state, action) => {
        state.catalog.status = 'failed';
        state.catalog.error = action.error.message;
      })
      .addCase(createRole.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(updateRole.fulfilled, (state, action) => {
        state.items = state.items.map((role) => (role.id === action.payload.id ? action.payload : role));
      })
      .addCase(deleteRole.fulfilled, (state, action) => {
        state.items = state.items.filter((role) => role.id !== action.payload.id);
      });
  },
});

export const selectRolesState = (state) => state.roles;

export default rolesSlice.reducer;
