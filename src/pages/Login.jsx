import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Loader2, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { CONTACT } from '../data/siteContent';

const Login = () => {
  const { login, sendVerification, isOwner, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  if (isOwner) return <Navigate to="/admin" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const cred = await login(email.trim(), password);
      if (cred.user && !cred.user.emailVerified) {
        // Best-effort: send a verification link so admin writes are allowed.
        try {
          await sendVerification();
        } catch {
          // Ignore send failures (e.g. rate limiting); login still succeeds.
        }
        toast.success(
          'Signed in! Check your inbox to verify your email, then sign in again to edit content.',
        );
      } else {
        toast.success('Welcome back, Coach!');
      }
      navigate('/admin');
    } catch (err) {
      const code = err?.code || '';
      toast.error(
        code.includes('invalid') || code.includes('wrong')
          ? 'Invalid email or password.'
          : err.message || 'Login failed.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-forest px-5">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-lime hover:text-white"
        >
          <ArrowLeft size={16} /> Back to site
        </Link>

        <div className="card p-8">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-forest text-lime">
              <Lock size={20} />
            </span>
            <div>
              <h1 className="font-display text-xl text-forest">Owner Login</h1>
              <p className="text-xs text-forest-700/60">{CONTACT.brand} admin</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="eli@elitenniskc.com"
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="btn-primary w-full disabled:opacity-50"
            >
              {busy ? <Loader2 size={18} className="animate-spin" /> : 'Sign in'}
            </button>
          </form>

          {user && !isOwner && (
            <p className="mt-4 rounded-xl bg-red-50 p-3 text-center text-xs text-red-600">
              This account isn't the registered owner.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
