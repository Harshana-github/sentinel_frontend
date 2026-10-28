import { createSlice } from '@reduxjs/toolkit';
import { loadStoredAuth } from '../../utils/authStorage';
import { login } from './authThunks';

// A function, so the store reads the saved session again after sign-out resets all state.
function initialState() {
  const storedSession = loadStoredAuth();
  return {
    user: storedSession?.user ?? null,
    accessToken: storedSession?.accessToken ?? null,
    status: 'idle',
    error: null,
  };
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  },
});

export const { clearAuthError } = authSlice.actions;

export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => Boolean(state.auth.accessToken);

export default authSlice.reducer;
