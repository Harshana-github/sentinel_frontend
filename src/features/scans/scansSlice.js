import { createSlice } from '@reduxjs/toolkit';
import { ACTIVE_SCAN_STATUSES } from '../../utils/constants';
import { cancelScan, fetchScans, startScan } from './scansThunks';

const initialState = {
  items: [],
  status: 'idle',
  error: null,
};

const scansSlice = createSlice({
  name: 'scans',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchScans.pending, (state, action) => {
        if (action.meta.arg?.silent) return;
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchScans.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.error = null;
        state.items = action.payload;
      })
      .addCase(fetchScans.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(startScan.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(cancelScan.fulfilled, (state, action) => {
        const index = state.items.findIndex((scan) => scan.id === action.payload.id);
        if (index !== -1) state.items[index] = action.payload;
      });
  },
});

export const selectScansState = (state) => state.scans;
export const selectScanById = (state, id) => state.scans.items.find((scan) => scan.id === id);
export const isActiveScan = (scan) => ACTIVE_SCAN_STATUSES.includes(scan.status);

export default scansSlice.reducer;
