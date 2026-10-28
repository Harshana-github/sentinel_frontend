import { createSlice } from '@reduxjs/toolkit';
import { MASTER_LISTS, STATUS_CATEGORIES } from '../../utils/constants';
import { createMasterItem, deleteMasterItem, fetchMasterItems, updateMasterItem } from './mastersThunks';

const EMPTY_LIST = { items: [], status: 'idle', error: null };

// One { items, status, error } entry per master data list and status category.
const initialState = Object.fromEntries([...MASTER_LISTS, ...STATUS_CATEGORIES].map((list) => [list.key, EMPTY_LIST]));

const mastersSlice = createSlice({
  name: 'masters',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMasterItems.pending, (state, action) => {
        state[action.meta.arg].status = 'loading';
        state[action.meta.arg].error = null;
      })
      .addCase(fetchMasterItems.fulfilled, (state, action) => {
        state[action.meta.arg].status = 'succeeded';
        state[action.meta.arg].items = action.payload;
      })
      .addCase(fetchMasterItems.rejected, (state, action) => {
        state[action.meta.arg].status = 'failed';
        state[action.meta.arg].error = action.error.message;
      })
      .addCase(createMasterItem.fulfilled, (state, action) => {
        state[action.meta.arg.list].items.push(action.payload);
      })
      .addCase(updateMasterItem.fulfilled, (state, action) => {
        const list = state[action.meta.arg.list];
        list.items = list.items.map((item) => (item.id === action.payload.id ? action.payload : item));
      })
      .addCase(deleteMasterItem.fulfilled, (state, action) => {
        const list = state[action.meta.arg.list];
        list.items = list.items.filter((item) => item.id !== action.payload.id);
      });
  },
});

export const selectMasterList = (state, list) => state.masters[list];

export default mastersSlice.reducer;
