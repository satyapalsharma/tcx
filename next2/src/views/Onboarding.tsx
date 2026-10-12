'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from '../lib/navigation';
import { BrandLockup } from '@/components/BrandLockup';
import { useToast } from '@/components/Toast';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type DemoMember = { orgId: string; email: string; status: string };
type AccessRequest = { orgId: string; email: string; status: 'pending'; createdAt: string };

const PERSONAL_EMAIL_DOMAINS = new Set([
  'gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.co.in', 'hotmail.com', 'outlook.com',
  'live.com', 'icloud.com', 'me.com', 'aol.com', 'proton.me', 'protonmail.com',
]);

type Section = 'create' | 'find' | 'help';

export default function Onboarding() {
  const navigate = useNavigate();
  const toast = useToast();
  const { organizations, createOrg } = useApp();
  const [section, setSection] = useState<Section>('create');
  const [email, setEmail] = useState('');
  const [orgName, setOrgName] = useState('');
  const [members, setMembers] = useState<DemoMember[]>([]);
  const [requests, setRequests] = useState<AccessRequest[]>([]);

  useEffect(() => {
    const loadDemoData = () => {
      try {
        const savedEmail = localStorage.getItem('tx-user') ?? '';
        const saved = JSON.parse(localStorage.getItem('tx-app-v1') ?? '{}') as { members?: DemoMember[] };
        const savedRequests = JSON.parse(localStorage.getItem('tx-access-requests') ?? '[]') as AccessRequest[];
        setEmail(savedEmail);
        setMembers(Array.isArray(saved.members) ? saved.members : []);
        setRequests(Array.isArray(savedRequests) ? savedRequests : []);
      } catch {
        setEmail('');
        setMembers([]);
        setRequests([]);
      }
    };
    loadDemoData();
    window.addEventListener('storage', loadDemoData);
    return () => window.removeEventListener('storage', loadDemoData);
  }, []);

  const emailDomain = email.trim().toLowerCase().split('@')[1] ?? '';
  const suggestions = useMemo(() => {
    if (!emailDomain || PERSONAL_EMAIL_DOMAINS.has(emailDomain)) return [];
    const matchedOrgIds = new Set(
      members
        .filter((member) => member.status === 'active' && member.email.toLowerCase().split('@')[1] === emailDomain)
        .map((member) => member.orgId),
    );
    return organizations.filter((org) => matchedOrgIds.has(org.id));
  }, [emailDomain, members, organizations]);

  const createOrganization = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email) {
      navigate('/login');
      return;
    }
    const name = orgName.trim();
    if (!name) return;
    createOrg(name);
    try { localStorage.setItem('tx-last-page', 'projects'); } catch { /* storage may be unavailable */ }
    navigate('/projects');
  };

  const requestAccess = (orgId: string, orgNameValue: string) => {
    const exists = requests.some((request) => request.orgId === orgId && request.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      toast('Request already saved in this demo', 'info');
      return;
    }
    const next = [...requests, { orgId, email, status: 'pending' as const, createdAt: new Date().toISOString() }];
    setRequests(next);
    try { localStorage.setItem('tx-access-requests', JSON.stringify(next)); } catch { /* storage may be unavailable */ }
    toast(`Access request for ${orgNameValue} saved in this demo`, 'check');
  };

  const goToSample = () => {
    try { localStorage.setItem('tx-last-page', 'projects'); } catch { /* storage may be unavailable */ }
    navigate('/projects');
  };

  return (
    <main className="min-h-screen bg-background text-foreground lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="border-b border-border bg-surface p-5 lg:min-h-screen lg:border-b-0 lg:border-r lg:p-6">
        <BrandLockup />
        <p className="mt-10 px-3 text-[11px] font-semibold uppercase tracking-[.14em] text-muted">Get started</p>
        <nav aria-label="Onboarding" className="mt-2 flex gap-2 overflow-x-auto lg:flex-col">
          {([
            ['create', 'Create organization'],
            ['find', 'Find organization'],
            ['help', 'Help'],
          ] as const).map(([id, label]) => (
            <button key={id} type="button" onClick={() => setSection(id)} aria-current={section === id ? 'page' : undefined} className={`shrink-0 rounded-lg px-3 py-2.5 text-left text-sm transition-colors lg:w-full ${section === id ? 'bg-accent-soft font-medium text-accent-strong' : 'text-muted hover:bg-surface-inset hover:text-foreground'}`}>
              {label}
            </button>
          ))}
        </nav>
        <div className="mt-8 hidden rounded-xl border border-border bg-background p-4 text-xs leading-5 text-muted lg:block">
          <p className="font-medium text-foreground">Using the demo?</p>
          <p className="mt-1">Open the sample project to explore without creating an organization.</p>
          <button type="button" onClick={goToSample} className="mt-3 font-medium text-accent-strong hover:underline">Explore sample demo →</button>
        </div>
      </aside>

      <section className="mx-auto w-full max-w-3xl px-5 py-8 sm:px-8 sm:py-12">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[.12em] text-muted">Organization setup</p>
            <p className="mt-1 text-sm text-foreground">{email || 'Email not found'}</p>
          </div>
          <button type="button" onClick={goToSample} className="text-xs font-medium text-accent-strong hover:underline">Explore sample demo</button>
        </div>

        {section === 'create' && (
          <div className="max-w-xl">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Create your organization</h1>
            <p className="mt-2 text-sm leading-6 text-muted">Start a shared space for your team. A default project will be created for you.</p>
            <Card className="mt-7 p-5 sm:p-6">
              {!email && <div className="mb-5 rounded-lg border border-warn/40 bg-warn-soft p-3 text-sm leading-5 text-warn-fg">Sign in with your email before creating an organization. <button type="button" onClick={() => navigate('/login')} className="font-semibold underline underline-offset-2">Go to sign in</button></div>}
              <form onSubmit={createOrganization} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="organization-name" className="text-sm">Organization name</Label>
                  <Input id="organization-name" value={orgName} onChange={(event) => setOrgName(event.target.value)} placeholder="Acme Support" className="h-11" required maxLength={80} />
                  <p className="text-xs text-muted">You can invite people after setup.</p>
                </div>
                <Button type="submit" variant="accent" className="h-10" disabled={!email}>Create organization</Button>
              </form>
              <p className="mt-5 border-t border-border pt-4 text-xs leading-5 text-muted">Demo data is saved in this browser. No organization service or invitations are connected.</p>
            </Card>
            {suggestions.length > 0 && <Card className="mt-4 flex flex-wrap items-center justify-between gap-3 p-4">
              <div><p className="text-sm font-medium text-foreground">Looking for an existing organization?</p><p className="mt-1 text-xs text-muted">{suggestions.length === 1 ? suggestions[0].name : `${suggestions.length} possible organizations`} match your work email domain.</p></div>
              <Button type="button" variant="outline" size="sm" onClick={() => setSection('find')}>Find organization</Button>
            </Card>}
          </div>
        )}

        {section === 'find' && (
          <div className="max-w-xl">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Find your organization</h1>
            <p className="mt-2 text-sm leading-6 text-muted">We look for organizations with active members using the same work email domain.</p>
            {!email && <Card className="mt-7 p-5 text-sm text-muted">Enter your email on the sign-in page first so we can look up possible matches. <button type="button" onClick={() => navigate('/login')} className="ml-1 font-medium text-accent-strong hover:underline">Back to sign in</button></Card>}
            {email && (!emailDomain || PERSONAL_EMAIL_DOMAINS.has(emailDomain)) && <Card className="mt-7 p-5 text-sm leading-6 text-muted">Organization matching is available for work email domains. You can create a new organization or explore the sample demo.</Card>}
            {email && emailDomain && !PERSONAL_EMAIL_DOMAINS.has(emailDomain) && suggestions.length === 0 && <Card className="mt-7 p-5 text-sm leading-6 text-muted">No existing organization matches <strong className="font-medium text-foreground">{emailDomain}</strong> in this demo. You can create one or use the sample demo.</Card>}
            {suggestions.length > 0 && <div className="mt-7 space-y-3">{suggestions.map((org) => {
              const requested = requests.some((request) => request.orgId === org.id && request.email.toLowerCase() === email.toLowerCase());
              return <Card key={org.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div><h2 className="font-semibold">{org.name}</h2><p className="mt-1 text-xs text-muted">Suggested from active member email domains · {org.memberCount} members</p></div>
                <Button type="button" variant="outline" disabled={requested} onClick={() => requestAccess(org.id, org.name)}>{requested ? 'Request saved' : 'Request access'}</Button>
              </Card>;
            })}</div>}
            <p className="mt-5 text-xs leading-5 text-muted">Suggestions only help you find a possible match. A request is saved locally for this demo and does not grant organization access.</p>
          </div>
        )}

        {section === 'help' && (
          <div className="max-w-xl">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">A quick note about this demo</h1>
            <p className="mt-2 text-sm leading-6 text-muted">This experience runs in your browser and has no organization directory or access-request service behind it.</p>
            <Card className="mt-7 space-y-4 p-5 sm:p-6 text-sm leading-6">
              <div><h2 className="font-semibold">Create an organization</h2><p className="mt-1 text-muted">Creates a local demo organization and its first project.</p></div>
              <div><h2 className="font-semibold">Find an organization</h2><p className="mt-1 text-muted">Shows a suggestion only when an active demo member shares your work email domain. Requesting access records a local pending request; it does not join you.</p></div>
              <Button type="button" variant="outline" onClick={goToSample}>Explore sample demo</Button>
            </Card>
          </div>
        )}
      </section>
    </main>
  );
}
