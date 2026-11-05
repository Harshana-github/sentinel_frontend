import { createAsyncThunk } from '@reduxjs/toolkit';
import api, { callApi } from '../../services/api';
import * as mockApi from '../../mocks/mockApi';

export const fetchProjects = createAsyncThunk('projects/fetchAll', () =>
  callApi(
    () => mockApi.getProjects(),
    () => api.get('/projects'),
  ),
);

export const createProject = createAsyncThunk('projects/create', (project) =>
  callApi(
    () => mockApi.createProject(project),
    () => api.post('/projects', project),
  ),
);

export const updateProject = createAsyncThunk('projects/update', ({ projectId, changes }) =>
  callApi(
    () => mockApi.updateProject(projectId, changes),
    () => api.patch(`/projects/${projectId}`, changes),
  ),
);

export const deleteProject = createAsyncThunk('projects/delete', (projectId) =>
  callApi(
    () => mockApi.deleteProject(projectId),
    () => api.delete(`/projects/${projectId}`),
  ),
);

export const addScanTarget = createAsyncThunk('projects/addTarget', ({ projectId, target }) =>
  callApi(
    () => mockApi.addScanTarget(projectId, target),
    () => api.post(`/projects/${projectId}/targets`, target),
  ),
);
