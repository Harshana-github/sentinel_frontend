import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectBrandingState } from './brandingSlice';
import { fetchBranding } from './brandingThunks';

const DEFAULT_FAVICON = '/favicon.svg';

// Loads the product details and keeps the browser tab title and favicon in sync with them.
export default function BrandingEffect() {
  const dispatch = useDispatch();
  const { data, status } = useSelector(selectBrandingState);

  useEffect(() => {
    if (status === 'idle') dispatch(fetchBranding());
  }, [dispatch, status]);

  useEffect(() => {
    document.title = data.tagline ? `${data.productName} | ${data.tagline}` : data.productName;
    const link = document.querySelector('link[rel="icon"]');
    if (link) {
      link.href = data.favicon ?? DEFAULT_FAVICON;
      link.type = data.favicon ? data.favicon.slice(5, data.favicon.indexOf(';')) : 'image/svg+xml';
    }
  }, [data.productName, data.tagline, data.favicon]);

  return null;
}
