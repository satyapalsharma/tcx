import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Switch } from '../components/ui';
import { useToast } from '../components/Toast';

export default function Login() {
  const navigate = useNavigate();
  const toast = useToast();
  const [email, setEmail] = useState('priya@skyline-broadband.com');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(true);
  const [emailErr, setEmailErr] = useState(false);
  const [pwdErr, setPwdErr] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.body.classList.add('login-page');
    return () => document.body.classList.remove('login-page');
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const okEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
    const okPwd = password.length >= 8;
    setEmailErr(!okEmail);
    setPwdErr(!okPwd);
    if (!okEmail || !okPwd) return;
    setLoading(true);
    try { localStorage.setItem('tx-user', email.trim()); localStorage.setItem('tx-last-page', 'projects'); } catch { /* noop */ }
    setTimeout(() => navigate('/projects'), 650);
  };

  const sso = () => {
    try { localStorage.setItem('tx-user', 'priya@skyline-broadband.com'); localStorage.setItem('tx-last-page', 'projects'); } catch { /* noop */ }
    navigate('/projects');
  };

  return (
    <main className="login-wrap" data-od-id="login-root">
      <div data-od-id="login-brand" style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 26 }}>
        <img className="exl-logo" src="/EXL_Service_logo.svg.webp" alt="EXL" style={{ height: 24, width: 'auto', display: 'block' }} />
        <span style={{ width: 1, height: 22, background: 'var(--border)' }} aria-hidden="true" />
        <span style={{ fontSize: 16, fontWeight: 640, letterSpacing: '-0.02em' }}>Transform.cx</span>
      </div>
      <h1 data-od-id="login-heading" style={{ fontSize: 22, fontWeight: 640, letterSpacing: '-0.025em' }}>Sign in</h1>
      <p className="muted" style={{ margin: '6px 0 22px' }}>Continue to your workspace where conversations become deployed agents.</p>
      <form id="login-form" className="card" style={{ padding: 20 }} onSubmit={submit} noValidate>
        <div className={`field${emailErr ? ' has-error' : ''}`} id="f-email">
          <label className="label" htmlFor="email">Work email</label>
          <input className="input" id="email" type="email" autoComplete="email" placeholder="name@company.com" value={email} onChange={(e) => { setEmail(e.target.value); setEmailErr(false); }} />
          <span className="error-text"><Icon name="warn" />Enter a valid company email address.</span>
        </div>
        <div className={`field${pwdErr ? ' has-error' : ''}`} id="f-password" style={{ marginTop: 14 }}>
          <label className="label" htmlFor="password">Password</label>
          <div className="pwd-wrap">
            <input className="input" id="password" type={showPwd ? 'text' : 'password'} autoComplete="current-password" placeholder="8+ characters" value={password} onChange={(e) => { setPassword(e.target.value); setPwdErr(false); }} />
            <button type="button" className="icon-btn pwd-eye" aria-label={showPwd ? 'Hide password' : 'Show password'} onClick={() => setShowPwd(!showPwd)}>
              <Icon name="eye" />
            </button>
          </div>
          <span className="error-text"><Icon name="warn" />Password must be at least 8 characters.</span>
        </div>
        <div className="row" style={{ justifyContent: 'space-between', marginTop: 14 }}>
          <button type="button" className="row" style={{ gap: 8, fontSize: '12.5px', color: 'var(--muted)' }} onClick={() => setRemember(!remember)}>
            <Switch checked={remember} onChange={setRemember} label="Keep me signed in" />Keep me signed in
          </button>
          <button type="button" className="link" style={{ background: 'none', border: 0, cursor: 'pointer' }} onClick={() => toast(`Password reset link sent to ${email.trim() || 'your email'}`, 'mail')}>Forgot password?</button>
        </div>
        <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center', marginTop: 18 }} type="submit" disabled={loading}>
          {loading ? <><span className="spinner" />Signing in…</> : 'Sign in'}
        </button>
        <div className="divider-row"><span className="line" /><span>or continue with</span><span className="line" /></div>
        <div className="grid-2">
          <button type="button" className="btn" style={{ justifyContent: 'center' }} onClick={sso}><span className="g-mark">G</span>Google</button>
          <button type="button" className="btn" style={{ justifyContent: 'center' }} onClick={sso}><Icon name="lock" />SAML SSO</button>
        </div>
        <p className="hint" style={{ textAlign: 'center', marginTop: 16 }}>Demo build — use any 8+ character password to enter the workspace.</p>
      </form>
      <div className="login-foot" data-od-id="login-footer">
        <div className="stage-flow" aria-hidden="true">
          <span className="snode done"><span className="glyph"><Icon name="check" style={{ width: 10, height: 10 }} /></span>Analysis</span>
          <span className="slink" />
          <span className="snode live"><span className="glyph"><span className="mini" /></span>Design</span>
          <span className="slink" />
          <span className="snode"><span className="glyph" />Develop</span>
        </div>
        <p className="hint">Analysis → Design → Develop — one pipeline, or just the stage your team owns.</p>
        <p className="hint">No account yet? <button type="button" className="link" style={{ background: 'none', border: 0, cursor: 'pointer', padding: 0, font: 'inherit' }} onClick={() => toast('Demo — invites are managed from Team & roles', 'info')}>Ask your workspace admin</button></p>
      </div>
    </main>
  );
}
