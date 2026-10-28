const TONE_CLASSES = {
  error: 'border-red-300 bg-red-50 text-red-900',
  info: 'border-blue-300 bg-blue-50 text-blue-900',
};

// Errors are announced to screen readers straight away; info messages are not.
export default function Alert({ tone = 'info', className = '', children }) {
  return (
    <div role={tone === 'error' ? 'alert' : undefined} className={`rounded-md border px-3.5 py-2.5 ${TONE_CLASSES[tone]} ${className}`}>
      {children}
    </div>
  );
}
