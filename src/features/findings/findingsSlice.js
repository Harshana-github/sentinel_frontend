import { createSlice } from '@reduxjs/toolkit';
import { fetchFindings, updateFindingStatus } from './findingsThunks';

const initialState = {
  items: [],
  status: 'idle',
  error: null,
};

const findingsSlice = createSlice({
  name: 'findings',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFindings.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchFindings.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchFindings.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(updateFindingStatus.fulfilled, (state, action) => {
        const index = state.items.findIndex((finding) => finding.id === action.payload.id);
        if (index !== -1) state.items[index] = action.payload;
      });
  },
});

export const selectFindingsState = (state) => state.findings;
export const selectFindingById = (state, id) => state.findings.items.find((finding) => finding.id === id);

export default findingsSlice.reducer;
