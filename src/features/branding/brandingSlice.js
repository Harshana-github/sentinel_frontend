import { createSlice } from '@reduxjs/toolkit';
import { fetchBranding, updateBranding } from './brandingThunks';

// Shown until the real details have loaded, so the page never flashes empty.
export const DEFAULT_BRANDING = {
  productName: 'Sentinel',
  tagline: 'AI Vulnerability Scanner',
  favicon: null,
  productLogo: null,
  company: { name: '', logo: null, email: '', phone: '', website: '', address: '' },
};

const brandingSlice = createSlice({
  name: 'branding',
  initialState: { data: DEFAULT_BRANDING, status: 'idle', error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBranding.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchBranding.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.data = action.payload;
      })
      .addCase(fetchBranding.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(updateBranding.fulfilled, (state, action) => {
        state.data = action.payload;
      });
  },
});

export const selectBranding = (state) => state.branding.data;
export const selectBrandingState = (state) => state.branding;

export default brandingSlice.reducer;
