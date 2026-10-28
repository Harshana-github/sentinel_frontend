import { ShieldCheck } from 'lucide-react';

// The uploaded product logo, or the default shield icon.
export default function ProductLogo({ src, size = 26, className = '' }) {
  if (src) return <img src={src} alt="" style={{ width: size, height: size }} className={`shrink-0 object-contain ${className}`} />;
  return <ShieldCheck size={size} aria-hidden="true" className={`shrink-0 ${className}`} />;
}
