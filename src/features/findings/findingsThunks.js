import { createAsyncThunk } from '@reduxjs/toolkit';
import api, { callMockOnly } from '../../services/api';
import * as mockApi from '../../mocks/mockApi';

export const fetchFindings = createAsyncThunk('findings/fetchAll', () =>
  callMockOnly(
    () => mockApi.getFindings(),
    () => api.get('/findings'),
  ),
);

export const updateFindingStatus = createAsyncThunk('findings/updateStatus', ({ findingId, status }) =>
  callMockOnly(
    () => mockApi.updateFindingStatus(findingId, status),
    () => api.patch(`/findings/${findingId}`, { status }),
  ),
);
