import { createAsyncThunk } from '@reduxjs/toolkit';
import api, { callApi } from '../../services/api';
import * as mockApi from '../../mocks/mockApi';
import { clearStoredAuth, saveStoredAuth } from '../../utils/authStorage';

// POST /auth/login returns { accessToken, user }.
export const login = createAsyncThunk('auth/login', async ({ identifier, password }) => {
  const session = await callApi(
    () => mockApi.login({ identifier, password }),
    () => api.post('/auth/login', { identifier, password }),
  );
  saveStoredAuth(session);
  return session;
});

export const logout = createAsyncThunk('auth/logout', async () => {
  clearStoredAuth();
});
