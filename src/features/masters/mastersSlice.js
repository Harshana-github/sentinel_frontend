import { createSlice } from '@reduxjs/toolkit';
import { MASTER_LISTS, STATUS_CATEGORIES } from '../../utils/constants';
import { addLoadCases, loadState, removeItem, replaceItem } from '../sliceHelpers';
import { createMasterItem, deleteMasterItem, fetchMasterItems, updateMasterItem } from './mastersThunks';

// One { items, status, error } entry per master data list and status category.
const initialState = Object.fromEntries([...MASTER_LISTS, ...STATUS_CATEGORIES].map((list) => [list.key, loadState()]));

// The list a thunk works on: its argument is the list key, or { list, ... }.
const listOf = (state, action) => state[action.meta.arg.list ?? action.meta.arg];

const mastersSlice = createSlice({
  name: 'masters',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    addLoadCases(builder, fetchMasterItems, { select: listOf });
    builder
      .addCase(createMasterItem.fulfilled, (state, action) => {
        listOf(state, action).items.push(action.payload);
      })
      .addCase(updateMasterItem.fulfilled, (state, action) => {
        const list = listOf(state, action);
        list.items = replaceItem(list.items, action.payload);
      })
      .addCase(deleteMasterItem.fulfilled, (state, action) => {
        const list = listOf(state, action);
        list.items = removeItem(list.items, action.payload);
      });
  },
});

export const selectMasterList = (state, list) => state.masters[list];

export default mastersSlice.reducer;
