import { createSlice } from '@reduxjs/toolkit';
import { deleteScannerModule, fetchScannerModules, registerScannerModule, updateScannerModule } from './scannersThunks';

const initialState = {
  items: [],
  status: 'idle',
  error: null,
};

const scannersSlice = createSlice({
  name: 'scanners',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchScannerModules.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchScannerModules.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchScannerModules.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(registerScannerModule.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(updateScannerModule.fulfilled, (state, action) => {
        state.items = state.items.map((item) => (item.id === action.payload.id ? action.payload : item));
      })
      .addCase(deleteScannerModule.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item.id !== action.payload.id);
      });
  },
});

export const selectScannersState = (state) => state.scanners;

export default scannersSlice.reducer;
