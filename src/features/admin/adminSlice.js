import { createSlice } from '@reduxjs/toolkit';
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

const initialState = {
  summary: { data: null, status: 'idle', error: null },
  modules: { items: [], status: 'idle', error: null },
  permissions: { items: [], status: 'idle', error: null },
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPlatformSummary.pending, (state) => {
        state.summary.status = 'loading';
        state.summary.error = null;
      })
      .addCase(fetchPlatformSummary.fulfilled, (state, action) => {
        state.summary.status = 'succeeded';
        state.summary.data = action.payload;
      })
      .addCase(fetchPlatformSummary.rejected, (state, action) => {
        state.summary.status = 'failed';
        state.summary.error = action.error.message;
      })
      .addCase(fetchModules.pending, (state) => {
        state.modules.status = 'loading';
        state.modules.error = null;
      })
      .addCase(fetchModules.fulfilled, (state, action) => {
        state.modules.status = 'succeeded';
        state.modules.items = action.payload;
      })
      .addCase(fetchModules.rejected, (state, action) => {
        state.modules.status = 'failed';
        state.modules.error = action.error.message;
      })
      .addCase(createModule.fulfilled, (state, action) => {
        state.modules.items.push(action.payload);
      })
      .addCase(updateModule.fulfilled, (state, action) => {
        state.modules.items = state.modules.items.map((module) => (module.key === action.payload.key ? action.payload : module));
      })
      .addCase(deleteModule.fulfilled, (state, action) => {
        state.modules.items = state.modules.items.filter((module) => module.key !== action.payload.key);
        state.permissions.items = state.permissions.items.filter((permission) => permission.module !== action.payload.key);
      })
      .addCase(fetchPermissions.pending, (state) => {
        state.permissions.status = 'loading';
        state.permissions.error = null;
      })
      .addCase(fetchPermissions.fulfilled, (state, action) => {
        state.permissions.status = 'succeeded';
        state.permissions.items = action.payload;
      })
      .addCase(fetchPermissions.rejected, (state, action) => {
        state.permissions.status = 'failed';
        state.permissions.error = action.error.message;
      })
      .addCase(createPermission.fulfilled, (state, action) => {
        state.permissions.items.push(action.payload);
      })
      .addCase(updatePermission.fulfilled, (state, action) => {
        state.permissions.items = state.permissions.items.map((item) => (item.key === action.payload.key ? action.payload : item));
      })
      .addCase(deletePermission.fulfilled, (state, action) => {
        state.permissions.items = state.permissions.items.filter((item) => item.key !== action.payload.key);
      });
  },
});

export const selectPlatformSummary = (state) => state.admin.summary;
export const selectModules = (state) => state.admin.modules;
export const selectPermissions = (state) => state.admin.permissions;

export default adminSlice.reducer;
