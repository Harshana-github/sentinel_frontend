import { createSlice } from '@reduxjs/toolkit';
import { addLoadCases, loadState, removeItem, replaceItem } from '../sliceHelpers';
import {
  createModule,
  createPermission,
  deleteModule,
  deletePermission,
  fetchModules,
  fetchPermissions,
  fetchPlatformSummary,
  updateModule,
  updatePermission,
} from './adminThunks';

// Modules and permissions are identified by `key`, not `id`.
const adminSlice = createSlice({
  name: 'admin',
  initialState: {
    summary: loadState({ data: null }),
    modules: loadState(),
    permissions: loadState(),
  },
  reducers: {},
  extraReducers: (builder) => {
    addLoadCases(builder, fetchPlatformSummary, { select: (state) => state.summary, field: 'data' });
    addLoadCases(builder, fetchModules, { select: (state) => state.modules });
    addLoadCases(builder, fetchPermissions, { select: (state) => state.permissions });
    builder
      .addCase(createModule.fulfilled, (state, action) => {
        state.modules.items.push(action.payload);
      })
      .addCase(updateModule.fulfilled, (state, action) => {
        state.modules.items = replaceItem(state.modules.items, action.payload, 'key');
      })
      .addCase(deleteModule.fulfilled, (state, action) => {
        state.modules.items = removeItem(state.modules.items, action.payload, 'key');
        // A module's permissions are deleted with it.
        state.permissions.items = state.permissions.items.filter((permission) => permission.module !== action.payload.key);
      })
      .addCase(createPermission.fulfilled, (state, action) => {
        state.permissions.items.push(action.payload);
      })
      .addCase(updatePermission.fulfilled, (state, action) => {
        state.permissions.items = replaceItem(state.permissions.items, action.payload, 'key');
      })
      .addCase(deletePermission.fulfilled, (state, action) => {
        state.permissions.items = removeItem(state.permissions.items, action.payload, 'key');
      });
  },
});

export const selectPlatformSummary = (state) => state.admin.summary;
export const selectModules = (state) => state.admin.modules;
export const selectPermissions = (state) => state.admin.permissions;

export default adminSlice.reducer;
