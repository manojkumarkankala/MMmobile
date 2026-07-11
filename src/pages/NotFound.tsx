import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="container-x py-20 text-center">
      <p className="font-display text-8xl font-extrabold text-gradient">404</p>
      <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-950 text-brand-600 grid place-items-center mx-auto my-6"><Compass className="w-8 h-8" /></div>
      <h1 className="font-display text-2xl font-bold mb-2">Page Not Found</h1>
      <p className="text-ink-500 mb-6">The page you're looking for doesn't exist or has moved.</p>
      <Link to="/" className="btn-primary">Back to Home</Link>
    </div>
  );
}
