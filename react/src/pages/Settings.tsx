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
    if (status === 'active') return <span className="badge badge-ok"><span className="dot" />Active</span>;
    if (status === 'trial') return <span className="badge badge-acc"><span className="dot" />Trial</span>;
    return <span className="badge"><span className="dot" />Paused</span>;
  };

  return (
    <AppShell crumb="Settings">
      <div className="page" data-od-id="settings-page">
        <div className="page-h">
          <div style={{ flex: 1 }}>
            <h1 data-od-id="page-title">Settings</h1>
            <p className="sub">Clients, workspace defaults and cost tagging. Every job a team runs is billed to a client, so keep this list current.</p>
          </div>
        </div>

        <Tabs
          defaultTab="clients"
          tabs={[
            { id: 'clients', label: <>Clients <span className="count">{clients.length}</span></> },
            { id: 'workspace', label: 'Workspace' },
            { id: 'cost', label: 'Cost & budgets' },
          ]}
          panels={{
            clients: (
              <div className="card">
                <div className="card-h" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                  <h3>Clients</h3>
                  <div className="row" style={{ gap: 8 }}>
                    <div style={{ position: 'relative' }}>
                      <Icon name="search" style={{ position: 'absolute', left: 9, top: 9, color: 'var(--muted)' }} />
                      <input className="input" style={{ height: 30, paddingLeft: 30, width: 200 }} placeholder="Search clients" aria-label="Search clients" value={query} onChange={(e) => setQuery(e.target.value)} />
                    </div>
                    <span className="hint"><span>{count}</span> shown</span>
                    <OpenButton className="btn btn-primary" target="dlg-client" data-od-id="add-client-btn"><Icon name="plus" />Add client</OpenButton>
                  </div>
                </div>
                <table className="table" style={{ marginTop: 10 }}>
                  <thead><tr><th>Client</th><th>Primary contact</th><th className="num">Projects</th><th className="num">Jobs · 30d</th><th className="num">Spend · 30d</th><th>Status</th><th style={{ width: 76 }} /></tr></thead>
                  <tbody>
                    {filtered.map((c) => (
                      <tr key={c.id} className="cl-row" data-od-id={`client-${c.id}`}>
                        <td><div className="row" style={{ gap: 10 }}><span className={`swatch${c.alt ? ' alt' : ''}`}>{c.initials}</span><div><div style={{ fontWeight: 560 }}>{c.name}</div><div className="hint" style={{ fontSize: '11.5px' }}>{c.industry}</div></div></div></td>
                        <td>{c.contact ? <div>{c.contact}<div className="hint" style={{ fontSize: '11.5px' }}>{c.email}</div></div> : <div className="hint">No contact yet</div>}</td>
                        <td className={`num${c.projects === 0 ? ' muted' : ''}`}>{c.projects}</td>
                        <td className={`num${c.jobs === 0 ? ' muted' : ''}`}>{c.jobs}</td>
                        <td className={`num${c.spend === '₹0' ? ' muted' : ''}`}>{c.spend}</td>
                        <td>{statusBadge(c.status)}</td>
                        <td><div className="row" style={{ gap: 2 }}>
                          <button type="button" className="icon-btn" aria-label="Edit client" onClick={() => openClient(c)}><Icon name="edit" /></button>
                          <button type="button" className="icon-btn" aria-label="Delete client" onClick={() => { setDeleteTarget(c); open('dlg-confirm'); }}><Icon name="trash" /></button>
                        </div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filtered.length === 0 && (
                  <div className="empty" data-od-id="clients-empty">
                    <div style={{ marginBottom: 8 }}><Icon name="filter" className="i-lg" /></div>
                    No clients match this search.
                  </div>
                )}
              </div>
            ),
            workspace: (
              <div className="grid-2">
                <div className="card card-b" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div><div className="label">Workspace name</div><input className="input" defaultValue="Skyline workspace" aria-label="Workspace name" /></div>
                  <div><div className="label">Default region</div><select className="input" aria-label="Default region"><option>asia-south1 (Mumbai)</option><option>us-central1</option><option>eu-west1</option></select></div>
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <div><div className="label">PII redaction by default</div><div className="hint">Applied to every new upload unless overridden.</div></div>
                    <Switch checked={piiDefault} onChange={setPiiDefault} />
                  </div>
                  <button type="button" className="btn btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => toast('Workspace defaults saved', 'check')}>Save defaults</button>
                </div>
                <div className="card card-b" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="label">Cost tagging</div>
                  <div className="mini-kv"><span className="k">Require client on every job</span><Switch checked={costClient} onChange={setCostClient} /></div>
                  <div className="mini-kv"><span className="k">Tag build minutes to the project client</span><Switch checked={costTag} onChange={setCostTag} /></div>
                  <div className="mini-kv"><span className="k">Block runs with no client set</span><Switch checked={costBlock} onChange={setCostBlock} /></div>
                  <div className="hint">Tags flow into Cost &amp; budgets and into the jobs table, so a client can be filtered and recharged.</div>
                </div>
              </div>
            ),
            cost: (
              <div className="card card-b">
                <div className="card-h" style={{ padding: '0 0 12px' }}><h3>Spend by client · last 30 days</h3></div>
                <div>
                  {SPEND.map((s, i) => (
                    <div key={s.name} className="mini-kv" style={{ marginBottom: i < SPEND.length - 1 ? 10 : 0 }}>
                      <span className="k" style={{ width: 150 }}>{s.name}</span>
                      <div className="track" style={{ flex: 1 }}><div className="fill" style={{ width: `${s.pct}%` }} /></div>
                      <span className="tabular" style={{ width: 70, textAlign: 'right' }}>{s.amount}</span>
                    </div>
                  ))}
                </div>
                <p className="hint" style={{ marginTop: 12 }}>Bar width is proportional to spend; the maximum is ₹6.4L (Skyline Broadband). Real billing figures sync from the metering service.</p>
              </div>
            ),
          }}
        />
      </div>

      <Dialog id="dlg-client" data-od-id="client-dialog">
        <div className="dialog-h">
          <h2>{editing ? `Edit ${editing.name}` : 'Add client'}</h2>
          <p className="hint">A client is who the work is billed to. Teams pick it when they create a job, so cost reporting can be sliced per client.</p>
        </div>
        <div className="dialog-b">
          <div className="field"><label className="label" htmlFor="c-name">Client name</label><input className="input" id="c-name" placeholder="e.g. Northwind Retail" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="field"><label className="label" htmlFor="c-contact">Primary contact email</label><input className="input" id="c-contact" type="email" placeholder="name@company.com" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} /></div>
          <div className="field"><label className="label" htmlFor="c-industry">Industry</label><input className="input" id="c-industry" placeholder="e.g. Telecom / ISP" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} /></div>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <div><div className="label">Active</div><div className="hint">Inactive clients can&apos;t be picked on new jobs.</div></div>
            <Switch checked={form.active} onChange={(v) => setForm({ ...form, active: v })} />
          </div>
        </div>
        <div className="dialog-f">
          <CloseButton className="btn">Cancel</CloseButton>
          <button type="button" className="btn btn-primary" data-od-id="client-save" onClick={saveClient}>Save client</button>
        </div>
      </Dialog>

      <Dialog id="dlg-confirm" data-od-id="confirm-dialog">
        <div className="dialog-h">
          <h2>Delete {deleteTarget?.name}?</h2>
          <p className="hint">Jobs already run stay in the workspace and keep their cost history, but new jobs can no longer be tagged to this client unless it is re-added.</p>
        </div>
        <div className="dialog-f">
          <CloseButton className="btn">Cancel</CloseButton>
          <button type="button" className="btn" style={{ color: 'var(--danger-fg)', borderColor: 'oklch(87% 0.05 27)', background: 'var(--danger-soft)' }} onClick={confirmDelete}>Delete client</button>
        </div>
      </Dialog>
    </AppShell>
  );
}
