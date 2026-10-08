'use client';

import { useState } from 'react';
import { AppShell } from '../components/AppShell';
import { Icon, type IconName } from '../components/Icon';
import { useToast } from '../components/Toast';
import { useReveal } from '../hooks/useReveal';
import { PageHeader } from '@/components/common';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/context/AppContext';

interface ConnectorItem {
  id: string;
  name: string;
  category: string;
  type: 'realtime' | 'batch';
  status: 'active' | 'syncing' | 'ready';
  description: string;
  stats: string;
  icon: IconName;
}

const CONNECTORS: ConnectorItem[] = [
  {
    id: 'c-genesys',
    name: 'Genesys Cloud CX',
    category: 'Telephony & Contact Center',
    type: 'realtime',
    status: 'active',
    description: 'Real-time dual-channel audio stream & agent transcript ingestion via Event Bridge.',
    stats: '42 calls/min · Websocket stream active',
    icon: 'plug',
  },
  {
    id: 'c-nice',
    name: 'NICE CXone',
    category: 'Telephony & Contact Center',
    type: 'realtime',
    status: 'ready',
    description: 'Continuous event streaming from telephony queues with caller metadata and IVR tokens.',
    stats: 'Ready to connect · OAuth 2.0 configured',
    icon: 'bolt',
  },
  {
    id: 'c-s3',
    name: 'Amazon S3 Audio Vault',
    category: 'Cloud Object Storage',
    type: 'batch',
    status: 'active',
    description: 'Bulk ingestion of WAV/MP3 recordings and raw transcript JSON archives.',
    stats: '18,442 objects synced · Hourly sync',
    icon: 'cloud',
  },
  {
    id: 'c-salesforce',
    name: 'Salesforce Service Cloud',
    category: 'CRM & Omnichannel',
    type: 'batch',
    status: 'syncing',
    description: 'Customer profiles, historical case logs, and billing dispute history synchronization.',
    stats: 'Syncing 3,410 cases · 84% completed',
    icon: 'users',
  },
  {
    id: 'c-zendesk',
    name: 'Zendesk Support',
    category: 'Ticketing & Messaging',
    type: 'batch',
    status: 'active',
    description: 'Customer email threads, chat transcripts, and macro categorization logs.',
    stats: '9,205 tickets indexed · Synced 38m ago',
    icon: 'mail',
  },
  {
    id: 'c-hubspot',
    name: 'HubSpot CRM',
    category: 'Sales & Marketing',
    type: 'batch',
    status: 'ready',
    description: 'Campaign promotional offer history and churn prevention retention records.',
    stats: 'Ready to configure · API key required',
    icon: 'grid',
  },
];

