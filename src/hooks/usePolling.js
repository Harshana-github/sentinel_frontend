import { useEffect } from 'react';

// Calls `onTick` every `intervalMs` while `enabled` is true.
// Pass a stable callback (wrap it in useCallback) so the timer is not restarted on every render.
export default function usePolling(onTick, enabled, intervalMs = 2000) {
  useEffect(() => {
    if (!enabled) return undefined;
    const timer = setInterval(onTick, intervalMs);
    return () => clearInterval(timer);
  }, [onTick, enabled, intervalMs]);
}
