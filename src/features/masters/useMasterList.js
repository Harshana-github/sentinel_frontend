import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectMasterList } from './mastersSlice';
import { fetchMasterItems } from './mastersThunks';

// Loads a master data list once and returns it with lookup helpers.
// `nameOf(id)` falls back to the id while the list is loading or if the item was deleted.
export function useMasterList(list) {
  const dispatch = useDispatch();
  const state = useSelector((rootState) => selectMasterList(rootState, list));

  useEffect(() => {
    if (state.status === 'idle') dispatch(fetchMasterItems(list));
  }, [dispatch, list, state.status]);

  const find = (id) => state.items.find((item) => item.id === id);
  return { ...state, find, nameOf: (id) => find(id)?.name ?? id };
}
