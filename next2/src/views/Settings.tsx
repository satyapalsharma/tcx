'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { CloseButton, Dialog, OpenButton, useOverlay } from '../components/Overlay';
import { useTextFilter } from '../components/ui';
import { useToast } from '../components/Toast';
import { useReveal } from '../hooks/useReveal';
import { PageHeader, StatusBadge, EmptyState, SearchToolbar } from '@/components/common';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';

type Client = {
  id: string;
  name: string;
  initials: string;
  alt?: boolean;
  contact: string;
  email: string;
  industry: string;
  projects: number;
  jobs: number;
  spend: string;
  status: 'active' | 'trial' | 'paused';
};

const CLIENTS: Client[] = [
  { id: 'skyline', name: 'Skyline Broadband', initials: 'SB', contact: 'Priya Nair', email: 'priya@skyline-broadband.com', industry: 'Telecom / ISP · Bengaluru', projects: 3, jobs: 48, spend: '₹6.4L', status: 'active' },
  { id: 'northwind', name: 'Northwind Retail', initials: 'NR', alt: true, contact: 'Rohan Gupta', email: 'rohan@northwind.in', industry: 'Retail · Pune', projects: 1, jobs: 12, spend: '₹1.1L', status: 'active' },
  { id: 'helios', name: 'Helios Health', initials: 'HH', alt: true, contact: 'Dr. Meera Iyer', email: 'meera@helios.health', industry: 'Healthcare · Hyderabad', projects: 2, jobs: 27, spend: '₹3.2L', status: 'trial' },
  { id: 'vertex', name: 'Vertex Logistics', initials: 'VL', alt: true, contact: '', email: '', industry: 'Logistics · Chennai', projects: 0, jobs: 0, spend: '₹0', status: 'paused' },
];

const SPEND = [
  { name: 'Skyline Broadband', pct: 100, amount: '₹6.4L' },
  { name: 'Helios Health', pct: 50, amount: '₹3.2L' },
  { name: 'Northwind Retail', pct: 17.2, amount: '₹1.1L' },
  { name: 'Vertex Logistics', pct: 0, amount: '₹0' },
];

