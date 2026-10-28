import { createAsyncThunk } from '@reduxjs/toolkit';
import api, { callApi } from '../../services/api';
import * as mockApi from '../../mocks/mockApi';
import { clearStoredAuth, saveStoredAuth } from '../../utils/authStorage';

// API mode expects POST /auth/login to return { accessToken, user }.
// Adjust this once the FastAPI authentication contract is defined.
export const login = createAsyncThunk('auth/login', async ({ identifier, password }) => {
  const session = await callApi(
    () => mockApi.login({ identifier, password }),
    () => api.post('/auth/login', { username: identifier, password }),
  );
  saveStoredAuth(session);
  return session;
});

export const logout = createAsyncThunk('auth/logout', async () => {
  clearStoredAuth();
});
