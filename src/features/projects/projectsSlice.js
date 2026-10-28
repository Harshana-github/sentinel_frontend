import { createSlice } from '@reduxjs/toolkit';
import { addLoadCases, loadState, replaceItem } from '../sliceHelpers';
import { addScanTarget, createProject, fetchProjects } from './projectsThunks';

const projectsSlice = createSlice({
  name: 'projects',
  initialState: loadState(),
  reducers: {},
  extraReducers: (builder) => {
    addLoadCases(builder, fetchProjects);
    builder
      .addCase(createProject.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(addScanTarget.fulfilled, (state, action) => {
        state.items = replaceItem(state.items, action.payload);
      });
  },
});

export const selectProjectsState = (state) => state.projects;
export const selectProjectById = (state, id) => state.projects.items.find((project) => project.id === id);

export default projectsSlice.reducer;