export default function Settings() {
  useReveal();
  const toast = useToast();
  const { open, close } = useOverlay();
  const [clients, setClients] = useState(CLIENTS);
  const { query, setQuery, filtered, count } = useTextFilter(clients, (c) => `${c.name} ${c.contact} ${c.industry}`);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState({ name: '', contact: '', industry: '', active: true });
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const [piiDefault, setPiiDefault] = useState(true);
  const [costClient, setCostClient] = useState(true);
  const [costTag, setCostTag] = useState(true);
  const [costBlock, setCostBlock] = useState(false);

  useEffect(() => {
    if (window.location.hash === '#clients') toast('Manage clients for cost tagging below', 'info');
  }, [toast]);

  const openClient = (c?: Client) => {
    setEditing(c ?? null);
    setForm(c
      ? { name: c.name, contact: c.email, industry: c.industry.split(' · ')[0] ?? c.industry, active: c.status !== 'paused' }
      : { name: '', contact: '', industry: '', active: true });
    open('dlg-client');
  };

  const saveClient = () => {
    const name = form.name.trim() || 'Untitled client';
    close();
    toast(editing ? `Client "${name}" updated` : `Client "${name}" added — selectable on new jobs`, 'check');
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setClients((prev) => prev.filter((c) => c.id !== deleteTarget.id));
    close();
    toast(`${deleteTarget.name} removed from clients`, 'trash');
    setDeleteTarget(null);
  };

  return (
    <AppShell crumb="Settings">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6" data-od-id="settings-page">
        <PageHeader
          title="Settings"
          description="Clients, workspace defaults and cost tagging. Every job a team runs is billed to a client, so keep this list current."
          dataOdId="page-title"
          className="pb-4 border-b border-border mb-0"
        />

        <Tabs defaultValue="clients" className="w-full">
          <TabsList variant="line" className="border-b border-border w-full justify-start rounded-none h-10 p-0 gap-4">
            <TabsTrigger value="clients" className="h-10 px-3 border-b-2 border-transparent data-[state=active]:border-foreground rounded-none font-medium text-xs sm:text-sm">
              Clients <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-surface-inset text-muted font-normal ml-1.5">{clients.length}</span>
            </TabsTrigger>
            <TabsTrigger value="workspace" className="h-10 px-3 border-b-2 border-transparent data-[state=active]:border-foreground rounded-none font-medium text-xs sm:text-sm">
              Workspace
            </TabsTrigger>
            <TabsTrigger value="cost" className="h-10 px-3 border-b-2 border-transparent data-[state=active]:border-foreground rounded-none font-medium text-xs sm:text-sm">
              Cost &amp; budgets
            </TabsTrigger>
          </TabsList>

          <TabsContent value="clients" className="mt-4">
            <Card className="bg-surface border border-border rounded-xl shadow-xs overflow-hidden p-0 gap-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:px-5 sm:py-3.5 border-b border-border">
                <h3 className="text-sm font-semibold text-foreground">Clients</h3>
                <div className="flex flex-wrap items-center gap-2">
                  <SearchToolbar
                    query={query}
                    onQueryChange={setQuery}
                    placeholder="Search clients"
                    count={count}
                    countLabel="shown"
                  />
                  <OpenButton
                    variant="accent"
                    size="sm"
                    target="dlg-client"
                    data-od-id="add-client-btn"
                  >
                    <Icon name="plus" />Add client
                  </OpenButton>
                </div>
              </div>

              <Table>
                <TableHeader className="bg-surface-inset/60 text-muted font-semibold border-b border-border">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="px-4 py-2.5 whitespace-nowrap text-muted font-semibold">Client</TableHead>
                    <TableHead className="px-4 py-2.5 whitespace-nowrap text-muted font-semibold">Primary contact</TableHead>
                    <TableHead className="px-4 py-2.5 whitespace-nowrap text-right text-muted font-semibold">Projects</TableHead>
                    <TableHead className="px-4 py-2.5 whitespace-nowrap text-right text-muted font-semibold">Jobs · 30d</TableHead>
                    <TableHead className="px-4 py-2.5 whitespace-nowrap text-right text-muted font-semibold">Spend · 30d</TableHead>
                    <TableHead className="px-4 py-2.5 whitespace-nowrap text-muted font-semibold">Status</TableHead>
                    <TableHead className="px-4 py-2.5 whitespace-nowrap w-20" />
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border/60">
                  {filtered.map((c) => {
                    const statusType = c.status === 'active' ? 'ok' : c.status === 'trial' ? 'accent' : 'neutral';
                    return (
                      <TableRow key={c.id} className="hover:bg-surface-hover/30 transition-colors" data-od-id={`client-${c.id}`}>
                        <TableCell className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <span className={`w-7 h-7 rounded-md flex items-center justify-center text-[10.5px] font-bold shrink-0 ${c.alt ? 'bg-surface-inset text-muted border border-border' : 'bg-foreground text-surface'}`}>
                              {c.initials}
                            </span>
                            <div>
                              <div className="font-semibold text-foreground text-xs">{c.name}</div>
                              <div className="text-[11.5px] text-muted">{c.industry}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 whitespace-nowrap">
                          {c.contact ? (
                            <div>
                              <div className="text-foreground">{c.contact}</div>
                              <div className="text-[11.5px] text-muted">{c.email}</div>
                            </div>
                          ) : (
                            <div className="text-muted">No contact yet</div>
                          )}
                        </TableCell>
                        <TableCell className={`px-4 py-3 whitespace-nowrap text-right font-mono tabular-nums ${c.projects === 0 ? 'text-muted' : 'text-foreground font-semibold'}`}>{c.projects}</TableCell>
                        <TableCell className={`px-4 py-3 whitespace-nowrap text-right font-mono tabular-nums ${c.jobs === 0 ? 'text-muted' : 'text-foreground font-semibold'}`}>{c.jobs}</TableCell>
                        <TableCell className={`px-4 py-3 whitespace-nowrap text-right font-mono tabular-nums ${c.spend === '₹0' ? 'text-muted' : 'text-foreground font-semibold'}`}>{c.spend}</TableCell>
                        <TableCell className="px-4 py-3 whitespace-nowrap">
                          <StatusBadge status={statusType}>
                            {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                          </StatusBadge>
                        </TableCell>
                        <TableCell className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1 justify-end">
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              aria-label="Edit client"
                              onClick={() => openClient(c)}
                            >
                              <Icon name="edit" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="hover:text-danger-fg hover:bg-danger-soft"
                              aria-label="Delete client"
                              onClick={() => { setDeleteTarget(c); open('dlg-confirm'); }}
                            >
                              <Icon name="trash" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {filtered.length === 0 && (
                <EmptyState
                  icon="filter"
                  title="No clients match this search."
                  dataOdId="clients-empty"
                />
              )}
            </Card>
          </TabsContent>

          <TabsContent value="workspace" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="bg-surface border border-border rounded-xl p-4 sm:p-5 shadow-xs flex flex-col gap-4">
                <div>
                  <Label className="block text-xs font-semibold text-foreground mb-1.5">Workspace name</Label>
                  <Input defaultValue="Skyline workspace" aria-label="Workspace name" />
                </div>
                <div>
                  <Label className="block text-xs font-semibold text-foreground mb-1.5">Default region</Label>
                  <select className="w-full h-9 px-3 rounded-md border border-border bg-surface text-xs sm:text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent" aria-label="Default region">
                    <option>asia-south1 (Mumbai)</option>
                    <option>us-central1</option>
                    <option>eu-west1</option>
                  </select>
                </div>
                <div className="flex items-center justify-between py-1">
                  <div>
                    <div className="text-xs font-semibold text-foreground">PII redaction by default</div>
                    <div className="text-[11.5px] text-muted">Applied to every new upload unless overridden.</div>
                  </div>
                  <Switch checked={piiDefault} onCheckedChange={setPiiDefault} aria-label="PII redaction by default" />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="self-start mt-1"
                  onClick={() => toast('Workspace defaults saved', 'check')}
                >
                  Save defaults
                </Button>
              </Card>

              <Card className="bg-surface border border-border rounded-xl p-4 sm:p-5 shadow-xs flex flex-col gap-3">
                <div className="text-xs font-semibold text-foreground">Cost tagging</div>
                <div className="flex items-center justify-between py-2 border-b border-border/50 text-xs">
                  <span className="text-muted">Require client on every job</span>
                  <Switch checked={costClient} onCheckedChange={setCostClient} aria-label="Require client" />
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border/50 text-xs">
                  <span className="text-muted">Tag build minutes to the project client</span>
                  <Switch checked={costTag} onCheckedChange={setCostTag} aria-label="Tag build minutes" />
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border/50 text-xs">
                  <span className="text-muted">Block runs with no client set</span>
                  <Switch checked={costBlock} onCheckedChange={setCostBlock} aria-label="Block runs with no client" />
                </div>
                <div className="text-[11.5px] text-muted mt-1 leading-relaxed">
                  Tags flow into Cost &amp; budgets and into the jobs table, so a client can be filtered and recharged.
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="cost" className="mt-4">
            <Card className="bg-surface border border-border rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
              <div className="pb-3 border-b border-border">
                <h3 className="text-sm font-semibold text-foreground">Spend by client · last 30 days</h3>
              </div>
              <div className="flex flex-col gap-3">
                {SPEND.map((s) => (
                  <div key={s.name} className="grid grid-cols-[130px_1fr_60px] sm:grid-cols-[160px_1fr_70px] items-center gap-3 text-xs">
                    <span className="font-medium text-foreground truncate">{s.name}</span>
                    <Progress value={s.pct} className="h-2" />
                    <span className="font-mono tabular-nums text-right text-muted">{s.amount}</span>
                  </div>
                ))}
              </div>
              <p className="text-[11.5px] text-muted pt-2 border-t border-border/60">
                Bar width is proportional to spend; the maximum is ₹6.4L (Skyline Broadband). Real billing figures sync from the metering service.
              </p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog id="dlg-client" data-od-id="client-dialog">
        <div className="p-4 sm:p-5 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">{editing ? `Edit ${editing.name}` : 'Add client'}</h2>
          <p className="text-xs text-muted mt-0.5">A client is who the work is billed to. Teams pick it when they create a job, so cost reporting can be sliced per client.</p>
        </div>
        <div className="p-4 sm:p-5 flex flex-col gap-4">
          <div>
            <Label className="block text-xs font-semibold text-foreground mb-1.5" htmlFor="c-name">Client name</Label>
            <Input id="c-name" placeholder="e.g. Northwind Retail" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label className="block text-xs font-semibold text-foreground mb-1.5" htmlFor="c-contact">Primary contact email</Label>
            <Input id="c-contact" type="email" placeholder="name@company.com" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
          </div>
          <div>
            <Label className="block text-xs font-semibold text-foreground mb-1.5" htmlFor="c-industry">Industry</Label>
            <Input id="c-industry" placeholder="e.g. Telecom / ISP" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
          </div>
          <div className="flex items-center justify-between py-1">
            <div>
              <div className="text-xs font-semibold text-foreground">Active</div>
              <div className="text-[11.5px] text-muted">Inactive clients can&apos;t be picked on new jobs.</div>
            </div>
            <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} aria-label="Active" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 p-4 border-t border-border bg-surface-inset/30">
          <CloseButton variant="outline" size="sm">Cancel</CloseButton>
          <Button variant="accent" size="sm" data-od-id="client-save" onClick={saveClient}>Save client</Button>
        </div>
      </Dialog>

      <Dialog id="dlg-confirm" data-od-id="confirm-dialog">
        <div className="p-4 sm:p-5 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">Delete {deleteTarget?.name}?</h2>
          <p className="text-xs text-muted mt-0.5">Jobs already run stay in the workspace and keep their cost history, but new jobs can no longer be tagged to this client unless it is re-added.</p>
        </div>
        <div className="flex items-center justify-end gap-2 p-4 border-t border-border bg-surface-inset/30">
          <CloseButton variant="outline" size="sm">Cancel</CloseButton>
          <Button
            variant="destructive"
            size="sm"
            onClick={confirmDelete}
          >
            Delete client
          </Button>
        </div>
      </Dialog>
    </AppShell>
  );
}
