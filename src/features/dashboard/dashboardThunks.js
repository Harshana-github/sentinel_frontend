import { createAsyncThunk } from '@reduxjs/toolkit';
import api, { callApi } from '../../services/api';
import * as mockApi from '../../mocks/mockApi';

// Pass { silent: true } for background polling so the page does not show a loading state.
export const fetchDashboardSummary = createAsyncThunk('dashboard/fetchSummary', () =>
  callApi(() => mockApi.getDashboardSummary(), () => api.get('/dashboard/summary')),
);
