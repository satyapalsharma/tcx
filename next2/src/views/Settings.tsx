'use client';

import { useState } from 'react';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { CloseButton, Dialog, useOverlay } from '../components/Overlay';
import { useToast } from '../components/Toast';
import { useReveal } from '../hooks/useReveal';
import { useApp } from '@/context/AppContext';
import { PageHeader, StatusBadge, EmptyState } from '@/components/common';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

type ClientAccount = {
  id: string;
  name: string;
  initials: string;
  industry: string;
  projects: number;
  jobs: number;
  spend: string;
  status: 'active' | 'trial' | 'paused';
};

const CLIENT_ACCOUNTS: ClientAccount[] = [
  { id: 'skyline', name: 'Skyline Broadband', initials: 'SB', industry: 'Telecom / ISP · Bengaluru', projects: 3, jobs: 48, spend: '₹6.4L', status: 'active' },
  { id: 'northwind', name: 'Northwind Retail', initials: 'NR', industry: 'Retail · Pune', projects: 1, jobs: 12, spend: '₹1.1L', status: 'active' },
  { id: 'helios', name: 'Helios Health', initials: 'HH', industry: 'Healthcare · Hyderabad', projects: 2, jobs: 27, spend: '₹3.2L', status: 'trial' },
];

export default function Settings() {
  useReveal();
  const toast = useToast();
  const { open, close } = useOverlay();
  const {
    currentOrg,
    organizations,
    switchOrg,
    workspacesForCurrentOrg,
    currentWorkspace,
    switchWorkspace,
    setIsNewOrgOpen,
    setIsNewWsOpen,
  } = useApp();

  const [activeTab, setActiveTab] = useState('organization');
  const [orgName, setOrgName] = useState(currentOrg.name);
  const [orgSlug, setOrgSlug] = useState(currentOrg.slug);
  const [piiRedaction, setPiiRedaction] = useState(true);
  const [dataRetention, setDataRetention] = useState('90');
  const [defaultRegion, setDefaultRegion] = useState('asia-south1');
  const [clients] = useState<ClientAccount[]>(CLIENT_ACCOUNTS);

  const handleSaveOrg = (e: React.FormEvent) => {
    e.preventDefault();
    toast('Organization settings updated successfully', 'check');
  };

  const handleSaveDefaults = (e: React.FormEvent) => {
    e.preventDefault();
    toast('Workspace & security defaults saved', 'check');
  };

  return (
    <AppShell crumb="Settings">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6" data-od-id="settings-page">
        <PageHeader
          title="Organization & Settings"
          description={`Manage ${currentOrg.name}, workspaces, billing plans, and global pipeline defaults.`}
          dataOdId="page-title"
          className="pb-4 border-b border-border mb-0"
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList variant="line" className="border-b border-border w-full justify-start rounded-none h-11 p-0 gap-6">
            <TabsTrigger
              value="organization"
              className="h-11 px-1 border-b-2 border-transparent data-[state=active]:border-foreground rounded-none font-medium text-xs sm:text-sm cursor-pointer"
            >
              Organization &amp; Plan
            </TabsTrigger>
            <TabsTrigger
              value="workspaces"
              className="h-11 px-1 border-b-2 border-transparent data-[state=active]:border-foreground rounded-none font-medium text-xs sm:text-sm cursor-pointer"
            >
              Workspaces <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-surface-inset text-muted font-normal ml-1.5">{workspacesForCurrentOrg.length}</span>
            </TabsTrigger>
            <TabsTrigger
              value="clients"
              className="h-11 px-1 border-b-2 border-transparent data-[state=active]:border-foreground rounded-none font-medium text-xs sm:text-sm cursor-pointer"
            >
              Billing &amp; Clients
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="h-11 px-1 border-b-2 border-transparent data-[state=active]:border-foreground rounded-none font-medium text-xs sm:text-sm cursor-pointer"
            >
              Security &amp; Defaults
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: Organization & Plan */}
          <TabsContent value="organization" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card className="p-5 bg-surface border border-border rounded-xl shadow-xs space-y-4">
                  <div className="border-b border-border pb-3">
                    <h3 className="text-sm font-semibold text-foreground">Organization Profile</h3>
                    <p className="text-xs text-muted">Primary name and routing slug for your organization.</p>
                  </div>
                  <form onSubmit={handleSaveOrg} className="space-y-4">
                    <div>
                      <Label htmlFor="org-name" className="text-xs font-semibold text-foreground mb-1 block">
                        Organization Name
                      </Label>
                      <Input
                        id="org-name"
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        className="max-w-md h-9 text-xs sm:text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="org-slug" className="text-xs font-semibold text-foreground mb-1 block">
                        Organization Slug
                      </Label>
                      <div className="flex items-center gap-1 text-xs text-muted max-w-md">
                        <span className="font-mono text-muted">app.transform.cx/</span>
                        <Input
                          id="org-slug"
                          value={orgSlug}
                          onChange={(e) => setOrgSlug(e.target.value)}
                          className="flex-1 h-9 font-mono text-xs"
                        />
                      </div>
                    </div>
                    <div className="pt-2 flex items-center gap-3">
                      <Button type="submit" variant="accent" size="sm" className="cursor-pointer">
                        Save changes
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsNewOrgOpen(true)}
                        className="cursor-pointer"
                      >
                        <Icon name="plus" className="w-3.5 h-3.5 mr-1.5" />
                        Create new organization
                      </Button>
                    </div>
                  </form>
                </Card>

                {/* Switch Organization Quick List */}
                <Card className="p-5 bg-surface border border-border rounded-xl shadow-xs space-y-4">
                  <div className="border-b border-border pb-3 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Your Organizations</h3>
                      <p className="text-xs text-muted">Quickly switch between tenant organizations you belong to.</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsNewOrgOpen(true)}
                      className="cursor-pointer text-xs"
                    >
                      + New Org
                    </Button>
                  </div>
                  <div className="divide-y divide-border/60">
                    {organizations.map((org) => {
                      const isActive = org.id === currentOrg.id;
                      return (
                        <div key={org.id} className="py-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-surface-inset border border-border grid place-items-center font-bold text-xs text-foreground">
                              {org.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-foreground flex items-center gap-2">
                                {org.name}
                                {isActive && (
                                  <Badge variant="default" className="text-[10px] py-0 px-1.5 bg-accent text-accent-fg">
                                    Active
                                  </Badge>
                                )}
                              </div>
                              <div className="text-[11px] text-muted">
                                {org.plan} Plan · {org.role} · {org.memberCount} members
                              </div>
                            </div>
                          </div>
                          {!isActive && (
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

              {/* Subscription Plan Card */}
              <div className="space-y-6">
                <Card className="p-5 bg-surface border border-border rounded-xl shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase font-bold tracking-wider text-muted">Subscription</span>
                    <Badge variant="outline" className="border-accent text-accent font-semibold text-[11px]">
                      {currentOrg.plan}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-foreground">₹2.4L <span className="text-xs font-normal text-muted">/ month</span></div>
                    <div className="text-xs text-muted mt-1">Billed annually · Renews on Nov 15, 2026</div>
                  </div>
                  <div className="space-y-2 py-3 border-y border-border text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted">Workspaces</span>
                      <span className="font-semibold text-foreground">{workspacesForCurrentOrg.length} / Unlimited</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Team Seats</span>
                      <span className="font-semibold text-foreground">{currentOrg.memberCount} / 25 seats</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Monthly Model Tokens</span>
                      <span className="font-semibold text-foreground">14.2M / 50M</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full text-xs font-semibold cursor-pointer"
                    onClick={() => toast('Redirecting to billing portal...', 'info')}
                  >
                    Manage billing &amp; invoices
                  </Button>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: Workspaces */}
          <TabsContent value="workspaces" className="mt-6 space-y-4">
            <Card className="bg-surface border border-border rounded-xl shadow-xs overflow-hidden p-0 gap-0">
              <div className="p-4 sm:p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Workspaces in {currentOrg.name}
                  </h3>
                  <p className="text-xs text-muted">
                    Workspaces segment your jobs, pipeline traces, connectors, and agent deployments.
                  </p>
                </div>
                <Button
                  variant="accent"
                  size="sm"
                  className="gap-1.5 cursor-pointer text-xs"
                  onClick={() => setIsNewWsOpen(true)}
                  data-od-id="create-workspace-btn"
                >
                  <Icon name="plus" className="w-3.5 h-3.5" />
                  Create workspace
                </Button>
              </div>

              <div className="divide-y divide-border/60">
                {workspacesForCurrentOrg.map((ws) => {
                  const isCurrent = ws.id === currentWorkspace.id;
                  return (
                    <div
                      key={ws.id}
                      className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-surface-hover/30 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-surface-inset border border-border grid place-items-center text-foreground mt-0.5">
                          <Icon name="grid" className="w-4 h-4 text-muted" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">{ws.name}</span>
                            {isCurrent && (
                              <Badge variant="default" className="text-[10px] py-0 px-1.5 bg-accent text-accent-fg">
                                Active Workspace
                              </Badge>
                            )}
                            {ws.isDefault && (
                              <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-border text-muted">
                                Default
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted mt-0.5">{ws.description}</p>
                          <div className="flex items-center gap-4 mt-1.5 text-[11px] text-muted font-mono">
                            <span>ID: {ws.id}</span>
                            <span>{ws.jobCount} total jobs</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {!isCurrent && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs cursor-pointer"
                            onClick={() => {
                              switchWorkspace(ws.id);
                              toast(`Switched to workspace: ${ws.name}`, 'check');
                            }}
                          >
                            Switch to this
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="text-muted hover:text-foreground cursor-pointer"
                          title="Rename Workspace"
                          onClick={() => toast(`Editing ${ws.name}`, 'edit')}
                        >
                          <Icon name="edit" className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </TabsContent>

          {/* TAB 3: Clients & Billing */}
          <TabsContent value="clients" className="mt-6 space-y-4">
            <Card className="bg-surface border border-border rounded-xl shadow-xs overflow-hidden p-0 gap-0">
              <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Client Accounts &amp; Cost Tagging</h3>
                  <p className="text-xs text-muted">Every pipeline run can be tagged to a client for cost attribution.</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="cursor-pointer text-xs"
                  onClick={() => toast('Client creation modal coming soon', 'info')}
                >
                  + Add Client Account
                </Button>
              </div>

              <Table>
                <TableHeader className="bg-surface-inset/50 border-b border-border">
                  <TableRow className="text-[11px] font-semibold uppercase tracking-wider text-muted hover:bg-transparent">
                    <TableHead className="px-4 py-3 text-muted">Client</TableHead>
                    <TableHead className="px-4 py-3 text-muted">Industry</TableHead>
                    <TableHead className="px-4 py-3 text-right text-muted">Projects</TableHead>
                    <TableHead className="px-4 py-3 text-right text-muted">Jobs (30d)</TableHead>
                    <TableHead className="px-4 py-3 text-right text-muted">Spend (30d)</TableHead>
                    <TableHead className="px-4 py-3 text-muted">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border/60">
                  {clients.map((c) => (
                    <TableRow key={c.id} className="hover:bg-surface-hover/30 transition-colors">
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="w-7 h-7 rounded-md bg-foreground text-background flex items-center justify-center text-[10px] font-bold shrink-0">
                            {c.initials}
                          </span>
                          <span className="font-semibold text-xs text-foreground">{c.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-xs text-muted">{c.industry}</TableCell>
                      <TableCell className="px-4 py-3 text-xs text-right font-mono text-foreground font-semibold">{c.projects}</TableCell>
                      <TableCell className="px-4 py-3 text-xs text-right font-mono text-foreground font-semibold">{c.jobs}</TableCell>
                      <TableCell className="px-4 py-3 text-xs text-right font-mono text-foreground font-semibold">{c.spend}</TableCell>
                      <TableCell className="px-4 py-3">
                        <StatusBadge status={c.status === 'active' ? 'ok' : 'neutral'}>
                          {c.status.toUpperCase()}
                        </StatusBadge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* TAB 4: Security & Defaults (Occam's razor: Only essential, functional fields) */}
          <TabsContent value="security" className="mt-6 space-y-4">
            <Card className="p-5 bg-surface border border-border rounded-xl shadow-xs space-y-5 max-w-2xl">
              <div className="border-b border-border pb-3">
                <h3 className="text-sm font-semibold text-foreground">Pipeline &amp; Data Defaults</h3>
                <p className="text-xs text-muted">Essential configuration applied across all workspaces in {currentOrg.name}.</p>
              </div>

              <form onSubmit={handleSaveDefaults} className="space-y-4">
                <div className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-surface-inset/40">
                  <div>
                    <div className="text-xs font-semibold text-foreground">Automatic PII Redaction</div>
                    <p className="text-[11px] text-muted mt-0.5">
                      Mask phone numbers, emails, customer IDs, and payment details before LLM ingestion.
                    </p>
                  </div>
                  <Switch
                    checked={piiRedaction}
                    onCheckedChange={setPiiRedaction}
                    aria-label="Toggle PII Redaction"
                  />
                </div>

                <div>
                  <Label htmlFor="default-region" className="text-xs font-semibold text-foreground mb-1 block">
                    Default Cloud Region
                  </Label>
                  <select
                    id="default-region"
                    value={defaultRegion}
                    onChange={(e) => setDefaultRegion(e.target.value)}
                    className="w-full h-9 px-3 rounded-md border border-border bg-surface text-xs sm:text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    <option value="asia-south1">asia-south1 (Mumbai, India)</option>
                    <option value="us-east-1">us-east-1 (N. Virginia, USA)</option>
                    <option value="eu-west-1">eu-west-1 (Dublin, Ireland)</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="data-retention" className="text-xs font-semibold text-foreground mb-1 block">
                    Transcript &amp; Audio Retention
                  </Label>
                  <select
                    id="data-retention"
                    value={dataRetention}
                    onChange={(e) => setDataRetention(e.target.value)}
                    className="w-full h-9 px-3 rounded-md border border-border bg-surface text-xs sm:text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    <option value="30">30 days (Ephemeral compliance)</option>
                    <option value="90">90 days (Recommended)</option>
                    <option value="365">1 year (Audit compliance)</option>
                  </select>
                </div>

                <div className="pt-2">
                  <Button type="submit" variant="accent" size="sm" className="cursor-pointer">
                    Save defaults
                  </Button>
                </div>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
