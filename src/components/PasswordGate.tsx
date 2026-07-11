import { useState } from 'react';
import { Lock, ShieldCheck, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const PORTAL_PASSWORD = 'MMMOBILE@123';
const SESSION_KEY = 'mm-portal-auth';

export function usePortalAccess(portal: string): [boolean, () => void] {
  const [unlocked, setUnlocked] = useState(() => {
    try { return sessionStorage.getItem(`${SESSION_KEY}-${portal}`) === '1'; } catch { return false; }
  });
  const grant = () => {
    try { sessionStorage.setItem(`${SESSION_KEY}-${portal}`, '1'); } catch { /* noop */ }
    setUnlocked(true);
  };
  return [unlocked, grant];
}

export function PasswordGate({ title, subtitle, icon, accent = 'brand', onUnlock }: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  accent?: 'brand' | 'accent';
  onUnlock: () => void;
}) {
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim() === PORTAL_PASSWORD) {
      setError('');
      onUnlock();
    } else {
      setError('Incorrect password. Access denied.');
    }
  };

  return (
    <div className="min-h-[70vh] grid place-items-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="card overflow-hidden">
          {/* Header band */}
          <div className={`px-6 pt-8 pb-6 text-center ${accent === 'accent' ? 'bg-gradient-to-br from-accent-500 to-accent-700' : 'bg-gradient-to-br from-brand-600 to-brand-800'} text-white`}>
            <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur grid place-items-center mx-auto mb-3">
              {icon}
            </div>
            <h1 className="font-display text-xl font-bold">{title}</h1>
            <p className="text-sm opacity-90 mt-1">{subtitle}</p>
          </div>

          {/* Form */}
          <form onSubmit={submit} className="p-6 space-y-4">
            <div>
              <label className="label">Portal Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                <input
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter portal password"
                  className="input pl-10 pr-10"
                  autoFocus
                />
                <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700 dark:hover:text-white">
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 p-3 rounded-lg bg-error-50 dark:bg-error-950 text-error-700 dark:text-error-400 text-sm"
              >
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </motion.div>
            )}

            <button type="submit" className={`btn w-full !py-3 ${accent === 'accent' ? 'bg-accent-600 hover:bg-accent-700 text-white' : 'btn-primary'}`}>
              <ShieldCheck className="w-4 h-4" /> Unlock Dashboard <ArrowRight className="w-4 h-4" />
            </button>

            <p className="text-xs text-center text-ink-400 flex items-center justify-center gap-1.5">
              <Lock className="w-3 h-3" /> Secured portal — authorized access only
            </p>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
