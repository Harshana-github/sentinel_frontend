import { createSlice } from '@reduxjs/toolkit';
import { ACTIVE_SCAN_STATUSES } from '../../utils/constants';
import { addLoadCases, loadState, replaceItem } from '../sliceHelpers';
import { cancelAssessment, fetchAssessments, startAssessment } from './assessmentsThunks';

// An assessment is active while any of its jobs is, and its status says so.
export const isActiveAssessment = (assessment) => ACTIVE_SCAN_STATUSES.includes(assessment.status);

const assessmentsSlice = createSlice({
  name: 'assessments',
  initialState: loadState(),
  reducers: {},
  extraReducers: (builder) => {
    addLoadCases(builder, fetchAssessments);
    builder
      .addCase(startAssessment.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(cancelAssessment.fulfilled, (state, action) => {
        state.items = replaceItem(state.items, action.payload);
      });
  },
});

export const selectAssessmentsState = (state) => state.assessments;
export const selectAssessmentById = (state, id) => state.assessments.items.find((item) => item.id === id);

export default assessmentsSlice.reducer;
