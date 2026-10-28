import { createSlice } from '@reduxjs/toolkit';
import { addLoadCases, loadState } from '../sliceHelpers';
import { fetchDashboardSummary } from './dashboardThunks';

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: loadState({ summary: null }),
  reducers: {},
  extraReducers: (builder) => {
    addLoadCases(builder, fetchDashboardSummary, { field: 'summary' });
  },
});

export const selectDashboardState = (state) => state.dashboard;

export default dashboardSlice.reducer;