export default function Connectors() {
  useReveal();
  const toast = useToast();
  const { currentOrg, openNewRun } = useApp();
  const [filter, setFilter] = useState<'all' | 'realtime' | 'batch'>('all');

  const filtered = CONNECTORS.filter((c) => filter === 'all' || c.type === filter);

  const toggleConnect = (name: string) => {
    toast(`Connector updated for ${name}`, 'check');
  };

  return (
    <AppShell crumb="Integrations">
      <main className="p-4 sm:p-6 lg:p-8 max-w-[1240px] mx-auto w-full pb-20 space-y-6" data-od-id="connectors-page">
        <PageHeader
          title="Connectors & Ingestion Sources"
          description={`Organization: ${currentOrg.name} · Plug real-time conversational streams (Genesys, NICE) or connect enterprise storage & CRMs for continuous intent discovery.`}
          dataOdId="page-title"
          actions={
            <Button
              type="button"
              variant="accent"
              className="gap-1.5 h-9 text-xs sm:text-sm font-medium"
              onClick={() => openNewRun('extract_intents')}
            >
              <Icon name="search" className="w-3.5 h-3.5" />
              New Intent Analysis
            </Button>
          }
        />

        {/* Real-time Intent Stream Announcement Card */}
        <Card className="bg-surface border border-accent-border/50 p-4 sm:p-5 rounded-xl shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="w-10 h-10 rounded-xl bg-accent-soft grid place-items-center shrink-0">
                <Icon name="bolt" className="w-5 h-5 text-accent-strong" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">Real-Time Streaming Intent Discovery</h3>
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 bg-emerald-500/10 text-[10px]">
                    Live Ingestion Active
                  </Badge>
                </div>
                <p className="text-xs text-muted mt-1 leading-relaxed max-w-2xl">
                  Connect telephony streams directly via WebSockets or Webhooks. Transform.CX continuously extracts caller intents, hold patterns, and friction drivers as calls happen in production.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={() => toast('Websocket streaming endpoint: wss://ingest.transform.cx/v1/telephony', 'copy')}
              >
                <Icon name="copy" className="w-3 h-3" />
                Copy Stream URL
              </Button>
            </div>
          </div>
        </Card>

        {/* Type Filter Buttons */}
        <div className="flex items-center justify-between gap-3 pt-2 overflow-x-auto pb-1 max-w-full">
          <div className="flex shrink-0 rounded-lg border border-border bg-surface-inset/50 p-1">
            <Button
              type="button"
              variant={filter === 'all' ? 'secondary' : 'ghost'}
              size="sm"
              className={`h-7 px-3 text-xs font-medium ${filter === 'all' ? 'bg-surface shadow-xs text-foreground' : 'text-muted'}`}
              onClick={() => setFilter('all')}
            >
              All Connectors ({CONNECTORS.length})
            </Button>
            <Button
              type="button"
              variant={filter === 'realtime' ? 'secondary' : 'ghost'}
              size="sm"
              className={`h-7 px-3 text-xs font-medium ${filter === 'realtime' ? 'bg-surface shadow-xs text-foreground' : 'text-muted'}`}
              onClick={() => setFilter('realtime')}
            >
              <Icon name="bolt" className="w-3 h-3 mr-1 text-accent-strong" />
              Real-time Telephony Streams (2)
            </Button>
            <Button
              type="button"
              variant={filter === 'batch' ? 'secondary' : 'ghost'}
              size="sm"
              className={`h-7 px-3 text-xs font-medium ${filter === 'batch' ? 'bg-surface shadow-xs text-foreground' : 'text-muted'}`}
              onClick={() => setFilter('batch')}
            >
              <Icon name="cloud" className="w-3 h-3 mr-1 text-muted" />
              Batch Repositories &amp; CRM (4)
            </Button>
          </div>

          <span className="text-xs text-muted hidden sm:inline">Encrypted with customer-managed keys (KMS)</span>
        </div>

        {/* Connectors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <Card key={item.id} className="p-4 bg-surface border border-border rounded-xl shadow-xs space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 pb-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-lg bg-surface-inset grid place-items-center shrink-0 border border-border">
                      <Icon name={item.icon} className="w-4 h-4 text-foreground" />
                    </span>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">{item.name}</h4>
                      <p className="text-[11px] text-muted">{item.category}</p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[10px] uppercase font-mono py-0 px-1.5 ${
                      item.type === 'realtime'
                        ? 'border-accent-border text-accent-strong bg-accent-soft/30'
                        : 'border-border text-muted bg-surface-inset'
                    }`}
                  >
                    {item.type}
                  </Badge>
                </div>

                <p className="text-xs text-muted leading-relaxed mt-2">{item.description}</p>
              </div>

              <div className="pt-3 border-t border-border/80 flex items-center justify-between text-xs">
                <span className="text-[11px] text-muted font-mono truncate max-w-[190px]">{item.stats}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs font-medium"
                  onClick={() => toggleConnect(item.name)}
                >
                  {item.status === 'active' ? 'Configure' : item.status === 'syncing' ? 'View Sync' : 'Connect'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </main>
    </AppShell>
  );
}
