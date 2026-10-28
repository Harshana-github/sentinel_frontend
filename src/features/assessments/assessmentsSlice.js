import { createSlice } from '@reduxjs/toolkit';
import { cancelAssessment, fetchAssessments, startAssessment } from './assessmentsThunks';

const ACTIVE_STATUSES = ['Queued', 'Running'];
export const isActiveAssessment = (assessment) => ACTIVE_STATUSES.includes(assessment.status);

const assessmentsSlice = createSlice({
  name: 'assessments',
  initialState: { items: [], status: 'idle', error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAssessments.pending, (state, action) => {
        if (action.meta.arg?.silent) return;
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchAssessments.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.error = null;
        state.items = action.payload;
      })
      .addCase(fetchAssessments.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(startAssessment.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(cancelAssessment.fulfilled, (state, action) => {
        state.items = state.items.map((item) => (item.id === action.payload.id ? action.payload : item));
      });
  },
});

export const selectAssessmentsState = (state) => state.assessments;
export const selectAssessmentById = (state, id) => state.assessments.items.find((item) => item.id === id);

export default assessmentsSlice.reducer;
