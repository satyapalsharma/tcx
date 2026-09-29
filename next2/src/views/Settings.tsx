'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { CloseButton, Dialog, OpenButton, useOverlay } from '../components/Overlay';
import { Switch, Tabs, useTextFilter } from '../components/ui';
import { useToast } from '../components/Toast';
import { useReveal } from '../hooks/useReveal';

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

  const statusBadge = (status: Client['status']) => {
    if (status === 'active') return <span className="inline-flex items-center gap-1.5 h-5 px-2 rounded-full text-[11px] font-medium bg-success-soft text-success-fg"><span className="w-1.5 h-1.5 rounded-full bg-current" />Active</span>;
    if (status === 'trial') return <span className="inline-flex items-center gap-1.5 h-5 px-2 rounded-full text-[11px] font-medium bg-accent-soft text-accent-strong"><span className="w-1.5 h-1.5 rounded-full bg-current" />Trial</span>;
    return <span className="inline-flex items-center gap-1.5 h-5 px-2 rounded-full text-[11px] font-medium bg-surface-inset text-muted"><span className="w-1.5 h-1.5 rounded-full bg-current" />Paused</span>;
  };

  return (
    <AppShell crumb="Settings">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6" data-od-id="settings-page">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-border">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground" data-od-id="page-title">Settings</h1>
            <p className="text-xs sm:text-sm text-muted mt-1 max-w-2xl leading-relaxed">
              Clients, workspace defaults and cost tagging. Every job a team runs is billed to a client, so keep this list current.
            </p>
          </div>
        </div>

        <Tabs
          defaultTab="clients"
          tabs={[
            { id: 'clients', label: <>Clients <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-surface-inset text-muted font-normal">{clients.length}</span></> },
            { id: 'workspace', label: 'Workspace' },
            { id: 'cost', label: 'Cost & budgets' },
          ]}
          panels={{
            clients: (
              <div className="bg-surface border border-border rounded-xl shadow-xs overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:px-5 sm:py-3.5 border-b border-border">
                  <h3 className="text-sm font-semibold text-foreground">Clients</h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <Icon name="search" className="absolute left-2.5 top-2.5 text-muted pointer-events-none" />
                      <input
                        className="h-8 pl-8 pr-3 w-48 sm:w-56 rounded-md border border-border bg-surface text-xs text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-1 focus:ring-accent"
                        placeholder="Search clients"
                        aria-label="Search clients"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                      />
                    </div>
                    <span className="text-xs text-muted font-medium"><span>{count}</span> shown</span>
                    <OpenButton
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium bg-accent-strong text-white hover:bg-accent-hover active:bg-accent-active transition-colors shadow-xs cursor-pointer"
                      target="dlg-client"
                      data-od-id="add-client-btn"
                    >
                      <Icon name="plus" />Add client
                    </OpenButton>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-surface-inset/60 text-muted font-semibold border-b border-border">
                      <tr>
                        <th className="px-4 py-2.5 whitespace-nowrap">Client</th>
                        <th className="px-4 py-2.5 whitespace-nowrap">Primary contact</th>
                        <th className="px-4 py-2.5 whitespace-nowrap text-right">Projects</th>
                        <th className="px-4 py-2.5 whitespace-nowrap text-right">Jobs · 30d</th>
                        <th className="px-4 py-2.5 whitespace-nowrap text-right">Spend · 30d</th>
                        <th className="px-4 py-2.5 whitespace-nowrap">Status</th>
                        <th className="px-4 py-2.5 whitespace-nowrap w-20" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {filtered.map((c) => (
                        <tr key={c.id} className="hover:bg-surface-hover/30 transition-colors" data-od-id={`client-${c.id}`}>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2.5">
                              <span className={`w-7 h-7 rounded-md flex items-center justify-center text-[10.5px] font-bold shrink-0 ${c.alt ? 'bg-surface-inset text-muted border border-border' : 'bg-foreground text-surface'}`}>
                                {c.initials}
                              </span>
                              <div>
                                <div className="font-semibold text-foreground text-xs">{c.name}</div>
                                <div className="text-[11.5px] text-muted">{c.industry}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {c.contact ? (
                              <div>
                                <div className="text-foreground">{c.contact}</div>
                                <div className="text-[11.5px] text-muted">{c.email}</div>
                              </div>
                            ) : (
                              <div className="text-muted">No contact yet</div>
                            )}
                          </td>
                          <td className={`px-4 py-3 whitespace-nowrap text-right font-mono tabular-nums ${c.projects === 0 ? 'text-muted' : 'text-foreground font-semibold'}`}>{c.projects}</td>
                          <td className={`px-4 py-3 whitespace-nowrap text-right font-mono tabular-nums ${c.jobs === 0 ? 'text-muted' : 'text-foreground font-semibold'}`}>{c.jobs}</td>
                          <td className={`px-4 py-3 whitespace-nowrap text-right font-mono tabular-nums ${c.spend === '₹0' ? 'text-muted' : 'text-foreground font-semibold'}`}>{c.spend}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{statusBadge(c.status)}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-1 justify-end">
                              <button
                                type="button"
                                className="inline-flex items-center justify-center w-7 h-7 rounded-md text-muted hover:text-foreground hover:bg-surface-hover transition-colors cursor-pointer"
                                aria-label="Edit client"
                                onClick={() => openClient(c)}
                              >
                                <Icon name="edit" />
                              </button>
                              <button
                                type="button"
                                className="inline-flex items-center justify-center w-7 h-7 rounded-md text-muted hover:text-danger-fg hover:bg-danger-soft transition-colors cursor-pointer"
                                aria-label="Delete client"
                                onClick={() => { setDeleteTarget(c); open('dlg-confirm'); }}
                              >
                                <Icon name="trash" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filtered.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-xs text-muted" data-od-id="clients-empty">
                    <div className="mb-2 text-muted"><Icon name="filter" large className="w-4.5 h-4.5" /></div>
                    No clients match this search.
                  </div>
                )}
              </div>
            ),
            workspace: (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-surface border border-border rounded-xl p-4 sm:p-5 shadow-xs flex flex-col gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">Workspace name</label>
                    <input className="w-full h-9 px-3 rounded-md border border-border bg-surface text-xs sm:text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent" defaultValue="Skyline workspace" aria-label="Workspace name" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">Default region</label>
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
                    <Switch checked={piiDefault} onChange={setPiiDefault} label="PII redaction by default" />
                  </div>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center h-8 px-3 rounded-md text-xs font-medium border border-border bg-surface hover:bg-surface-hover text-foreground transition-colors self-start cursor-pointer mt-1"
                    onClick={() => toast('Workspace defaults saved', 'check')}
                  >
                    Save defaults
                  </button>
                </div>

                <div className="bg-surface border border-border rounded-xl p-4 sm:p-5 shadow-xs flex flex-col gap-3">
                  <div className="text-xs font-semibold text-foreground">Cost tagging</div>
                  <div className="flex items-center justify-between py-2 border-b border-border/50 text-xs">
                    <span className="text-muted">Require client on every job</span>
                    <Switch checked={costClient} onChange={setCostClient} label="Require client" />
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border/50 text-xs">
                    <span className="text-muted">Tag build minutes to the project client</span>
                    <Switch checked={costTag} onChange={setCostTag} label="Tag build minutes" />
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border/50 text-xs">
                    <span className="text-muted">Block runs with no client set</span>
                    <Switch checked={costBlock} onChange={setCostBlock} label="Block runs with no client" />
                  </div>
                  <div className="text-[11.5px] text-muted mt-1 leading-relaxed">
                    Tags flow into Cost &amp; budgets and into the jobs table, so a client can be filtered and recharged.
                  </div>
                </div>
              </div>
            ),
            cost: (
              <div className="bg-surface border border-border rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
                <div className="pb-3 border-b border-border">
                  <h3 className="text-sm font-semibold text-foreground">Spend by client · last 30 days</h3>
                </div>
                <div className="flex flex-col gap-3">
                  {SPEND.map((s) => (
                    <div key={s.name} className="grid grid-cols-[130px_1fr_60px] sm:grid-cols-[160px_1fr_70px] items-center gap-3 text-xs">
                      <span className="font-medium text-foreground truncate">{s.name}</span>
                      <div className="w-full h-2 bg-surface-inset rounded-full overflow-hidden">
                        <div className="h-full bg-accent-strong rounded-full transition-all" style={{ width: `${s.pct}%` }} />
                      </div>
                      <span className="font-mono tabular-nums text-right text-muted">{s.amount}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[11.5px] text-muted pt-2 border-t border-border/60">
                  Bar width is proportional to spend; the maximum is ₹6.4L (Skyline Broadband). Real billing figures sync from the metering service.
                </p>
              </div>
            ),
          }}
        />
      </div>

      <Dialog id="dlg-client" data-od-id="client-dialog">
        <div className="p-4 sm:p-5 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">{editing ? `Edit ${editing.name}` : 'Add client'}</h2>
          <p className="text-xs text-muted mt-0.5">A client is who the work is billed to. Teams pick it when they create a job, so cost reporting can be sliced per client.</p>
        </div>
        <div className="p-4 sm:p-5 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5" htmlFor="c-name">Client name</label>
            <input className="w-full h-9 px-3 rounded-md border border-border bg-surface text-xs sm:text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent" id="c-name" placeholder="e.g. Northwind Retail" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5" htmlFor="c-contact">Primary contact email</label>
            <input className="w-full h-9 px-3 rounded-md border border-border bg-surface text-xs sm:text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent" id="c-contact" type="email" placeholder="name@company.com" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5" htmlFor="c-industry">Industry</label>
            <input className="w-full h-9 px-3 rounded-md border border-border bg-surface text-xs sm:text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent" id="c-industry" placeholder="e.g. Telecom / ISP" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
          </div>
          <div className="flex items-center justify-between py-1">
            <div>
              <div className="text-xs font-semibold text-foreground">Active</div>
              <div className="text-[11.5px] text-muted">Inactive clients can&apos;t be picked on new jobs.</div>
            </div>
            <Switch checked={form.active} onChange={(v) => setForm({ ...form, active: v })} label="Active" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 p-4 border-t border-border bg-surface-inset/30">
          <CloseButton className="inline-flex items-center justify-center h-8 px-3 rounded-md text-xs font-medium border border-border bg-surface hover:bg-surface-hover text-foreground transition-colors cursor-pointer">Cancel</CloseButton>
          <button type="button" className="inline-flex items-center justify-center h-8 px-3.5 rounded-md text-xs font-medium bg-accent-strong text-white hover:bg-accent-hover transition-colors shadow-xs cursor-pointer" data-od-id="client-save" onClick={saveClient}>Save client</button>
        </div>
      </Dialog>

      <Dialog id="dlg-confirm" data-od-id="confirm-dialog">
        <div className="p-4 sm:p-5 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">Delete {deleteTarget?.name}?</h2>
          <p className="text-xs text-muted mt-0.5">Jobs already run stay in the workspace and keep their cost history, but new jobs can no longer be tagged to this client unless it is re-added.</p>
        </div>
        <div className="flex items-center justify-end gap-2 p-4 border-t border-border bg-surface-inset/30">
          <CloseButton className="inline-flex items-center justify-center h-8 px-3 rounded-md text-xs font-medium border border-border bg-surface hover:bg-surface-hover text-foreground transition-colors cursor-pointer">Cancel</CloseButton>
          <button
            type="button"
            className="inline-flex items-center justify-center h-8 px-3.5 rounded-md text-xs font-medium bg-danger-soft text-danger-fg border border-danger/20 hover:bg-danger-soft/80 transition-colors shadow-xs cursor-pointer"
            onClick={confirmDelete}
          >
            Delete client
          </button>
        </div>
      </Dialog>
    </AppShell>
  );
}
