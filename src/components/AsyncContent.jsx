import Alert from './Alert';
import { ErrorState, LoadingState } from './StateMessage';

// Shows a loading or error state until data is available. Once data exists, a failed
// refresh keeps the old data on screen and adds a small warning above it.
export default function AsyncContent({ status, error, hasData, onRetry, children }) {
  if (!hasData && (status === 'idle' || status === 'loading')) return <LoadingState />;
  if (!hasData && status === 'failed') return <ErrorState message={error} onRetry={onRetry} />;

  return (
    <>
      {status === 'failed' && (
        <Alert tone="error" className="m-4">
          Could not refresh the data: {error}
        </Alert>
      )}
      {children}
    </>
  );
}
