// src/pages/LoginPage.jsx
import { useState } from 'react';
import { useStore } from '../store/useStore.js';

export default function LoginPage() {
  const login = useStore(state => state.login);
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [attempts, setAttempts] = useState(0);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [shake, setShake]       = useState(false);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please fill in both fields.');
      triggerShake();
      return;
    }

    setLoading(true);
    // Small delay for UX feel
    await new Promise(r => setTimeout(r, 600));

    const result = login(email, password);
    setLoading(false);

    if (result.success) {
      setError('');
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      const remaining = 3 - newAttempts;
      setError(
        remaining > 0
          ? `${result.error} ${remaining} attempt${remaining > 1 ? 's' : ''} left.`
          : 'Too many failed attempts. Please try again.'
      );
      if (newAttempts >= 3) setAttempts(0);
      triggerShake();
    }
  };

  const fillCredentials = (role) => {
    if (role === 'driver') {
      setEmail('driver@test.com');
      setPassword('123456');
    } else {
      setEmail('ops@test.com');
      setPassword('123456');
    }
    setError('');
  };

  return (
    <div className="login-bg">
      {/* Animated background dots */}
      <div className="login-bg__dots" />

      <div className={`login-card ${shake ? 'shake' : ''}`}>
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo__icon">🚚</div>
          <div>
            <h1 className="login-logo__title">Delivery Tracking</h1>
            <p className="login-logo__sub">System v2.0 — React</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="login-form" noValidate>
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email address</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="your@email.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }}
              autoComplete="email"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <div className="input-wrapper">
              <input
                id="password"
                type={showPass ? 'text' : 'password'}
                className="form-input"
                placeholder="••••••"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="input-eye"
                onClick={() => setShowPass(p => !p)}
                tabIndex={-1}
                aria-label={showPass ? 'Hide password' : 'Show password'}
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {error && (
            <div className="form-error" role="alert">{error}</div>
          )}

          <button
            id="login-submit"
            type="submit"
            className="btn btn--primary btn--full"
            disabled={loading}
          >
            {loading ? (
              <span className="btn-spinner" />
            ) : (
              'Sign In →'
            )}
          </button>
        </form>

        {/* Quick-fill credentials */}
        <div className="login-creds">
          <p className="login-creds__title">Test credentials</p>
          <div className="login-creds__row">
            <button
              id="fill-driver"
              type="button"
              className="cred-pill cred-pill--driver"
              onClick={() => fillCredentials('driver')}
            >
              🚗 Driver
            </button>
            <button
              id="fill-manager"
              type="button"
              className="cred-pill cred-pill--manager"
              onClick={() => fillCredentials('manager')}
            >
              🛡 Manager
            </button>
          </div>
          <p className="login-creds__hint">Password for both: <code>123456</code></p>
        </div>
      </div>
    </div>
  );
}
