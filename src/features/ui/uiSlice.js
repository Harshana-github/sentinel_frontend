import { createSlice, nanoid } from '@reduxjs/toolkit';
import { readStoredLanguage, storeLanguage } from '../../i18n';
import { readTheme, storeTheme } from '../../utils/theme';

// Toast notifications shown after user actions, the UI language and the colour theme.
const uiSlice = createSlice({
  name: 'ui',
  // A function, so the saved language and theme are read again after sign-out resets all state.
  initialState: () => ({ toasts: [], language: readStoredLanguage(), theme: readTheme() }),
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
    themeChanged(state, action) {
      state.theme = action.payload;
    },
  },
});

export const { showToast, dismissToast } = uiSlice.actions;
export const selectToasts = (state) => state.ui.toasts;

export const changeLanguage = (code) => (dispatch) => {
  storeLanguage(code);
  dispatch(uiSlice.actions.languageChanged(code));
};

export const changeTheme = (theme) => (dispatch) => {
  storeTheme(theme);
  dispatch(uiSlice.actions.themeChanged(theme));
};

export default uiSlice.reducer;
