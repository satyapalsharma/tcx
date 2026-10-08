'use client';

import { useMemo, useState } from 'react';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { useReveal } from '../hooks/useReveal';
import { PageHeader } from '@/components/common';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useApp } from '@/context/AppContext';

const SAMPLE_ORG_ID = 'org-skyline';

const SAMPLE_EVENTS = [
  { id: '1', when: 'Today · 10:42', actor: 'Arjun Shah', action: 'Started an agent build', detail: 'Google ADK · process map v3', icon: 'play' as const },
  { id: '2', when: 'Today · 10:05', actor: 'Devika Sharma', action: 'Updated a process map', detail: 'Billing Dispute Resolution · version 3', icon: 'flow' as const },
  { id: '3', when: 'Today · 09:18', actor: 'System', action: 'Completed an intent analysis job', detail: 'Customer Operations · sample activity', icon: 'check' as const },
  { id: '4', when: 'Yesterday · 16:30', actor: 'Riya Menon', action: 'Created a cluster set', detail: 'Customer Operations · 4 sample clusters', icon: 'chart' as const },
  { id: '5', when: 'Yesterday · 14:12', actor: 'Priya Nair', action: 'Invited a workspace member', detail: 'Customer Operations', icon: 'users' as const },
  { id: '6', when: '12 Aug · 11:20', actor: 'Arjun Shah', action: 'Generated an agent draft', detail: 'Amazon Bedrock · process map v2', icon: 'code' as const },
];

export default function AuditLog() {
  useReveal();
  const { currentOrg } = useApp();
  const [search, setSearch] = useState('');
  const hasSampleHistory = currentOrg.id === SAMPLE_ORG_ID;
  const events = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return SAMPLE_EVENTS;
    return SAMPLE_EVENTS.filter((event) => `${event.when} ${event.actor} ${event.action} ${event.detail}`.toLowerCase().includes(query));
  }, [search]);

  return (
    <AppShell crumb="Audit log">
      <main className="p-5 sm:p-8 lg:p-10 max-w-[1120px] mx-auto w-full pb-16" data-od-id="audit-page">
        <PageHeader
          title="Audit log"
          description={`Activity history for ${currentOrg.name}.`}
          dataOdId="page-title"
        />

        {hasSampleHistory ? (
          <section className="mt-8" aria-labelledby="sample-history-heading">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4">
              <div>
                <h2 id="sample-history-heading" className="text-base font-semibold text-foreground">Recent activity</h2>
                <p className="mt-1 text-xs text-muted">Sample history · Skyline Communications</p>
              </div>
              <label className="relative w-full sm:w-72">
                <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search activity" aria-label="Search sample activity" className="pl-9" />
              </label>
            </div>
            {events.length ? (
              <Card className="bg-surface border border-border rounded-xl shadow-xs divide-y divide-border overflow-hidden">
                {events.map((event) => (
                  <article key={event.id} className="flex items-start gap-3.5 px-4 sm:px-5 py-4">
                    <span className="w-8 h-8 mt-0.5 rounded-lg bg-surface-inset grid place-items-center shrink-0"><Icon name={event.icon} className="w-4 h-4 text-muted" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-foreground"><span className="font-medium">{event.actor}</span> {event.action.toLowerCase()}</p>
                      <p className="mt-1 text-xs text-muted">{event.detail}</p>
                    </div>
                    <time className="shrink-0 text-xs text-muted">{event.when}</time>
                  </article>
                ))}
              </Card>
            ) : (
              <Card className="p-8 bg-surface border border-border rounded-xl text-center text-sm text-muted">No sample activity matches “{search}”.</Card>
            )}
          </section>
        ) : (
          <Card className="mt-8 p-8 sm:p-10 bg-surface border border-border border-dashed rounded-xl shadow-xs text-center">
            <span className="mx-auto w-10 h-10 rounded-full bg-surface-inset grid place-items-center"><Icon name="scroll" className="w-5 h-5 text-muted" /></span>
            <h2 className="mt-4 text-sm font-semibold text-foreground">No activity history yet</h2>
            <p className="mt-1 mx-auto max-w-lg text-sm text-muted">Activity sync has not been connected for {currentOrg.name}. Events will appear here when organization activity is available.</p>
          </Card>
        )}
      </main>
    </AppShell>
  );
}
