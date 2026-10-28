import { createSlice } from '@reduxjs/toolkit';
import { addLoadCases, loadState, replaceItem } from '../sliceHelpers';
import { fetchFindings, updateFindingStatus } from './findingsThunks';

const findingsSlice = createSlice({
  name: 'findings',
  initialState: loadState(),
  reducers: {},
  extraReducers: (builder) => {
    addLoadCases(builder, fetchFindings);
    builder.addCase(updateFindingStatus.fulfilled, (state, action) => {
      state.items = replaceItem(state.items, action.payload);
    });
  },
});

export const selectFindingsState = (state) => state.findings;
export const selectFindingById = (state, id) => state.findings.items.find((finding) => finding.id === id);

export default findingsSlice.reducer;
