import { createAsyncThunk } from '@reduxjs/toolkit';
import api, { callMockOnly } from '../../services/api';
import * as mockApi from '../../mocks/mockApi';

// Pass { silent: true } for background polling so the page does not show a loading state.
export const fetchScans = createAsyncThunk('scans/fetchAll', () =>
  callMockOnly(
    () => mockApi.getScans(),
    () => api.get('/scans'),
  ),
);

export const startScan = createAsyncThunk('scans/start', (scanRequest) =>
  callMockOnly(
    () => mockApi.startScan(scanRequest),
    () => api.post('/scans', scanRequest),
  ),
);

// { mode: 'single' | 'full', inputs: [{ type, value }], profile, tools, authorized }.
// Needs no project: returns { kind: 'scan' | 'assessment', id } of what was queued.
export const startQuickScan = createAsyncThunk('scans/startQuick', (request) =>
  callMockOnly(
    () => mockApi.startQuickScan(request),
    () => api.post('/scans/quick', request),
  ),
);

export const cancelScan = createAsyncThunk('scans/cancel', (scanId) =>
  callMockOnly(
    () => mockApi.cancelScan(scanId),
    () => api.post(`/scans/${scanId}/cancel`),
  ),
);
