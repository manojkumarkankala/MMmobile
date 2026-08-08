import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Phone, UserPlus, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Signup() {
  const { signUp } = useAuth();
  const { toast } = useToast();
  const nav = useNavigate();

  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', confirm: '' });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    const { error } = await signUp(form.email, form.password, form.fullName, form.phone);
    setLoading(false);
    if (error) { setError(error); toast(error, 'error'); }
    else { toast('Account created! Welcome to MMMobiles.'); nav('/account'); }
  };

  return (
    <div className="container-x py-12 page-fill">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-600 to-accent-500 text-white grid place-items-center mx-auto mb-3"><UserPlus className="w-7 h-7" /></div>
          <h1 className="font-display text-2xl font-bold">Create Account</h1>
          <p className="text-sm text-ink-500">Join MMMobiles for the best mobile shopping experience</p>
        </div>

        <form onSubmit={submit} className="card p-6 space-y-4">
          {error && <div className="flex items-center gap-2 p-3 rounded-lg bg-error-50 dark:bg-error-950 text-error-700 dark:text-error-400 text-sm"><AlertCircle className="w-4 h-4" /> {error}</div>}

          <div>
            <label className="label">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
              <input required value={form.fullName} onChange={(e) => setForm(f => ({ ...f, fullName: e.target.value }))} className="input pl-10" placeholder="John Doe" />
            </div>
          </div>

          <div>
            <label className="label">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
              <input type="email" required value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} className="input pl-10" placeholder="you@example.com" />
            </div>
          </div>

          <div>
            <label className="label">Phone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
              <input type="tel" required value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} className="input pl-10" placeholder="+91 90000 00000" />
            </div>
          </div>

          <div>
            <label className="label">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
              <input type={show ? 'text' : 'password'} required value={form.password} onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))} className="input pl-10 pr-10" placeholder="Min 6 characters" />
              <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700">
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="label">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
              <input type={show ? 'text' : 'password'} required value={form.confirm} onChange={(e) => setForm(f => ({ ...f, confirm: e.target.value }))} className="input pl-10" placeholder="Re-enter password" />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full !py-3">
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-ink-600 dark:text-ink-300 mt-4">
          Already have an account? <Link to="/login" className="text-brand-600 font-semibold hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
}
