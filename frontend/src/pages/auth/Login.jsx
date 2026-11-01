import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useReducedMotion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import './Login.css';

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function Login() {
  const navigate = useNavigate();
  const { login, signup, user } = useAuth();
  const reduce = useReducedMotion();
  const [mode, setMode] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    remember: false,
  });

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setForgotMsg('');

    if (!validateEmail(form.email)) { setError('Please enter a valid email address.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }

    if (mode === 'signup') {
      if (!form.name.trim()) { setError('Full name is required.'); return; }
      if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return; }
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await signup(form.name, form.email, form.password);
      }
      setSuccess(mode === 'login' ? 'Signed in successfully.' : 'Account created successfully.');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = () => {
    if (!validateEmail(form.email)) {
      setForgotMsg('Enter your email above to request a reset link.');
      return;
    }
    setForgotMsg('Password reset instructions have been recorded for your account.');
  };

  return (
    <>
    <div className="stickmen-layer">
      {[0,1,2,3,4].map((i) => (
        <div key={i} className={`stickman stickman-${i}`}>
          <svg viewBox="0 0 24 40" width="20" height="34">
            <circle cx="12" cy="6" r="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <line x1="12" y1="10" x2="12" y2="24" stroke="currentColor" strokeWidth="1.5" />
            <line x1="12" y1="14" x2="6" y2="20" stroke="currentColor" strokeWidth="1.5" />
            <line x1="12" y1="14" x2="18" y2="12" stroke="currentColor" strokeWidth="1.5" />
            <line x1="12" y1="24" x2="8" y2="34" stroke="currentColor" strokeWidth="1.5" />
            <line x1="12" y1="24" x2="16" y2="34" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </div>
      ))}
    </div>
    <div className="auth-root">
      <div className="auth-left">
        <div className="auth-brand">
          <div className="auth-logo">PB</div>
          <div>
            <div className="auth-brand-title">PROJECT BRAIN</div>
            <div className="auth-brand-sub">DELIVERY MEMORY SYSTEM</div>
          </div>
        </div>
        <div className="auth-left-content">
          <h1 className="auth-left-heading">Preserve Knowledge. Accelerate Intelligence.</h1>
          <p className="auth-left-sub">Your team's engineering knowledge, connected, organized, and always accessible.</p>
          <div className="auth-tech-blitz">TECH-BLITZ</div>
        </div>
        <div className="auth-left-glow" />
      </div>

      <div className="auth-right">
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            className="auth-form-wrap"
            initial={reduce ? false : { opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? {} : { opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="auth-title">{mode === 'login' ? 'Welcome Back' : 'Create Your Account'}</h2>
            <p className="auth-subtitle">{mode === 'login' ? 'Sign in to continue to Project Brain AI.' : 'Start building your team\'s institutional memory.'}</p>

            <form onSubmit={handleSubmit} className="auth-form">
              {mode === 'signup' && (
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <div className="input-wrap">
                    <User size={14} />
                    <input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Maya Patel" />
                  </div>
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div className="input-wrap">
                  <Mail size={14} />
                  <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="you@company.com" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="input-wrap">
                  <Lock size={14} />
                  <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => update('password', e.target.value)} placeholder="••••••••" />
                  <button type="button" className="eye-btn" onClick={() => setShowPassword((v) => !v)}>
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              {mode === 'signup' && (
                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <div className="input-wrap">
                    <Lock size={14} />
                    <input type={showConfirm ? 'text' : 'password'} value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} placeholder="••••••••" />
                    <button type="button" className="eye-btn" onClick={() => setShowConfirm((v) => !v)}>
                      {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              )}

              {mode === 'login' && (
                <div className="auth-options">
                  <label className="remember">
                    <input type="checkbox" checked={form.remember} onChange={(e) => update('remember', e.target.checked)} />
                    Remember Me
                  </label>
                  <button type="button" className="forgot-link" onClick={handleForgot}>Forgot Password?</button>
                </div>
              )}

              {error && <div className="auth-error">{error}</div>}
              {success && <div className="auth-success">{success}</div>}
              {forgotMsg && <div className="auth-note">{forgotMsg}</div>}

              <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
                {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <div className="auth-switch">
              {mode === 'login' ? (
                <>
                  Don't have an account?{' '}
                  <button type="button" onClick={() => { setMode('signup'); setError(''); setSuccess(''); }}>Create an Account</button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button type="button" onClick={() => { setMode('login'); setError(''); setSuccess(''); }}>Sign In</button>
                </>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
    </>
  );
}
