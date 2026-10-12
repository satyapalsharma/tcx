'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { AppShell } from '../components/AppShell';
import { Icon, type IconName } from '../components/Icon';
import { PageHeader } from '@/components/common';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { usePipeline } from '@/context/PipelineContext';

const PROVIDERS: { name: string; category: string; description: string; icon: IconName }[] = [
  { name: 'Amazon S3', category: 'Cloud storage', description: 'Recording archives and transcript files.', icon: 'cloud' },
  { name: 'Salesforce', category: 'CRM', description: 'Cases and customer service records.', icon: 'users' },
  { name: 'HubSpot', category: 'CRM', description: 'Customer records and support history.', icon: 'grid' },
  { name: 'Genesys Cloud', category: 'Contact center', description: 'Conversation and interaction data.', icon: 'plug' },
  { name: 'NICE CXone', category: 'Contact center', description: 'Contact center conversations and records.', icon: 'bolt' },
];

export default function Connectors() {
  const { connections, connectProvider, disconnectProvider } = usePipeline();
  const [selected, setSelected] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [removeId, setRemoveId] = useState<string | null>(null);
  const selectedProvider = PROVIDERS.find((provider) => provider.name === selected);
  const selectedConnection = useMemo(() => connections.find((connection) => connection.id === removeId), [connections, removeId]);

  const beginConnect = (provider: string) => { setSelected(provider); setName(''); };
  const saveConnection = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selected || !name.trim()) return;
    connectProvider(selected, name.trim());
    setSelected(null);
  };

  return (
    <AppShell crumb="Connections">
      <main className="p-5 sm:p-8 max-w-[1280px] mx-auto w-full pb-16 space-y-7" data-od-id="connectors-page">
        <PageHeader title="Connections" description="Add a demo source to make it available when starting analysis." dataOdId="page-title" />
        <div className="rounded-xl border border-accent-border/60 bg-accent-soft/50 px-4 py-3 text-sm text-foreground">
          <span className="font-medium">Local demo connections</span><span className="text-muted"> · No credentials are collected and no external service is contacted.</span>
        </div>

        <section aria-labelledby="available-heading" className="space-y-3">
          <div><h2 id="available-heading" className="text-base font-semibold">Available sources</h2><p className="mt-1 text-sm text-muted">Choose a source and give this demo connection a name.</p></div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {PROVIDERS.map((provider) => {
              const linked = connections.some((connection) => connection.provider === provider.name);
              return <Card key={provider.name} className="flex flex-col justify-between gap-5 p-4">
                <div className="flex gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent-strong"><Icon name={provider.icon} className="h-5 w-5" /></span><div><h3 className="text-sm font-semibold">{provider.name}</h3><p className="mt-0.5 text-xs text-muted">{provider.category}</p></div></div>
                <p className="text-sm text-muted">{provider.description}</p>
                <Button variant="outline" size="sm" className="self-start" onClick={() => beginConnect(provider.name)}><Icon name="plus" className="mr-1.5 h-3.5 w-3.5" />{linked ? 'Add another' : 'Set up demo connection'}</Button>
              </Card>;
            })}
          </div>
        </section>

        <section aria-labelledby="connected-heading" className="space-y-3">
          <div><h2 id="connected-heading" className="text-base font-semibold">Organization connections <span className="ml-1 text-sm font-normal text-muted">{connections.length}</span></h2><p className="mt-1 text-sm text-muted">Connections are shared across this organization.</p></div>
          {connections.length ? <Card className="divide-y divide-border overflow-hidden p-0">
            {connections.map((connection) => <div key={connection.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5">
              <div className="min-w-0"><div className="flex items-center gap-2"><p className="truncate text-sm font-medium">{connection.name}</p><Badge variant="outline" className="text-[10px]">{connection.status === 'connected' ? 'Demo connected' : 'Needs attention'}</Badge></div><p className="mt-1 text-xs text-muted">{connection.provider} · Added {connection.lastSync}</p></div>
              <Button variant="ghost" size="sm" className="text-muted hover:text-danger-fg" onClick={() => setRemoveId(connection.id)}>Remove</Button>
            </div>)}
          </Card> : <Card className="border-dashed p-7 text-center"><p className="text-sm font-medium">No connections yet</p><p className="mt-1 text-sm text-muted">Set up a demo connection to see it here.</p></Card>}
        </section>
      </main>

      <Dialog open={Boolean(selectedProvider)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Set up {selectedProvider?.name} demo connection</DialogTitle><DialogDescription>This creates a local demo entry only. No credentials or service access are used.</DialogDescription></DialogHeader>
          <form onSubmit={saveConnection} className="space-y-4">
            <div className="space-y-1.5"><Label htmlFor="connection-name">Connection name</Label><Input id="connection-name" value={name} onChange={(event) => setName(event.target.value)} placeholder={`e.g. ${selectedProvider?.name} support archive`} required autoFocus /></div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setSelected(null)}>Cancel</Button><Button type="submit" variant="accent">Add demo connection</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={Boolean(selectedConnection)} onOpenChange={(open) => !open && setRemoveId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Remove connection?</DialogTitle><DialogDescription>{selectedConnection?.name} will be removed from this organization&apos;s demo connections.</DialogDescription></DialogHeader>
          <DialogFooter><Button variant="outline" onClick={() => setRemoveId(null)}>Cancel</Button><Button variant="destructive" onClick={() => { if (selectedConnection) disconnectProvider(selectedConnection.id); setRemoveId(null); }}>Remove connection</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
