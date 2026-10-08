'use client';

import { useState, type FormEvent } from 'react';
import { Link } from '../lib/navigation';
import { AppShell } from '../components/AppShell';
import { useToast } from '../components/Toast';
import { useReveal } from '../hooks/useReveal';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/common';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Settings() {
  useReveal();
  const toast = useToast();
  const { currentOrg, updateOrg, membersForCurrentOrg, workspacesForCurrentOrg } = useApp();
  const [draft, setDraft] = useState<{ orgId: string; name: string } | null>(null);
  const orgName = draft?.orgId === currentOrg.id ? draft.name : currentOrg.name;

  const dirty = orgName.trim() !== currentOrg.name;
  const saveOrg = (event: FormEvent) => {
    event.preventDefault();
    const name = orgName.trim();
    if (!name) return;
    updateOrg({ name });
    setDraft(null);
    toast('Organization name updated', 'check');
  };

  return (
    <AppShell crumb="Settings">
      <div className="p-4 sm:p-6 lg:p-7 max-w-[900px] mx-auto w-full pb-16 space-y-6" data-od-id="settings-page">
        <PageHeader title="Settings" description={`Manage ${currentOrg.name} and its people.`} dataOdId="page-title" />

        <Card className="p-5 sm:p-6 gap-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Organization name</h2>
            <p className="text-xs text-muted mt-1">This name is visible to everyone in the organization.</p>
          </div>
          <form onSubmit={saveOrg} className="space-y-3 max-w-md">
            <div className="space-y-1.5">
              <Label htmlFor="org-name" className="text-xs">Name</Label>
              <Input id="org-name" value={orgName} onChange={(event) => setDraft({ orgId: currentOrg.id, name: event.target.value })} className="h-9 text-sm" required />
            </div>
            <Button type="submit" variant="accent" size="sm" disabled={!dirty} className="cursor-pointer">Save changes</Button>
          </form>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="p-5 gap-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Members</h2>
              <p className="text-xs text-muted mt-1">{membersForCurrentOrg.filter((member) => member.status !== 'service').length} people in this organization.</p>
            </div>
            <Button asChild variant="outline" size="sm" className="self-start text-xs"><Link to="/rbac">Manage members</Link></Button>
          </Card>
          <Card className="p-5 gap-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Workspaces</h2>
              <p className="text-xs text-muted mt-1">{workspacesForCurrentOrg.length} workspaces in this organization.</p>
            </div>
            <Button asChild variant="outline" size="sm" className="self-start text-xs"><Link to="/projects">Manage workspaces</Link></Button>
          </Card>
        </div>

        <div className="flex flex-wrap gap-4 text-sm">
          <Link className="text-accent-strong hover:underline" to="/connectors">Integrations</Link>
          <Link className="text-accent-strong hover:underline" to="/audit-log">Audit log</Link>
        </div>
        <p className="text-xs text-muted">Demo changes are saved in this browser. Invitations and jobs aren&apos;t sent to a backend.</p>
      </div>
    </AppShell>
  );
}
