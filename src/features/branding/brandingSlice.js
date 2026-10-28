import { createSlice } from '@reduxjs/toolkit';
import { addLoadCases, loadState } from '../sliceHelpers';
import { fetchBranding, updateBranding } from './brandingThunks';

// Shown until the real details have loaded, so the page never flashes empty.
const DEFAULT_BRANDING = {
  productName: 'Sentinel',
  tagline: 'AI Vulnerability Scanner',
  favicon: null,
  productLogo: null,
  company: { name: '', logo: null, email: '', phone: '', website: '', address: '' },
};

const brandingSlice = createSlice({
  name: 'branding',
  initialState: loadState({ data: DEFAULT_BRANDING }),
  reducers: {},
  extraReducers: (builder) => {
    addLoadCases(builder, fetchBranding, { field: 'data' });
    builder.addCase(updateBranding.fulfilled, (state, action) => {
      state.data = action.payload;
    });
  },
});

export const selectBranding = (state) => state.branding.data;
export const selectBrandingState = (state) => state.branding;

export default brandingSlice.reducer;
