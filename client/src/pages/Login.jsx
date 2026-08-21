import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { APP_PANEL, isAdminPanel, isWorkerPanel, PANEL_HOME, PANEL_ROLE } from '../config/panel';
import { Eye, EyeOff, ShieldCheck, UserCheck, Lock, User, Phone, LogIn, UserPlus, CreditCard, Grid } from 'lucide-react';
import bansiLogo from '../assets/bansi fasion logo.png';
import { API } from '../config/api';
import PatternLock from '../components/PatternLock';

const Login = () => {
  const [role, setRole] = useState(PANEL_ROLE);
  const [authMode, setAuthMode] = useState('login');
  const [loginMethod, setLoginMethod] = useState('password'); // 'password' | 'pattern' | 'setPattern'
  const [form, setForm] = useState({ workerId: '', password: '' });
  const [signupForm, setSignupForm] = useState({ name: '', workerId: '', phone: '', aadhaarNumber: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const value = e.target.name === 'workerId' ? e.target.value.toUpperCase() : e.target.value;
    setForm(prev => ({ ...prev, [e.target.name]: value }));
    setError('');
  };

  const handleSignupChange = (e) => {
    let value = e.target.value;

    if (e.target.name === 'workerId') {
      value = value.toUpperCase();
    }

    if (e.target.name === 'phone') {
      value = value.replace(/\D/g, '').slice(0, 10);
    }

    if (e.target.name === 'aadhaarNumber') {
      value = value.replace(/\D/g, '').slice(0, 12);
    }

    setSignupForm(prev => ({ ...prev, [e.target.name]: value }));
    setError('');
  };

  const handleRoleChange = (nextRole) => {
    setRole(nextRole);
    setForm({ workerId: '', password: '' });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (authMode === 'signup') {
        const payload = {
          ...signupForm,
          role: 'worker',
          salary: 0
        };

        if (!payload.name || !payload.workerId || !payload.password) {
          setError('Please fill in name, worker ID and password.');
          setLoading(false);
          return;
        }

        if (payload.phone && !/^\d{10}$/.test(String(payload.phone).trim())) {
          setError('Phone number must be exactly 10 digits.');
          setLoading(false);
          return;
        }

        if (payload.aadhaarNumber && !/^\d{12}$/.test(String(payload.aadhaarNumber).trim())) {
          setError('Aadhaar Card number must be exactly 12 digits.');
          setLoading(false);
          return;
        }

        await axios.post(`${API}/auth/register`, payload);
        toast.success('Account created successfully!');

        const res = await axios.post(`${API}/auth/login`, {
          workerId: payload.workerId,
          password: payload.password
        });

        const { user, token } = res.data;
        login(user, token);
        toast.success(`Welcome, ${user.name}! 👋`);
        navigate(user.role === 'admin' ? '/admin' : '/dashboard');
        return;
      }

      const loginPayload = {
        workerId: String(form.workerId || '').trim().toUpperCase(),
        password: String(form.password || '').trim()
      };

      if (!loginPayload.workerId || !loginPayload.password) {
        setError('Please enter your ID and password.');
        setLoading(false);
        return;
      }

      const res = await axios.post(`${API}/auth/login`, loginPayload);
      const { user, token } = res.data;

      login(user, token);
      toast.success(`Welcome back, ${user.name}! 👋`);
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      const serverMsg = err.response?.data?.message;
      const networkMsg = err.message === 'Network Error' ? 'Cannot connect to backend server. Please check internet connection or server status.' : 'Login failed. Please check ID and password.';
      setError(serverMsg || networkMsg);
    } finally {
      setLoading(false);
    }
  };

  const handlePatternLogin = async (drawnPattern) => {
    const workerId = String(form.workerId || '').trim().toUpperCase();
    if (!workerId) {
      setError('Please enter your Worker ID or Mobile number first.');
      toast.error('Please enter your Worker ID or Mobile number first.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await axios.post(`${API}/auth/login-pattern`, {
        workerId,
        pattern: drawnPattern
      });
      const { user, token } = res.data;

      login(user, token);
      toast.success(`Welcome back, ${user.name}! 🔐 Logged in with Pattern Lock`);
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Incorrect Pattern Lock. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSetPatternSubmit = async (drawnPattern) => {
    const workerId = String(form.workerId || '').trim().toUpperCase();
    const password = String(form.password || '').trim();

    if (!workerId || !password) {
      setError('Please enter Worker ID and Password to set your Pattern Lock.');
      toast.error('Please enter Worker ID and Password first.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await axios.post(`${API}/auth/set-pattern`, {
        workerId,
        password,
        pattern: drawnPattern
      });
      toast.success('🎉 Pattern Lock saved successfully! Now logging in...');

      const loginRes = await axios.post(`${API}/auth/login`, { workerId, password });
      const { user, token } = loginRes.data;
      login(user, token);
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save pattern lock.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">

        {/* Logo and Brand Header */}
        <div className="login-logo">
          <img
            src={bansiLogo}
            alt="Bansi Fashion Logo"
            className="login-logo-img"
          />
          <h1 className="login-title"><span>Bansi Fashion</span></h1>
          <p className="login-subtitle">
            {isAdminPanel
              ? 'Admin Management Portal'
              : isWorkerPanel
                ? 'Worker Production Portal'
                : 'Industrial Production & Worker Management Portal'}
          </p>
        </div>

        {/* Login Card matching exact screenshot design */}
        <div className="login-card">
          <div className="login-card-header">
            <h1 className="login-card-title">
              {authMode === 'login' ? 'Sign In' : 'Create Account'}
            </h1>
            <p className="login-card-subtitle">
              {authMode === 'login'
                ? 'Enter your credentials to access your account'
                : 'Fill in your details to register a new worker account'}
            </p>
          </div>

          {/* Role Selector (combined app only) */}
          {authMode === 'login' && APP_PANEL === 'all' && (
            <div className="role-selector">
              <button
                id="worker-role-btn"
                type="button"
                className={`role-option ${role === 'worker' ? 'active' : ''}`}
                onClick={() => handleRoleChange('worker')}
              >
                <UserCheck size={24} className="role-option-icon" style={{ margin: '0 auto 4px', color: role === 'worker' ? 'var(--primary)' : 'var(--text-muted)' }} />
                Worker Portal
              </button>
              <button
                id="admin-role-btn"
                type="button"
                className={`role-option ${role === 'admin' ? 'active' : ''}`}
                onClick={() => handleRoleChange('admin')}
              >
                <ShieldCheck size={24} className="role-option-icon" style={{ margin: '0 auto 4px', color: role === 'admin' ? 'var(--primary)' : 'var(--text-muted)' }} />
                Admin Portal
              </button>
            </div>
          )}

          {authMode === 'login' && APP_PANEL !== 'all' && (
            <div className="panel-badge">
              {isAdminPanel ? (
                <>
                  <ShieldCheck size={18} />
                  Admin Portal
                </>
              ) : (
                <>
                  <UserCheck size={18} />
                  Worker Portal
                </>
              )}
            </div>
          )}

          <form id="login-form" onSubmit={handleSubmit}>
            {error && (
              <div className="alert alert-error">
                {error}
              </div>
            )}

            {authMode === 'signup' ? (
              <>
                <div className="form-group">
                  <label className="form-label-screenshot">
                    <span className="lbl-emoji">👤</span> WORKER FULL NAME
                  </label>
                  <input
                    type="text"
                    name="name"
                    className="form-control-screenshot"
                    value={signupForm.name}
                    onChange={handleSignupChange}
                    placeholder="Enter worker full name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label-screenshot">
                    <span className="lbl-emoji">📧</span> WORKER ID / USERNAME
                  </label>
                  <input
                    type="text"
                    name="workerId"
                    className="form-control-screenshot"
                    value={signupForm.workerId}
                    onChange={handleSignupChange}
                    placeholder="Choose Worker ID (e.g. LAKHA)"
                    autoCapitalize="characters"
                    spellCheck={false}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label-screenshot">
                    <span className="lbl-emoji">📱</span> MOBILE NUMBER
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    className="form-control-screenshot"
                    value={signupForm.phone}
                    onChange={handleSignupChange}
                    placeholder="10-digit mobile number"
                    inputMode="numeric"
                    maxLength={10}
                    pattern="[0-9]{10}"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label-screenshot">
                    <span className="lbl-emoji">💳</span> AADHAAR CARD NUMBER
                  </label>
                  <input
                    type="text"
                    name="aadhaarNumber"
                    className="form-control-screenshot"
                    value={signupForm.aadhaarNumber}
                    onChange={handleSignupChange}
                    placeholder="12-digit Aadhaar Card Number"
                    inputMode="numeric"
                    maxLength={12}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label-screenshot">
                    <span className="lbl-emoji">🔑</span> PASSWORD
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      className="form-control-screenshot"
                      value={signupForm.password}
                      onChange={handleSignupChange}
                      placeholder="Create password"
                      required
                      style={{ paddingRight: '2.75rem' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '1rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        display: 'flex'
                      }}
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div>
            {/* Pattern Lock / Password Sub-tabs for Workers */}
            {authMode === 'login' && (
              <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.25rem', background: '#f1f5f9', padding: '4px', borderRadius: '12px' }}>
                <button
                  type="button"
                  onClick={() => { setLoginMethod('password'); setError(''); }}
                  style={{
                    flex: 1,
                    padding: '0.45rem 0.5rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: loginMethod === 'password' ? '#ffffff' : 'transparent',
                    color: loginMethod === 'password' ? 'var(--primary)' : '#64748b',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    boxShadow: loginMethod === 'password' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'center',
                    gap: '0.3rem'
                  }}
                >
                  🔑 Password
                </button>
                <button
                  type="button"
                  onClick={() => { setLoginMethod('pattern'); setError(''); }}
                  style={{
                    flex: 1,
                    padding: '0.45rem 0.5rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: loginMethod === 'pattern' ? '#ffffff' : 'transparent',
                    color: loginMethod === 'pattern' ? 'var(--primary)' : '#64748b',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    boxShadow: loginMethod === 'pattern' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'center',
                    gap: '0.3rem'
                  }}
                >
                  🔐 Pattern Lock
                </button>
                <button
                  type="button"
                  onClick={() => { setLoginMethod('setPattern'); setError(''); }}
                  style={{
                    flex: 1,
                    padding: '0.45rem 0.5rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: loginMethod === 'setPattern' ? '#ffffff' : 'transparent',
                    color: loginMethod === 'setPattern' ? 'var(--primary)' : '#64748b',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    boxShadow: loginMethod === 'setPattern' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'center',
                    gap: '0.3rem'
                  }}
                >
                  ⚙️ Set Pattern
                </button>
              </div>
            )}

            {authMode === 'login' && loginMethod === 'pattern' ? (
              <div>
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label-screenshot">
                    <span className="lbl-emoji">📧</span> WORKER ID / MOBILE
                  </label>
                  <input
                    id="login-id-pattern"
                    type="text"
                    name="workerId"
                    className="form-control-screenshot"
                    value={form.workerId}
                    onChange={handleChange}
                    placeholder="Enter Worker ID or Mobile"
                    autoCapitalize="characters"
                    spellCheck={false}
                    required
                  />
                </div>

                <PatternLock
                  title="Draw Pattern Lock to Sign In"
                  onComplete={handlePatternLogin}
                  onReset={() => setError('')}
                />

                <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                  <small style={{ color: '#64748b', fontSize: '0.78rem' }}>
                    Don't have a pattern lock yet?{' '}
                    <button
                      type="button"
                      onClick={() => setLoginMethod('setPattern')}
                      style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                    >
                      Set Pattern Lock
                    </button>
                  </small>
                </div>
              </div>
            ) : authMode === 'login' && loginMethod === 'setPattern' ? (
              <div>
                <div className="form-group">
                  <label className="form-label-screenshot">
                    <span className="lbl-emoji">📧</span> WORKER ID / MOBILE
                  </label>
                  <input
                    type="text"
                    name="workerId"
                    className="form-control-screenshot"
                    value={form.workerId}
                    onChange={handleChange}
                    placeholder="Enter Worker ID or Mobile"
                    autoCapitalize="characters"
                    spellCheck={false}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label-screenshot">
                    <span className="lbl-emoji">🔑</span> CURRENT PASSWORD
                  </label>
                  <input
                    type="password"
                    name="password"
                    className="form-control-screenshot"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Enter password to set pattern"
                    required
                  />
                </div>

                <PatternLock
                  title="Draw NEW Pattern Lock to Save"
                  onComplete={handleSetPatternSubmit}
                  onReset={() => setError('')}
                />
              </div>
            ) : (
              <>
                <div className="form-group">
                  <label className="form-label-screenshot">
                    <span className="lbl-emoji">📧</span> WORKER ID / MOBILE
                  </label>
                  <input
                    id="login-id"
                    type="text"
                    name="workerId"
                    className="form-control-screenshot"
                    value={form.workerId}
                    onChange={handleChange}
                    placeholder={role === 'admin' ? 'Enter Admin ID' : 'Enter Worker ID or Phone'}
                    autoCapitalize="characters"
                    spellCheck={false}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label-screenshot">
                    <span className="lbl-emoji">🔑</span> PASSWORD
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      className="form-control-screenshot"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Enter your password"
                      required
                      style={{ paddingRight: '2.75rem' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '1rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        display: 'flex'
                      }}
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password Row */}
                <div className="form-remember-row">
                  <label className="remember-checkbox-label">
                    <input type="checkbox" defaultChecked />
                    <span>Remember me</span>
                  </label>
                  <a
                    href="#forgot"
                    className="forgot-password-link"
                    onClick={(e) => {
                      e.preventDefault();
                      toast('Password Reset Support: Contact +91 7574049710', { icon: '🔑' });
                    }}
                  >
                    Forgot password?
                  </a>
                </div>
              </>
            )}
          </div>
        )}

            {(authMode === 'signup' || loginMethod === 'password') && (
              <button
                id="login-submit-btn"
                type="submit"
                className="golden-signin-btn"
                disabled={loading}
              >
                {loading ? (
                  <><span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px', borderColor: '#1e293b #1e293b transparent transparent' }} /> Verifying...</>
                ) : (
                  authMode === 'signup'
                    ? 'Register Worker Account →'
                    : 'Sign In  →'
                )}
              </button>
            )}

            {/* Footer Switch Link */}
            <div className="login-footer-switch">
              {authMode === 'login' ? (
                <>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    className="auth-switch-link"
                    onClick={() => setAuthMode('signup')}
                  >
                    Create Account
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    className="auth-switch-link"
                    onClick={() => setAuthMode('login')}
                  >
                    Sign In
                  </button>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
