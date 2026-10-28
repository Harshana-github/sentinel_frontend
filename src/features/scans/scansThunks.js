import { createAsyncThunk } from '@reduxjs/toolkit';
import api, { callApi } from '../../services/api';
import * as mockApi from '../../mocks/mockApi';

// Pass { silent: true } for background polling so the page does not show a loading state.
export const fetchScans = createAsyncThunk('scans/fetchAll', () =>
  callApi(() => mockApi.getScans(), () => api.get('/scans')),
);

export const startScan = createAsyncThunk('scans/start', (scanRequest) =>
  callApi(() => mockApi.startScan(scanRequest), () => api.post('/scans', scanRequest)),
);

export const cancelScan = createAsyncThunk('scans/cancel', (scanId) =>
  callApi(() => mockApi.cancelScan(scanId), () => api.post(`/scans/${scanId}/cancel`)),
);
