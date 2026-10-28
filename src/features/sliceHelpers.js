// Shared reducer helpers. Every loaded resource is stored as { <data>, status, error },
// where status is 'idle' | 'loading' | 'succeeded' | 'failed'.

export const loadState = (data = { items: [] }) => ({ ...data, status: 'idle', error: null });

// Adds the pending / fulfilled / rejected cases of a thunk that loads data.
// `select(state, action)` returns the object to update (default: the slice state itself) and
// `field` is where the payload goes; with `field: null` the payload's keys are merged in.
// A thunk called with { silent: true } (background polling) does not show a loading state.
export function addLoadCases(builder, thunk, { select = (state) => state, field = 'items' } = {}) {
  builder
    .addCase(thunk.pending, (state, action) => {
      if (action.meta.arg?.silent) return;
      const target = select(state, action);
      target.status = 'loading';
      target.error = null;
    })
    .addCase(thunk.fulfilled, (state, action) => {
      const target = select(state, action);
      if (field) target[field] = action.payload;
      else Object.assign(target, action.payload);
      target.status = 'succeeded';
      target.error = null;
    })
    .addCase(thunk.rejected, (state, action) => {
      const target = select(state, action);
      target.status = 'failed';
      target.error = action.error.message;
    });
}

export const replaceItem = (items, updated, key = 'id') => items.map((item) => (item[key] === updated[key] ? updated : item));
export const removeItem = (items, removed, key = 'id') => items.filter((item) => item[key] !== removed[key]);
