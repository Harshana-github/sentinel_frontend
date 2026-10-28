import { createAsyncThunk } from '@reduxjs/toolkit';
import api, { callApi } from '../../services/api';
import * as mockApi from '../../mocks/mockApi';

// Master data lists (keys of MASTER_LISTS). Anyone signed in can read; only the Super Admin can change them.

// Skipped while the same list is already loading, so several components can ask for it.
export const fetchMasterItems = createAsyncThunk(
  'masters/fetch',
  (list) => callApi(() => mockApi.getMasterItems(list), () => api.get(`/masters/${list}`)),
  { condition: (list, { getState }) => getState().masters[list]?.status !== 'loading' },
);

export const createMasterItem = createAsyncThunk('masters/create', ({ list, item }) =>
  callApi(() => mockApi.createMasterItem(list, item), () => api.post(`/admin/masters/${list}`, item)),
);

export const updateMasterItem = createAsyncThunk('masters/update', ({ list, id, changes }) =>
  callApi(() => mockApi.updateMasterItem(list, id, changes), () => api.put(`/admin/masters/${list}/${id}`, changes)),
);

export const deleteMasterItem = createAsyncThunk('masters/delete', ({ list, id }) =>
  callApi(() => mockApi.deleteMasterItem(list, id), () => api.delete(`/admin/masters/${list}/${id}`)),
);
