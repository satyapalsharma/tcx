'use client';

import { useState } from 'react';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { CloseButton, Drawer, OpenButton, useOverlay } from '../components/Overlay';
import { useTextFilter } from '../components/ui';
import { useToast } from '../components/Toast';
import { useReveal } from '../hooks/useReveal';
import { PageHeader, StatusBadge, EmptyState, SearchToolbar } from '@/components/common';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Toggle } from '@/components/ui/toggle';

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
  { id: 's3', name: 'Amazon S3', kind: 'Storage · bulk ingest', mark: 'S3', badge: 'ok', badgeText: 'Live', desc: 'Transcript and media bucket for the weekly ingest wave.', kvs: [['Bucket', 'tx-skyline-exports'], ['Objects', '18,442 files'], ['Last sync', '12 min ago']] },
  { id: 'genesys', name: 'Genesys Cloud', kind: 'Voice · recordings API', mark: 'G', badge: 'ok', badgeText: 'Live', desc: 'Call recordings and transcripts via the recording API.', kvs: [['Region', 'mypurecloud.in'], ['Queue coverage', '14 of 16'], ['Last sync', '12 min ago']] },
  { id: 'salesforce', name: 'Salesforce', kind: 'CRM · cases & contacts', mark: 'SF', badge: 'warn', badgeText: 'Re-auth', desc: 'Case notes, call logs and contact objects with field mapping.', kvs: [['Instance', 'skyline-bb.my.salesforce.com'], ['Objects', 'Case · Contact · Task'], ['Token', 'expired 3 days ago']] },
  { id: 'zendesk', name: 'Zendesk', kind: 'Support · tickets API', mark: 'Z', badge: 'ok', badgeText: 'Live', desc: 'Tickets and conversations — the email-side wave.', kvs: [['Subdomain', 'skyline.zendesk.com'], ['Threads', '9,205 threads'], ['Last sync', '38 min ago']] },
  { id: 'hubspot', name: 'HubSpot', kind: 'CRM · marketing side', mark: 'HS', alt: true, badge: 'muted', badgeText: 'Not connected', desc: 'Churn-trigger workflows from the marketing-side CRM.', kvs: [['Objects', 'Ticket · Contact'], ['Direction', 'Bidirectional']] },
  { id: 'nice', name: 'NICE CXone', kind: 'Voice · inContact', mark: 'in', alt: true, badge: 'muted', badgeText: 'Not connected', desc: 'Voice + digital recordings with routing metadata.', kvs: [['Channels', 'Voice · Chat · Email']] },
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
  const [piiRedaction, setPiiRedaction] = useState(true);
  const [liveSource, setLiveSource] = useState(true);

  const openConn = (c: Conn) => {
    setSelected(c);
    open('dw-conn');
  };

  const kvValue = (k: string, v: string) => {
    const mono = k === 'Bucket' || k === 'Instance' || k === 'Subdomain';
    const warn = v.includes('expired');
    return (
      <span className={`${mono ? 'font-mono text-[11.5px]' : 'text-xs'} ${warn ? 'text-warn-fg font-semibold' : 'text-foreground'} truncate text-right min-w-0`} title={v}>
        {v}
      </span>
    );
  };

  const getStatusType = (badge: string) => {
    if (badge === 'ok' || badge === 'badge-ok') return 'ok';
    if (badge === 'warn' || badge === 'badge-warn') return 'warn';
    return 'neutral';
  };

  return (
    <AppShell
      crumb="Connectors"
      badge={
        <StatusBadge status="warn" pulse className="mr-2">
          1 needs re-auth
        </StatusBadge>
      }
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6" data-od-id="connectors-page">
        <PageHeader
          title="Connectors"
          description="Point Transform.cx at the places your customer interactions already live. Syncs run hourly; credentials sit in the workspace vault, never inside pipeline runs."
          dataOdId="page-title"
          className="pb-4 border-b border-border mb-0"
          actions={
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs sm:text-sm"
                onClick={() => toast('Connector SDK docs (stub for demo)', 'ext')}
              >
                <Icon name="ext" />SDK docs
              </Button>
              <OpenButton
                variant="accent"
                size="sm"
                className="gap-1.5 text-xs sm:text-sm"
                target="dw-newconn"
                data-od-id="add-connector-btn"
              >
                <Icon name="plus" />Add connector
              </OpenButton>
            </>
          }
        />

        <div className="flex items-center gap-2 pb-1" data-od-id="conn-filters">
          <SearchToolbar
            query={query}
            onQueryChange={setQuery}
            placeholder="Search connectors"
            count={query.trim() ? count : count + 1}
            countLabel="shown"
            className="w-full"
            inputClassName="w-64 sm:w-72"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5" data-od-id="conn-grid">
          {filtered.map((c) => (
            <Card
              key={c.id}
              className="group bg-surface border border-border rounded-xl p-4 flex flex-col gap-3 cursor-pointer hover:border-border-strong hover:bg-surface-hover/30 transition-all text-left shadow-xs"
              data-od-id={`conn-${c.id}`}
              onClick={() => openConn(c)}
            >
              <div className="flex items-center gap-2.5">
                <span className={`w-7 h-7 rounded-md text-xs font-bold flex items-center justify-center shrink-0 ${c.alt ? 'bg-surface-inset text-foreground border border-border' : 'bg-foreground text-surface'}`}>
                  {c.mark}
                </span>
                <strong className="text-[13px] font-semibold text-foreground truncate">{c.name}</strong>
                <StatusBadge status={getStatusType(c.badge)} className="ml-auto shrink-0">
                  {c.badgeText}
                </StatusBadge>
              </div>
              <span className="text-xs text-muted leading-relaxed line-clamp-2">{c.desc}</span>
              <div className="flex flex-col gap-1 pt-2 border-t border-border/60 mt-auto">
                {c.kvs.map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between gap-2 text-xs py-0.5 min-w-0">
                    <span className="text-muted shrink-0">{k}</span>
                    {kvValue(k, v)}
                  </div>
                ))}
              </div>
            </Card>
          ))}

          <OpenButton
            className="bg-surface/50 border border-dashed border-border hover:border-accent hover:bg-accent-soft/30 rounded-xl p-4 flex flex-col items-start gap-2.5 cursor-pointer transition-all text-left group"
            target="dw-newconn"
            data-od-id="conn-new-tile"
          >
            <span className="w-7 h-7 rounded-md bg-surface-inset group-hover:bg-accent-soft group-hover:text-accent-strong border border-border text-muted text-xs font-bold flex items-center justify-center shrink-0 transition-colors">
              <Icon name="plus" style={{ width: 14, height: 14 }} />
            </span>
            <strong className="text-[13px] font-semibold text-foreground group-hover:text-accent-strong transition-colors">New connector</strong>
            <span className="text-xs text-muted">Freshdesk · Intercom · Dialpad · generic webhook</span>
          </OpenButton>
        </div>

        {filtered.length === 0 && (
          <EmptyState
            icon="filter"
            title="No connectors match this search."
            dataOdId="conn-empty"
          />
        )}
      </div>

      <Drawer id="dw-conn" data-od-id="conn-drawer">
        <div className="flex items-center justify-between gap-3 p-4 sm:p-5 border-b border-border">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <span className="w-8 h-8 rounded-lg bg-foreground text-surface grid place-items-center text-xs font-bold shrink-0">{connMark(selected.name)}</span>
            <div>
              <div className="text-sm sm:text-base font-semibold text-foreground tracking-tight">{selected.name}</div>
              <div className="text-xs text-muted mt-0.5">{selected.kind}</div>
            </div>
          </div>
          <StatusBadge status={getStatusType(selected.badge)} className="shrink-0">
            {selected.badgeText}
          </StatusBadge>
          <CloseButton variant="ghost" size="icon-xs" className="w-8 h-8 text-muted hover:text-foreground" title="Close">
            <Icon name="x" />
          </CloseButton>
        </div>

        <div className="p-4 sm:p-5 flex flex-col gap-4 overflow-y-auto max-h-[calc(100vh-140px)]">
          <div>
            <div className="text-[11px] font-semibold tracking-wider uppercase text-muted mb-2">Sync health</div>
            <div className="flex flex-wrap items-center gap-2.5 text-xs text-muted">
              <span>Last sync: <strong className="text-foreground font-semibold">12 min ago</strong></span>
              <span className="text-muted/60">·</span>
              <span>Next: <strong className="text-foreground font-semibold">in 48 min</strong></span>
              <span className="flex-1" />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 h-7 px-2.5 text-xs"
                onClick={() => toast('Sync requested — queue position 2', 'sync')}
              >
                <Icon name="sync" />Sync now
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between py-1">
            <div>
              <div className="text-xs font-semibold text-foreground">PII redaction on ingest</div>
              <div className="text-[11.5px] text-muted">Masks numbers and IDs before embedding.</div>
            </div>
            <Switch checked={piiRedaction} onCheckedChange={setPiiRedaction} aria-label="PII redaction" />
          </div>

          <div className="flex items-center justify-between py-1">
            <div>
              <div className="text-xs font-semibold text-foreground">Live source</div>
              <div className="text-[11.5px] text-muted">Off = frozen snapshot from last sync.</div>
            </div>
            <Switch checked={liveSource} onCheckedChange={setLiveSource} aria-label="Live source" />
          </div>

          <details className="group border border-border rounded-lg p-3 bg-surface-inset/40 text-xs">
            <summary className="flex items-center justify-between font-medium text-foreground cursor-pointer select-none">
              <span className="flex items-center gap-2"><Icon name="key" /><span>Credentials</span></span>
              <Icon name="chev" className="transition-transform group-open:rotate-180" />
            </summary>
            <div className="flex flex-col gap-3 pt-3 mt-2 border-t border-border/60">
              <div>
                <span className="block text-xs font-semibold text-foreground mb-1.5">Access mode</span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {['IAM role (recommended)', 'Access key pair'].map((m) => (
                    <Toggle
                      key={m}
                      pressed={authMode === m}
                      onPressedChange={() => setAuthMode(m)}
                      variant="outline"
                      size="sm"
                      className="h-6.5 px-2.5 rounded-full text-xs font-medium border border-border data-[state=on]:bg-foreground data-[state=on]:text-surface data-[state=on]:border-foreground cursor-pointer"
                    >
                      {m}
                    </Toggle>
                  ))}
                </div>
              </div>
              <div>
                <Label className="block text-xs font-semibold text-foreground mb-1.5" htmlFor="dw-arn">Role ARN</Label>
                <Input className="w-full h-9 bg-surface font-mono text-xs" id="dw-arn" defaultValue="arn:aws:iam::4132xxxx:role/tx-s3-read" />
              </div>
              <p className="text-[11.5px] text-muted">Keys live in the workspace vault with audit logging on every use. Rotate pairs every 90 days.</p>
            </div>
          </details>
        </div>

        <div className="flex items-center justify-end gap-2 p-4 border-t border-border bg-surface-inset/30">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs mr-auto"
            onClick={() => toast('Test OK — 3 sample objects readable', 'check')}
          >
            Test connection
          </Button>
          <CloseButton variant="outline" size="sm" className="text-xs">
            Cancel
          </CloseButton>
          <Button
            type="button"
            variant="accent"
            size="sm"
            className="text-xs"
            data-od-id="conn-save"
            onClick={() => { close(); toast('Connector settings saved', 'check'); }}
          >
            Save changes
          </Button>
        </div>
      </Drawer>

      <Drawer id="dw-newconn" data-od-id="new-connector-drawer">
        <div className="flex items-center justify-between gap-3 p-4 sm:p-5 border-b border-border">
          <div className="flex-1">
            <div className="text-sm sm:text-base font-semibold text-foreground tracking-tight">New connector</div>
            <div className="text-xs text-muted mt-0.5">Pick a provider, then authenticate. Takes about 2 minutes.</div>
          </div>
          <CloseButton variant="ghost" size="icon-xs" className="w-8 h-8 text-muted hover:text-foreground" title="Close">
            <Icon name="x" />
          </CloseButton>
        </div>

        <div className="p-4 sm:p-5 flex flex-col gap-4 overflow-y-auto max-h-[calc(100vh-140px)]">
          <div>
            <span className="block text-xs font-semibold text-foreground mb-2">1 · Provider</span>
            <div className="flex flex-wrap items-center gap-1.5" data-od-id="nc-providers">
              {['Generic webhook', 'Freshdesk', 'Intercom', 'Dialpad'].map((p) => (
                <Toggle
                  key={p}
                  pressed={ncProvider === p}
                  onPressedChange={() => setNcProvider(p)}
                  variant="outline"
                  size="sm"
                  className="h-6.5 px-2.5 rounded-full text-xs font-medium border border-border data-[state=on]:bg-foreground data-[state=on]:text-surface data-[state=on]:border-foreground cursor-pointer"
                >
                  {p}
                </Toggle>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <span className="block text-xs font-semibold text-foreground">2 · Auth</span>
            <div>
              <Label className="block text-xs font-medium text-foreground mb-1" htmlFor="nc-name">Display name</Label>
              <Input className="w-full h-9 bg-surface text-xs sm:text-sm" id="nc-name" placeholder="e.g. WhatsApp support exports" />
            </div>
            <div>
              <Label className="block text-xs font-medium text-foreground mb-1" htmlFor="nc-token">Auth token / API key</Label>
              <Input className="w-full h-9 bg-surface text-xs sm:text-sm" id="nc-token" placeholder="Stored in vault — never shown again" />
            </div>
          </div>

          <div>
            <span className="block text-xs font-semibold text-foreground mb-2">3 · Default sync</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {['Hourly', 'Every 15 min', 'Manual'].map((s) => (
                <Toggle
                  key={s}
                  pressed={ncSync === s}
                  onPressedChange={() => setNcSync(s)}
                  variant="outline"
                  size="sm"
                  className="h-6.5 px-2.5 rounded-full text-xs font-medium border border-border data-[state=on]:bg-foreground data-[state=on]:text-surface data-[state=on]:border-foreground cursor-pointer"
                >
                  {s}
                </Toggle>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-4 border-t border-border bg-surface-inset/30">
          <CloseButton variant="outline" size="sm" className="text-xs">
            Cancel
          </CloseButton>
          <Button
            type="button"
            variant="accent"
            size="sm"
            className="text-xs"
            onClick={() => { close(); toast('Connection wizard launched — check email for verification link', 'plug'); }}
          >
            Connect
          </Button>
        </div>
      </Drawer>
    </AppShell>
  );
}
