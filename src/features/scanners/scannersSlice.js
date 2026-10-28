import { createSlice } from '@reduxjs/toolkit';
import { addLoadCases, loadState, removeItem, replaceItem } from '../sliceHelpers';
import { deleteScannerModule, fetchScannerModules, registerScannerModule, updateScannerModule } from './scannersThunks';

const scannersSlice = createSlice({
  name: 'scanners',
  initialState: loadState(),
  reducers: {},
  extraReducers: (builder) => {
    addLoadCases(builder, fetchScannerModules);
    builder
      .addCase(registerScannerModule.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(updateScannerModule.fulfilled, (state, action) => {
        state.items = replaceItem(state.items, action.payload);
      })
      .addCase(deleteScannerModule.fulfilled, (state, action) => {
        state.items = removeItem(state.items, action.payload);
      });
  },
});

export const selectScannersState = (state) => state.scanners;

export default scannersSlice.reducer;
