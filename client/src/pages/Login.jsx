import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { APP_PANEL, isAdminPanel, isWorkerPanel, PANEL_HOME, PANEL_ROLE } from '../config/panel';
import { Eye, EyeOff, ShieldCheck, UserCheck, Lock, User, Phone, LogIn, UserPlus, CreditCard } from 'lucide-react';
import bansiLogo from '../assets/bansi fasion logo.png';
import { API } from '../config/api';

const Login = () => {
  const [role, setRole] = useState(PANEL_ROLE);
  const [authMode, setAuthMode] = useState('login');
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

        {/* Login Card */}
        <div className="login-card">
          <div className="auth-nav-pill">
            <button
              type="button"
              className={`auth-pill-btn ${authMode === 'login' ? 'active' : ''}`}
              onClick={() => setAuthMode('login')}
            >
              <LogIn size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} /> Sign In
            </button>
            <button
              type="button"
              className={`auth-pill-btn ${authMode === 'signup' ? 'active' : ''}`}
              onClick={() => setAuthMode('signup')}
            >
              <UserPlus size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} /> Worker Sign Up
            </button>
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
                <UserCheck size={26} className="role-option-icon" style={{ margin: '0 auto 4px', color: role === 'worker' ? 'var(--primary)' : 'var(--text-muted)' }} />
                Worker Portal
              </button>
              <button
                id="admin-role-btn"
                type="button"
                className={`role-option ${role === 'admin' ? 'active' : ''}`}
                onClick={() => handleRoleChange('admin')}
              >
                <ShieldCheck size={26} className="role-option-icon" style={{ margin: '0 auto 4px', color: role === 'admin' ? 'var(--primary)' : 'var(--text-muted)' }} />
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
                  <label className="form-label"><User size={13} /> Worker Full Name</label>
                  <input
                    type="text"
                    name="name"
                    className="form-control"
                    value={signupForm.name}
                    onChange={handleSignupChange}
                    placeholder="Enter worker full name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <UserCheck size={13} />
                    Worker ID
                  </label>
                  <input
                    type="text"
                    name="workerId"
                    className="form-control"
                    value={signupForm.workerId}
                    onChange={handleSignupChange}
                    placeholder="Choose Worker ID (e.g. LAKHA)"
                    autoCapitalize="characters"
                    spellCheck={false}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label"><Phone size={13} /> Mobile Number</label>
                  <input
                    type="tel"
                    name="phone"
                    className="form-control"
                    value={signupForm.phone}
                    onChange={handleSignupChange}
                    placeholder="10-digit mobile number"
                    inputMode="numeric"
                    maxLength={10}
                    pattern="[0-9]{10}"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label"><CreditCard size={13} /> Aadhaar Card Number</label>
                  <input
                    type="text"
                    name="aadhaarNumber"
                    className="form-control"
                    value={signupForm.aadhaarNumber}
                    onChange={handleSignupChange}
                    placeholder="12-digit Aadhaar Card Number"
                    inputMode="numeric"
                    maxLength={12}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label"><Lock size={13} /> Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      className="form-control"
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
                        right: '0.75rem',
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
              <>
                <div className="form-group">
                  <label className="form-label">
                    {role === 'admin' ? <ShieldCheck size={13} /> : <UserCheck size={13} />}
                    {role === 'admin' ? 'Admin ID' : 'Worker ID'}
                  </label>
                  <input
                    id="login-id"
                    type="text"
                    name="workerId"
                    className="form-control"
                    value={form.workerId}
                    onChange={handleChange}
                    placeholder={role === 'admin' ? 'Enter Admin ID' : 'Enter Worker ID'}
                    autoCapitalize="characters"
                    spellCheck={false}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label"><Lock size={13} /> Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      className="form-control"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Enter password"
                      required
                      style={{ paddingRight: '2.75rem' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
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
            )}

            <button
              id="login-submit-btn"
              type="submit"
              className="btn btn-primary btn-block"
              style={{ marginTop: '0.75rem' }}
              disabled={loading}
            >
              {loading ? (
                <><span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} /> Verifying...</>
              ) : (
                authMode === 'signup'
                  ? 'Register Worker Account'
                  : `Sign In as ${role === 'admin' ? 'Admin' : 'Worker'}`
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
