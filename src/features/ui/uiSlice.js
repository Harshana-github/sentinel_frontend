import { createSlice, nanoid } from '@reduxjs/toolkit';
import { readStoredLanguage, storeLanguage } from '../../i18n';

// Toast notifications shown after user actions, and the UI language.
const uiSlice = createSlice({
  name: 'ui',
  // A function, so the saved language is read again after sign-out resets all state.
  initialState: () => ({ toasts: [], language: readStoredLanguage() }),
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
    languageChanged(state, action) {
      state.language = action.payload;
    },
  },
});

export const { showToast, dismissToast } = uiSlice.actions;
export const selectToasts = (state) => state.ui.toasts;

export const changeLanguage = (code) => (dispatch) => {
  storeLanguage(code);
  dispatch(uiSlice.actions.languageChanged(code));
};

export default uiSlice.reducer;
