import { createAsyncThunk } from '@reduxjs/toolkit';
import api, { callApi } from '../../services/api';
import * as mockApi from '../../mocks/mockApi';

export const fetchScannerModules = createAsyncThunk('scanners/fetchAll', () =>
  callApi(() => mockApi.getScannerModules(), () => api.get('/scanner-modules')),
);

// Super Admin only.

export const registerScannerModule = createAsyncThunk('scanners/register', (plugin) =>
  callApi(() => mockApi.registerScannerModule(plugin), () => api.post('/scanner-modules', plugin)),
);

export const updateScannerModule = createAsyncThunk('scanners/update', ({ id, changes }) =>
  callApi(() => mockApi.updateScannerModule(id, changes), () => api.patch(`/scanner-modules/${id}`, changes)),
);

export const deleteScannerModule = createAsyncThunk('scanners/delete', (id) =>
  callApi(() => mockApi.deleteScannerModule(id), () => api.delete(`/scanner-modules/${id}`)),
);
