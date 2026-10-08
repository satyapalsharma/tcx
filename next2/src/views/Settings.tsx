'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { useToast } from '../components/Toast';
import { useReveal } from '../hooks/useReveal';
import { useApp } from '@/context/AppContext';
import { PageHeader, SelectField } from '@/components/common';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const PLAN_INFO = {
  Enterprise: { price: '₹2.4L', seats: 25 },
  Team: { price: '₹60K', seats: 10 },
  Starter: { price: 'Free', seats: 3 },
} as const;

const REGIONS = [
  { value: 'asia-south1', label: 'asia-south1 · Mumbai' },
  { value: 'us-east-1', label: 'us-east-1 · N. Virginia' },
  { value: 'eu-west-1', label: 'eu-west-1 · Dublin' },
];
const RETENTION = [
  { value: '30', label: '30 days' },
  { value: '90', label: '90 days (recommended)' },
  { value: '365', label: '1 year' },
];

export default function Settings() {
  useReveal();
  const toast = useToast();
  const {
    currentOrg,
    organizations,
    switchOrg,
    updateOrg,
    workspacesForCurrentOrg,
    currentWorkspace,
    switchWorkspace,
    setIsNewOrgOpen,
    setIsNewWsOpen,
  } = useApp();

  const [orgName, setOrgName] = useState(currentOrg.name);
  const [orgSlug, setOrgSlug] = useState(currentOrg.slug);
  const [piiRedaction, setPiiRedaction] = useState(true);
  const [region, setRegion] = useState('asia-south1');
  const [retention, setRetention] = useState('90');

  // Keep the form in sync when the user switches organization.
  useEffect(() => {
    setOrgName(currentOrg.name);
    setOrgSlug(currentOrg.slug);
  }, [currentOrg.id, currentOrg.name, currentOrg.slug]);

  const plan = PLAN_INFO[currentOrg.plan];
  const dirty = orgName.trim() !== currentOrg.name || orgSlug.trim() !== currentOrg.slug;

  const saveOrg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) return;
    updateOrg({ name: orgName.trim(), slug: orgSlug.trim() || currentOrg.slug });
    toast('Organization updated', 'check');
  };

  return (
    <AppShell crumb="Settings">
      <div className="p-4 sm:p-6 lg:p-7 max-w-[1240px] mx-auto w-full pb-16" data-od-id="settings-page">
        <PageHeader
          title="Settings"
          description={`Organization, workspaces and data defaults for ${currentOrg.name}.`}
          dataOdId="page-title"
        />

        <Tabs defaultValue="general" className="w-full">
          <TabsList variant="line" className="w-full justify-start border-b border-border rounded-none">
            <TabsTrigger value="general" className="flex-none px-3 text-xs sm:text-sm">General</TabsTrigger>
            <TabsTrigger value="workspaces" className="flex-none px-3 text-xs sm:text-sm">
              Workspaces
              <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px]">{workspacesForCurrentOrg.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="data" className="flex-none px-3 text-xs sm:text-sm">Data &amp; security</TabsTrigger>
          </TabsList>

          {/* General: org profile, plan, other orgs */}
          <TabsContent value="general" className="mt-5">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 space-y-4">
                <Card className="p-5 gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Organization</h3>
                    <p className="text-xs text-muted">Name and URL shown to everyone in the org.</p>
                  </div>
                  <form onSubmit={saveOrg} className="space-y-4 max-w-md">
                    <div className="space-y-1.5">
                      <Label htmlFor="org-name" className="text-xs">Name</Label>
                      <Input id="org-name" value={orgName} onChange={(e) => setOrgName(e.target.value)} className="h-9 text-sm" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="org-slug" className="text-xs">URL</Label>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs text-muted shrink-0">app.transform.cx/</span>
                        <Input id="org-slug" value={orgSlug} onChange={(e) => setOrgSlug(e.target.value)} className="h-9 font-mono text-xs" />
                      </div>
                    </div>
                    <Button type="submit" variant="accent" size="sm" disabled={!dirty} className="cursor-pointer">
                      Save changes
                    </Button>
                  </form>
                </Card>

                <Card className="p-5 gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Your organizations</h3>
                      <p className="text-xs text-muted">Switch between organizations you belong to.</p>
                    </div>
                    <Button variant="outline" size="sm" className="text-xs gap-1.5 cursor-pointer" onClick={() => setIsNewOrgOpen(true)}>
                      <Icon name="plus" className="w-3.5 h-3.5" />New organization
                    </Button>
                  </div>
                  <div className="divide-y divide-border">
                    {organizations.map((org) => {
                      const active = org.id === currentOrg.id;
                      return (
                        <div key={org.id} className="py-3 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="w-8 h-8 rounded-lg bg-surface-inset border border-border grid place-items-center font-bold text-xs text-foreground shrink-0">
                              {org.name.slice(0, 2).toUpperCase()}
                            </span>
                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-foreground truncate">{org.name}</div>
                              <div className="text-[11px] text-muted">{org.plan} · {org.role} · {org.memberCount} members</div>
                            </div>
                          </div>
                          {active ? (
                            <Badge variant="outline" className="text-[10px]">Current</Badge>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs cursor-pointer"
                              onClick={() => {
                                switchOrg(org.id);
                                toast(`Switched to ${org.name}`, 'check');
                              }}
                            >
                              Switch
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>

              <Card className="p-5 gap-4 self-start">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">Plan</h3>
                  <Badge variant="outline" className="border-accent text-accent-strong">{currentOrg.plan}</Badge>
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {plan.price}
                  {plan.price !== 'Free' && <span className="text-xs font-normal text-muted"> / month</span>}
                </div>
                <Separator />
                <dl className="space-y-2 text-xs">
                  <div className="flex justify-between"><dt className="text-muted">Workspaces</dt><dd className="font-semibold">{workspacesForCurrentOrg.length}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted">Seats</dt><dd className="font-semibold">{currentOrg.memberCount} / {plan.seats}</dd></div>
                </dl>
                <Button variant="outline" className="w-full text-xs cursor-pointer" onClick={() => toast('Opening billing portal…', 'ext')}>
                  Manage billing
                </Button>
              </Card>
            </div>
          </TabsContent>

          {/* Workspaces */}
          <TabsContent value="workspaces" className="mt-5">
            <Card className="p-0 gap-0 overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Workspaces</h3>
                  <p className="text-xs text-muted">Each workspace has its own jobs, flows and agents.</p>
                </div>
                <Button variant="accent" size="sm" className="gap-1.5 text-xs cursor-pointer" onClick={() => setIsNewWsOpen(true)} data-od-id="create-workspace-btn">
                  <Icon name="plus" className="w-3.5 h-3.5" />New workspace
                </Button>
              </div>
              <div className="divide-y divide-border">
                {workspacesForCurrentOrg.map((ws) => {
                  const active = ws.id === currentWorkspace.id;
                  return (
                    <div key={ws.id} className="p-4 sm:px-5 flex items-center justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <span className="w-8 h-8 rounded-lg bg-surface-inset border border-border grid place-items-center shrink-0">
                          <Icon name="folder" className="w-4 h-4 text-muted" />
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-foreground">{ws.name}</span>
                            {ws.isDefault && <Badge variant="outline" className="text-[10px] h-4">Default</Badge>}
                          </div>
                          <p className="text-xs text-muted mt-0.5">{ws.jobCount} jobs · {ws.description}</p>
                        </div>
                      </div>
                      {active ? (
                        <Badge variant="outline" className="text-[10px] shrink-0">Current</Badge>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs shrink-0 cursor-pointer"
                          onClick={() => {
                            switchWorkspace(ws.id);
                            toast(`Switched to ${ws.name}`, 'check');
                          }}
                        >
                          Switch
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          </TabsContent>

          {/* Data & security */}
          <TabsContent value="data" className="mt-5">
            <Card className="p-5 gap-5 max-w-2xl">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Data defaults</h3>
                <p className="text-xs text-muted">Applied to every workspace in {currentOrg.name}.</p>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-3.5">
                <Label htmlFor="pii" className="flex-col items-start gap-0.5">
                  <span className="text-xs font-semibold">Redact PII</span>
                  <span className="text-[11px] text-muted font-normal">Mask phone numbers, emails, IDs and card numbers before processing.</span>
                </Label>
                <Switch id="pii" checked={piiRedaction} onCheckedChange={setPiiRedaction} />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="default-region" className="text-xs">Region</Label>
                  <SelectField id="default-region" value={region} onValueChange={setRegion} options={REGIONS} size="default" className="w-full h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="data-retention" className="text-xs">Keep transcripts for</Label>
                  <SelectField id="data-retention" value={retention} onValueChange={setRetention} options={RETENTION} size="default" className="w-full h-9" />
                </div>
              </div>
              <div>
                <Button variant="accent" size="sm" className="cursor-pointer" onClick={() => toast('Data defaults saved', 'check')}>
                  Save defaults
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
