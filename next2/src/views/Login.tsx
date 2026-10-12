'use client';

import { useState, type FormEvent } from 'react';
import { useNavigate } from '../lib/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BrandLockup } from '@/components/BrandLockup';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');

  const enterDemo = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const address = email.trim();
    if (!address) return;
    try {
      localStorage.setItem('tx-user', address);
      localStorage.setItem('tx-last-page', 'projects');
    } catch { /* browser storage may be unavailable */ }
    navigate('/onboarding');
  };

  return (
    <main className="min-h-screen bg-background text-foreground grid lg:grid-cols-[1.05fr_.95fr]">
      <section className="hidden lg:flex flex-col justify-between bg-sidebar text-white p-12 xl:p-16">
        <BrandLockup inverse />
        <div className="max-w-xl">
          <p className="text-xs uppercase tracking-[.18em] text-white/55">Customer experience, connected</p>
          <h1 className="mt-5 text-4xl xl:text-5xl font-semibold leading-tight tracking-tight">Turn customer conversations into better experiences.</h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-white/65">Explore a shared project for discovering intent, designing service journeys, and building AI agents.</p>
          <div className="mt-10 flex items-center gap-3 text-sm text-white/70"><span className="h-px w-9 bg-[var(--brand-orange)]" />Analysis <span className="text-white/35">→</span> Design <span className="text-white/35">→</span> Develop</div>
        </div>
        <p className="text-xs text-white/40">A guided product demo</p>
      </section>

      <section className="grid place-items-center p-5 sm:p-10">
        <div className="w-full max-w-[410px]">
          <div className="mb-10 lg:hidden"><BrandLockup /></div>
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted"><span className="h-1.5 w-1.5 rounded-full bg-accent-strong" /> Demo access</div>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Welcome to Transform.cx</h2>
          <p className="mt-2 text-sm leading-6 text-muted">Enter an email to explore the demo project. No account or password is required.</p>
          <form onSubmit={enterDemo} className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="demo-email" className="text-sm">Email address</Label>
              <Input id="demo-email" type="email" autoComplete="email" placeholder="you@company.com" value={email} onChange={(event) => setEmail(event.target.value)} required className="h-11 bg-surface" />
            </div>
            <Button type="submit" variant="accent" className="h-11 w-full text-sm">Continue to demo <span aria-hidden="true">→</span></Button>
          </form>
          <p className="mt-6 text-center text-xs leading-5 text-muted">Demo mode · Changes stay in this browser and are not sent to a service.</p>
        </div>
      </section>
    </main>
  );
}
