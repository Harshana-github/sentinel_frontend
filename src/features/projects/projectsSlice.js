import { createSlice } from '@reduxjs/toolkit';
import { addLoadCases, loadState, replaceItem } from '../sliceHelpers';
import { addScanTarget, createProject, deleteProject, fetchProjects, updateProject } from './projectsThunks';

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
      .addCase(updateProject.fulfilled, (state, action) => {
        state.items = replaceItem(state.items, action.payload);
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.items = state.items.filter((project) => String(project.id) !== String(action.meta.arg));
      })
      .addCase(addScanTarget.fulfilled, (state, action) => {
        state.items = replaceItem(state.items, action.payload);
      });
  },
});

export const selectProjectsState = (state) => state.projects;
// `id` may come from the URL, where it is a string.
export const selectProjectById = (state, id) => state.projects.items.find((project) => String(project.id) === String(id));

export default projectsSlice.reducer;
