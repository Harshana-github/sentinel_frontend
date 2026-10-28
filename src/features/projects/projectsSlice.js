import { createSlice } from '@reduxjs/toolkit';
import { addScanTarget, createProject, fetchProjects } from './projectsThunks';

const initialState = {
  items: [],
  status: 'idle',
  error: null,
};

function replaceProject(state, updatedProject) {
  const index = state.items.findIndex((project) => project.id === updatedProject.id);
  if (index !== -1) state.items[index] = updatedProject;
}

const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(addScanTarget.fulfilled, (state, action) => {
        replaceProject(state, action.payload);
      });
  },
});

export const selectProjectsState = (state) => state.projects;
export const selectProjectById = (state, id) => state.projects.items.find((project) => project.id === id);

export default projectsSlice.reducer;
