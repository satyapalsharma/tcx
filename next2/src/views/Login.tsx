'use client';

import { useState } from 'react';
import { useNavigate } from '../lib/navigation';
import { Icon } from '../components/Icon';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
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
    <main className="min-h-screen grid place-items-center p-4 sm:p-8 bg-background text-foreground" data-od-id="login-root">
      <div className="w-full max-w-[372px]">
        <div className="flex items-center gap-2.5 mb-6" data-od-id="login-brand">
          <img className="h-6 w-auto block shrink-0" src="/EXL_Service_logo.svg.webp" alt="EXL" />
          <span className="w-px h-5.5 bg-border shrink-0" aria-hidden="true" />
          <span className="text-base font-bold tracking-tight text-foreground">Transform.cx</span>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground" data-od-id="login-heading">Sign in</h1>
        <p className="text-muted text-xs sm:text-sm mt-1.5 mb-5">Continue to your workspace where conversations become deployed agents.</p>

        <Card className="p-5 shadow-xs border-border">
          <form id="login-form" className="space-y-4" onSubmit={submit} noValidate>
            <div>
              <Label className="block text-xs font-semibold text-foreground tracking-wide mb-1.5" htmlFor="email">Work email</Label>
              <Input
                className={`w-full h-9 px-3 bg-surface border rounded-md text-xs sm:text-sm text-foreground placeholder:text-muted transition-colors ${
                  emailErr ? 'border-danger focus-visible:ring-1 focus-visible:ring-danger' : 'border-border focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent'
                }`}
                id="email"
                type="email"
                autoComplete="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailErr(false); }}
              />
              {emailErr && (
                <span className="text-xs text-danger-fg flex items-center gap-1.5 mt-1">
                  <Icon name="warn" className="w-3.5 h-3.5 text-danger" />Enter a valid company email address.
                </span>
              )}
            </div>

            <div>
              <Label className="block text-xs font-semibold text-foreground tracking-wide mb-1.5" htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  className={`w-full h-9 pl-3 pr-10 bg-surface border rounded-md text-xs sm:text-sm text-foreground placeholder:text-muted transition-colors ${
                    pwdErr ? 'border-danger focus-visible:ring-1 focus-visible:ring-danger' : 'border-border focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent'
                  }`}
                  id="password"
                  type={showPwd ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="8+ characters"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setPwdErr(false); }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground cursor-pointer"
                  aria-label={showPwd ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPwd(!showPwd)}
                >
                  <Icon name="eye" className="w-4 h-4" />
                </Button>
              </div>
              {pwdErr && (
                <span className="text-xs text-danger-fg flex items-center gap-1.5 mt-1">
                  <Icon name="warn" className="w-3.5 h-3.5 text-danger" />Password must be at least 8 characters.
                </span>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-muted pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-muted hover:text-foreground transition-colors select-none">
                <Switch checked={remember} onCheckedChange={setRemember} aria-label="Keep me signed in" />
                <span>Keep me signed in</span>
              </label>
              <Button
                type="button"
                variant="link"
                className="h-auto p-0 text-accent-strong hover:underline text-xs font-medium cursor-pointer"
                onClick={() => toast(`Password reset link sent to ${email.trim() || 'your email'}`, 'mail')}
              >
                Forgot password?
              </Button>
            </div>

            <Button
              variant="accent"
              className="w-full h-10 mt-2 text-xs sm:text-sm font-semibold rounded-md shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </>
              ) : 'Sign in'}
            </Button>

            <div className="relative flex items-center justify-center my-4">
              <Separator className="w-full" />
              <span className="absolute bg-surface px-2.5 text-[11px] text-muted uppercase tracking-wider font-medium">
                or continue with
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <Button
                type="button"
                variant="outline"
                className="h-9 px-3 border-border bg-surface hover:bg-surface-hover text-xs font-medium text-foreground flex items-center justify-center gap-2 transition-colors cursor-pointer"
                onClick={sso}
              >
                <span className="w-4 h-4 rounded-full bg-surface-inset text-foreground text-[10px] font-bold grid place-items-center">G</span>
                Google
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-9 px-3 border-border bg-surface hover:bg-surface-hover text-xs font-medium text-foreground flex items-center justify-center gap-2 transition-colors cursor-pointer"
                onClick={sso}
              >
                <Icon name="lock" className="w-3.5 h-3.5 text-muted" />
                SAML SSO
              </Button>
            </div>

            <p className="text-[11.5px] text-muted text-center pt-2 leading-relaxed">
              Demo build — use any 8+ character password to enter the workspace.
            </p>
          </form>
        </Card>

        <div className="mt-6 flex flex-col gap-3.5 items-center text-center text-xs text-muted" data-od-id="login-footer">
          <div className="flex items-center origin-center scale-90 sm:scale-100" aria-hidden="true">
            <span className="inline-flex items-center gap-1.5 h-6 px-2.5 text-xs font-medium rounded-full bg-success-soft text-success-fg">
              <span className="w-3.5 h-3.5 rounded-full bg-success text-white grid place-items-center">
                <Icon name="check" style={{ width: 9, height: 9 }} />
              </span>
              Analysis
            </span>
            <span className="w-3.5 h-px bg-border shrink-0" />
            <span className="inline-flex items-center gap-1.5 h-6 px-2.5 text-xs font-semibold rounded-full border border-foreground text-foreground bg-surface">
              <span className="w-1.5 h-1.5 rounded-full bg-warn animate-pulse" />
              Design
            </span>
            <span className="w-3.5 h-px bg-border shrink-0" />
            <span className="inline-flex items-center gap-1.5 h-6 px-2.5 text-xs font-medium rounded-full border border-border text-muted bg-surface">
              Develop
            </span>
          </div>

          <p className="text-muted leading-relaxed">
            Analysis → Design → Develop — one pipeline, or just the stage your team owns.
          </p>
          <p className="text-muted">
            No account yet?{' '}
            <Button
              type="button"
              variant="link"
              className="h-auto p-0 text-accent-strong hover:underline font-medium cursor-pointer text-xs"
              onClick={() => toast('Demo — invites are managed from Team & roles', 'info')}
            >
              Ask your workspace admin
            </Button>
          </p>
        </div>
      </div>
    </main>
  );
}
