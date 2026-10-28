import axios from 'axios';
import { clearStoredAuth, loadStoredAuth } from '../utils/authStorage';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

// Mock mode is the default so the app runs without a backend.
// Set VITE_USE_MOCK_DATA=false to send real requests.
export const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA !== 'false';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const accessToken = loadStoredAuth()?.accessToken;
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Every failed request rejects with a plain Error whose message is safe to show to the user.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && window.location.pathname !== '/login') {
      clearStoredAuth();
      window.location.assign('/login');
    }
    return Promise.reject(new Error(getErrorMessage(error)));
  },
);

export function getErrorMessage(error) {
  if (error.response) {
    // FastAPI returns errors as { detail: "..." } or, for validation errors, { detail: [{ msg }] }.
    const detail = error.response.data?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg;
    return `Request failed with status ${error.response.status}.`;
  }
  if (error.code === 'ECONNABORTED') return 'The request timed out. Please try again.';
  if (error.request) return `Cannot reach the API at ${API_BASE_URL}.`;
  return error.message || 'Something went wrong.';
}

// Runs the mock handler in mock mode, otherwise the real request, and returns the response body.
export async function callApi(mockHandler, apiRequest) {
  if (USE_MOCK_DATA) return mockHandler();
  const response = await apiRequest();
  return response.data;
}

export default api;
