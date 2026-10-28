import { createAsyncThunk } from '@reduxjs/toolkit';
import api, { callApi } from '../../services/api';
import * as mockApi from '../../mocks/mockApi';

export const fetchFindings = createAsyncThunk('findings/fetchAll', () =>
  callApi(
    () => mockApi.getFindings(),
    () => api.get('/findings'),
  ),
);

export const updateFindingStatus = createAsyncThunk('findings/updateStatus', ({ findingId, status }) =>
  callApi(
    () => mockApi.updateFindingStatus(findingId, status),
    () => api.patch(`/findings/${findingId}`, { status }),
  ),
);
