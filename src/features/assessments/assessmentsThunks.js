import { createAsyncThunk } from '@reduxjs/toolkit';
import api, { callApi } from '../../services/api';
import * as mockApi from '../../mocks/mockApi';

// Pass { silent: true } for background polling so the page does not show a loading state.
export const fetchAssessments = createAsyncThunk('assessments/fetchAll', () =>
  callApi(
    () => mockApi.getAssessments(),
    () => api.get('/assessments'),
  ),
);

// { projectId, profile, name, targetIds, authorized }. Returns the assessment with its jobs queued.
export const startAssessment = createAsyncThunk('assessments/start', (request) =>
  callApi(
    () => mockApi.startAssessment(request),
    () => api.post('/assessments', request),
  ),
);

export const cancelAssessment = createAsyncThunk('assessments/cancel', (assessmentId) =>
  callApi(
    () => mockApi.cancelAssessment(assessmentId),
    () => api.post(`/assessments/${assessmentId}/cancel`),
  ),
);
