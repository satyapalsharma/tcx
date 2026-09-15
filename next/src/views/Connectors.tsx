'use client';

import { useState } from 'react';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { CloseButton, Drawer, OpenButton, useOverlay } from '../components/Overlay';
import { useTextFilter } from '../components/ui';
import { useToast } from '../components/Toast';
import { useReveal } from '../hooks/useReveal';

type Conn = {
  id: string;
  name: string;
  kind: string;
  mark: string;
  alt?: boolean;
  badge: string;
  badgeText: string;
  desc: string;
  kvs: [string, string][];
};

const CONNECTORS: Conn[] = [
  { id: 's3', name: 'Amazon S3', kind: 'Storage · bulk ingest', mark: 'S3', badge: 'badge-ok', badgeText: 'Live', desc: 'Transcript and media bucket for the weekly ingest wave.', kvs: [['Bucket', 'tx-skyline-exports'], ['Objects', '18,442 files'], ['Last sync', '12 min ago']] },
  { id: 'genesys', name: 'Genesys Cloud', kind: 'Voice · recordings API', mark: 'G', badge: 'badge-ok', badgeText: 'Live', desc: 'Call recordings and transcripts via the recording API.', kvs: [['Region', 'mypurecloud.in'], ['Queue coverage', '14 of 16'], ['Last sync', '12 min ago']] },
  { id: 'salesforce', name: 'Salesforce', kind: 'CRM · cases & contacts', mark: 'SF', badge: 'badge-warn', badgeText: 'Re-auth', desc: 'Case notes, call logs and contact objects with field mapping.', kvs: [['Instance', 'skyline-bb.my.salesforce.com'], ['Objects', 'Case · Contact · Task'], ['Token', 'expired 3 days ago']] },
  { id: 'zendesk', name: 'Zendesk', kind: 'Support · tickets API', mark: 'Z', badge: 'badge-ok', badgeText: 'Live', desc: 'Tickets and conversations — the email-side wave.', kvs: [['Subdomain', 'skyline.zendesk.com'], ['Threads', '9,205 threads'], ['Last sync', '38 min ago']] },
  { id: 'hubspot', name: 'HubSpot', kind: 'CRM · marketing side', mark: 'HS', alt: true, badge: 'badge', badgeText: 'Not connected', desc: 'Churn-trigger workflows from the marketing-side CRM.', kvs: [['Objects', 'Ticket · Contact'], ['Direction', 'Bidirectional']] },
  { id: 'nice', name: 'NICE CXone', kind: 'Voice · inContact', mark: 'in', alt: true, badge: 'badge', badgeText: 'Not connected', desc: 'Voice + digital recordings with routing metadata.', kvs: [['Channels', 'Voice · Chat · Email']] },
];

