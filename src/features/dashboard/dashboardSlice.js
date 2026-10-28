import { createSlice } from '@reduxjs/toolkit';
import { fetchDashboardSummary } from './dashboardThunks';

const initialState = {
  summary: null,
  status: 'idle',
  error: null,
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardSummary.pending, (state, action) => {
        if (action.meta.arg?.silent) return;
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchDashboardSummary.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.error = null;
        state.summary = action.payload;
      })
      .addCase(fetchDashboardSummary.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  },
});

export const selectDashboardState = (state) => state.dashboard;

export default dashboardSlice.reducer;
