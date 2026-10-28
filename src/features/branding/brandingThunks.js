import { createAsyncThunk } from '@reduxjs/toolkit';
import api, { callApi } from '../../services/api';
import * as mockApi from '../../mocks/mockApi';

// Public, so the login page can show the product name and logo.
export const fetchBranding = createAsyncThunk(
  'branding/fetch',
  () =>
    callApi(
      () => mockApi.getBranding(),
      () => api.get('/branding'),
    ),
  { condition: (_arg, { getState }) => getState().branding.status !== 'loading' },
);

// Super Admin only.
export const updateBranding = createAsyncThunk('branding/update', (branding) =>
  callApi(
    () => mockApi.updateBranding(branding),
    () => api.put('/admin/branding', branding),
  ),
);
