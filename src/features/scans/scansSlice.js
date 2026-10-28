import { createSlice } from '@reduxjs/toolkit';
import { ACTIVE_SCAN_STATUSES } from '../../utils/constants';
import { addLoadCases, loadState, replaceItem } from '../sliceHelpers';
import { cancelScan, fetchScans, startScan } from './scansThunks';

const scansSlice = createSlice({
  name: 'scans',
  initialState: loadState(),
  reducers: {},
  extraReducers: (builder) => {
    addLoadCases(builder, fetchScans);
    builder
      .addCase(startScan.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(cancelScan.fulfilled, (state, action) => {
        state.items = replaceItem(state.items, action.payload);
      });
  },
});

export const selectScansState = (state) => state.scans;
export const selectScanById = (state, id) => state.scans.items.find((scan) => scan.id === id);
export const isActiveScan = (scan) => ACTIVE_SCAN_STATUSES.includes(scan.status);

export default scansSlice.reducer;
