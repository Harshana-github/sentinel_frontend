import { createAsyncThunk } from '@reduxjs/toolkit';
import api, { callMockOnly } from '../../services/api';
import * as mockApi from '../../mocks/mockApi';

export const fetchProjects = createAsyncThunk('projects/fetchAll', () =>
  callMockOnly(
    () => mockApi.getProjects(),
    () => api.get('/projects'),
  ),
);

export const createProject = createAsyncThunk('projects/create', (project) =>
  callMockOnly(
    () => mockApi.createProject(project),
    () => api.post('/projects', project),
  ),
);

export const addScanTarget = createAsyncThunk('projects/addTarget', ({ projectId, target }) =>
  callMockOnly(
    () => mockApi.addScanTarget(projectId, target),
    () => api.post(`/projects/${projectId}/targets`, target),
  ),
);
