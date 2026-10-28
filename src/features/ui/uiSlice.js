import { createSlice, nanoid } from '@reduxjs/toolkit';

// Toast notifications shown after user actions.
const uiSlice = createSlice({
  name: 'ui',
  initialState: { toasts: [] },
  reducers: {
    showToast: {
      reducer(state, action) {
        state.toasts.push(action.payload);
      },
      prepare({ type = 'success', message }) {
        return { payload: { id: nanoid(), type, message } };
      },
    },
    dismissToast(state, action) {
      state.toasts = state.toasts.filter((toast) => toast.id !== action.payload);
    },
  },
});

export const { showToast, dismissToast } = uiSlice.actions;
export const selectToasts = (state) => state.ui.toasts;

export default uiSlice.reducer;
