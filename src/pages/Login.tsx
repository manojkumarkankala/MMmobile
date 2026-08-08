import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, LogIn, Eye, EyeOff, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Login() {
  const { signIn } = useAuth();
  const { toast } = useToast();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get('redirect') || '/account';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) { setError(error); toast(error, 'error'); }
    else { toast('Welcome back!'); nav(redirect); }
  };

  return (
    <div className="container-x py-12 page-fill">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-brand-600 text-white grid place-items-center mx-auto mb-3"><LogIn className="w-7 h-7" /></div>
          <h1 className="font-display text-2xl font-bold">Welcome Back</h1>
          <p className="text-sm text-ink-500">Login to your MMMobiles account</p>
        </div>

        <form onSubmit={submit} className="card p-6 space-y-4">
          {error && <div className="flex items-center gap-2 p-3 rounded-lg bg-error-50 dark:bg-error-950 text-error-700 dark:text-error-400 text-sm"><AlertCircle className="w-4 h-4" /> {error}</div>}

          <div>
            <label className="label">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input pl-10" placeholder="you@example.com" />
            </div>
          </div>

          <div>
            <label className="label">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
              <input type={show ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} className="input pl-10 pr-10" placeholder="••••••••" />
              <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700">
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full !py-3">
            {loading ? 'Signing in…' : 'Login'}
          </button>

          <p className="text-xs text-center text-ink-500 flex items-center justify-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Secured with encrypted JWT auth</p>
        </form>

        <p className="text-center text-sm text-ink-600 dark:text-ink-300 mt-4">
          New to MMMobiles? <Link to="/signup" className="text-brand-600 font-semibold hover:underline">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