function connMark(name: string) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function Connectors() {
  useReveal();
  const toast = useToast();
  const { open, close } = useOverlay();
  const { query, setQuery, filtered, count } = useTextFilter(CONNECTORS, (c) => `${c.name} ${c.kind} ${c.desc}`);
  const [selected, setSelected] = useState<Conn>(CONNECTORS[0]);
  const [ncProvider, setNcProvider] = useState('Generic webhook');
  const [ncSync, setNcSync] = useState('Hourly');
  const [authMode, setAuthMode] = useState('IAM role (recommended)');

  const openConn = (c: Conn) => {
    setSelected(c);
    open('dw-conn');
  };

  const kvValue = (k: string, v: string) => {
    const mono = k === 'Bucket' || k === 'Instance' || k === 'Subdomain';
    const warn = v.includes('expired');
    return (
      <span className={mono ? 'mono' : ''} style={{ fontSize: mono ? '11.5px' : undefined, color: warn ? 'var(--warn-fg)' : undefined, fontWeight: warn ? 560 : undefined }}>
        {v}
      </span>
    );
  };

  return (
    <AppShell crumb="Connectors" badge={<span className="badge badge-warn"><span className="dot" />1 needs re-auth</span>}>
      <div className="page" data-od-id="connectors-page">
        <div className="page-h">
          <div style={{ flex: 1 }}>
            <h1 data-od-id="page-title">Connectors</h1>
            <p className="sub">Point Transform.cx at the places your customer interactions already live. Syncs run hourly; credentials sit in the workspace vault, never inside pipeline runs.</p>
          </div>
          <button type="button" className="btn" onClick={() => toast('Connector SDK docs (stub for demo)', 'ext')}><Icon name="ext" />SDK docs</button>
          <OpenButton className="btn btn-primary" target="dw-newconn" data-od-id="add-connector-btn"><Icon name="plus" />Add connector</OpenButton>
        </div>
        <div className="row" style={{ gap: 8, marginBottom: 14 }} data-od-id="conn-filters">
          <input className="input" style={{ width: 280 }} placeholder="Search connectors" aria-label="Search connectors" value={query} onChange={(e) => setQuery(e.target.value)} />
          <span style={{ flex: 1 }} />
          <span className="hint"><span>{query.trim() ? count : count + 1}</span> shown</span>
        </div>
        <div className="conn-grid" data-od-id="conn-grid">
          {filtered.map((c) => (
            <div key={c.id} className="card conn-card" data-od-id={`conn-${c.id}`} onClick={() => openConn(c)}>
              <div className="row" style={{ gap: 9 }}>
                <span className={`mark${c.alt ? ' alt' : ''}`}>{c.mark}</span>
                <strong style={{ fontSize: 13 }}>{c.name}</strong>
                <span className={`badge ${c.badge}`} style={{ marginLeft: 'auto' }}><span className="dot" />{c.badgeText}</span>
              </div>
              <span className="muted" style={{ fontSize: 12 }}>{c.desc}</span>
              {c.kvs.map(([k, v]) => <div key={k} className="kv"><span>{k}</span>{kvValue(k, v)}</div>)}
            </div>
          ))}
          <OpenButton className="card conn-card" target="dw-newconn" data-od-id="conn-new-tile" style={{ borderStyle: 'dashed', cursor: 'pointer' }}>
            <span className="mark alt"><Icon name="plus" style={{ width: 14, height: 14 }} /></span>
            <strong style={{ fontSize: 13 }}>New connector</strong>
            <span className="muted" style={{ fontSize: 12 }}>Freshdesk · Intercom · Dialpad · generic webhook</span>
          </OpenButton>
        </div>
        {filtered.length === 0 && (
          <div className="empty" data-od-id="conn-empty">
            <div style={{ marginBottom: 8 }}><Icon name="filter" className="i-lg" /></div>
            No connectors match this search.
          </div>
        )}
      </div>

      <Drawer id="dw-conn" data-od-id="conn-drawer">
        <div className="drawer-h">
          <div className="row" style={{ gap: 10, minWidth: 0, flex: 1 }}>
            <span style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--fg)', color: 'var(--surface)', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 680 }}>{connMark(selected.name)}</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 620, letterSpacing: '-0.01em' }}>{selected.name}</div>
              <div className="hint" style={{ marginTop: 1 }}>{selected.kind}</div>
            </div>
          </div>
          <span className={`badge ${selected.badge}`}><span className="dot" />{selected.badgeText}</span>
          <CloseButton className="icon-btn" title="Close"><Icon name="x" /></CloseButton>
        </div>
        <div className="drawer-b" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div className="caps" style={{ marginBottom: 8 }}>Sync health</div>
            <div className="row" style={{ gap: 10, fontSize: '12.5px' }}>
              <span>Last sync: <strong>12 min ago</strong></span>
              <span className="muted">·</span>
              <span>Next: <strong>in 48 min</strong></span>
              <span style={{ flex: 1 }} />
              <button type="button" className="btn btn-sm" onClick={() => toast('Sync requested — queue position 2', 'sync')}><Icon name="sync" />Sync now</button>
            </div>
            <div className="meter" style={{ marginTop: 8 }}><div className="track"><div className="fill fill-ok" style={{ width: '100%' }} /></div></div>
          </div>
          <div className="divider" />
          <div className="grid-2">
            <div className="field"><label className="label" htmlFor="dw-field-name">Name</label><input className="input" id="dw-field-name" defaultValue="Skyline exports bucket" /></div>
            <div className="field"><label className="label" htmlFor="dw-region">Region</label>
              <select className="input" id="dw-region"><option>ap-south-1 (Mumbai)</option><option>us-east-1</option><option>eu-central-1</option></select>
            </div>
          </div>
          <div className="field">
            <label className="label" htmlFor="dw-prefix">Prefix filter</label>
            <input className="input mono" id="dw-prefix" style={{ fontSize: 12 }} defaultValue="transcripts/wk*/" />
            <span className="hint">Only objects under this prefix join the pipeline.</span>
          </div>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <div><div className="label">PII redaction on ingest</div><div className="hint">Masks numbers and IDs before embedding.</div></div>
            <SwitchStub checked />
          </div>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <div><div className="label">Live source</div><div className="hint">Off = frozen snapshot from last sync.</div></div>
            <SwitchStub checked />
          </div>
          <details className="adv">
            <summary><Icon name="key" /><span>Credentials</span><Icon name="chev" className="chev" /></summary>
            <div className="adv-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="field">
                <span className="label">Access mode</span>
                <div className="row" style={{ gap: 6 }}>
                  {['IAM role (recommended)', 'Access key pair'].map((m) => (
                    <button key={m} type="button" className="chip" aria-pressed={authMode === m} onClick={() => setAuthMode(m)}>{m}</button>
                  ))}
                </div>
              </div>
              <div className="field"><label className="label" htmlFor="dw-arn">Role ARN</label><input className="input mono" id="dw-arn" style={{ fontSize: 12 }} defaultValue="arn:aws:iam::4132xxxx:role/tx-s3-read" /></div>
              <p className="hint">Keys live in the workspace vault with audit logging on every use. Rotate pairs every 90 days.</p>
            </div>
          </details>
        </div>
        <div className="drawer-f">
          <button type="button" className="btn btn-sm" style={{ marginRight: 'auto' }} onClick={() => toast('Test OK — 3 sample objects readable', 'check')}>Test connection</button>
          <CloseButton className="btn">Cancel</CloseButton>
          <button type="button" className="btn btn-primary" data-od-id="conn-save" onClick={() => { close(); toast('Connector settings saved', 'check'); }}>Save changes</button>
        </div>
      </Drawer>

      <Drawer id="dw-newconn" data-od-id="new-connector-drawer">
        <div className="drawer-h">
          <div style={{ flex: 1 }}><div style={{ fontSize: 15, fontWeight: 620, letterSpacing: '-0.01em' }}>New connector</div><div className="hint">Pick a provider, then authenticate. Takes about 2 minutes.</div></div>
          <CloseButton className="icon-btn" title="Close"><Icon name="x" /></CloseButton>
        </div>
        <div className="drawer-b" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="field">
            <span className="label">1 · Provider</span>
            <div className="row" style={{ gap: 6, flexWrap: 'wrap' }} data-od-id="nc-providers">
              {['Generic webhook', 'Freshdesk', 'Intercom', 'Dialpad'].map((p) => (
                <button key={p} type="button" className="chip" aria-pressed={ncProvider === p} onClick={() => setNcProvider(p)}>{p}</button>
              ))}
            </div>
          </div>
          <div className="field">
            <span className="label">2 · Auth</span>
            <div className="field" style={{ marginBottom: 8 }}><label className="label" htmlFor="nc-name">Display name</label><input className="input" id="nc-name" placeholder="e.g. WhatsApp support exports" /></div>
            <div className="field"><label className="label" htmlFor="nc-token">Auth token / API key</label><input className="input" id="nc-token" placeholder="Stored in vault — never shown again" /></div>
          </div>
          <div className="field">
            <span className="label">3 · Default sync</span>
            <div className="row" style={{ gap: 6 }}>
              {['Hourly', 'Every 15 min', 'Manual'].map((s) => (
                <button key={s} type="button" className="chip" aria-pressed={ncSync === s} onClick={() => setNcSync(s)}>{s}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="drawer-f">
          <CloseButton className="btn">Cancel</CloseButton>
          <button type="button" className="btn btn-primary" onClick={() => { close(); toast('Connection wizard launched — check email for verification link', 'plug'); }}>Connect</button>
        </div>
      </Drawer>
    </AppShell>
  );
}

function SwitchStub({ checked }: { checked: boolean }) {
  return <span className="switch" role="switch" aria-checked={checked} />;
}
