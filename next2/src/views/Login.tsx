'use client';

import { useState, type FormEvent } from 'react';
import { useNavigate } from '../lib/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BrandLockup } from '@/components/BrandLockup';
import { useApp } from '@/context/AppContext';

export default function Login() {
  const navigate = useNavigate();
  const { startSession } = useApp();
  const [email, setEmail] = useState('');
  const [storageError, setStorageError] = useState(false);

  const enterAccount = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const address = email.trim();
    if (!address) return;
    try {
      startSession(address, 'account');
      localStorage.setItem('tx-last-page', 'projects');
    } catch {
      setStorageError(true);
      return;
    }
    navigate('/onboarding');
  };

  return (
    <main className="min-h-screen bg-background text-foreground grid lg:grid-cols-[1.05fr_.95fr]">
      <section className="hidden lg:flex flex-col justify-between bg-sidebar text-white p-12 xl:p-16">
        <BrandLockup inverse />
        <div className="max-w-xl">
          <p className="text-xs uppercase tracking-[.18em] text-white/55">
            Customer experience, connected
          </p>
          <h1 className="mt-5 text-4xl xl:text-5xl font-semibold leading-tight tracking-tight">
            Turn customer conversations into better experiences.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-white/65">
            Start with your own workspace for discovering intent, designing
            service journeys, and building AI agents.
          </p>
          <div className="mt-10 flex items-center gap-3 text-sm text-white/70">
            <span className="h-px w-9 bg-[var(--brand-orange)]" />
            Analysis <span className="text-white/35">→</span> Design{' '}
            <span className="text-white/35">→</span> Develop
          </div>
        </div>
        <p className="text-xs text-white/40">A workspace for your team</p>
      </section>

      <section className="grid place-items-center p-5 sm:p-10">
        <div className="w-full max-w-[410px]">
          <div className="mb-10 lg:hidden">
            <BrandLockup />
          </div>
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-strong" />
            Get started
          </div>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            Welcome to Transform.cx
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Use your email to set up a workspace in this browser. No password is
            required.
          </p>
          <form onSubmit={enterAccount} className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="account-email" className="text-sm">
                Work email
              </Label>
              <Input
                id="account-email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="h-11 bg-surface"
              />
            </div>
            {storageError && (
              <p role="alert" className="text-sm text-danger-fg">
                Your browser could not save this workspace. Enable site storage
                and try again.
              </p>
            )}
            <Button
              type="submit"
              variant="accent"
              className="h-11 w-full text-sm"
            >
              Continue <span aria-hidden="true">→</span>
            </Button>
          </form>
          <div className="my-6 flex items-center gap-3 text-[11px] text-muted">
            <span className="h-px flex-1 bg-border" /> OR
            <span className="h-px flex-1 bg-border" />
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full text-sm"
            onClick={() => {
              const address = email.trim() || 'priya.nair@skyline.com';
              try {
                startSession(address, 'demo');
                localStorage.setItem('tx-last-page', 'projects');
              } catch {
                setStorageError(true);
                return;
              }
              navigate('/projects');
            }}
          >
            Explore demo project
          </Button>
          <p className="mt-5 text-center text-xs leading-5 text-muted">
            Your email workspace and the sample demo use separate browser data.
          </p>
        </div>
      </section>
    </main>
  );
}
