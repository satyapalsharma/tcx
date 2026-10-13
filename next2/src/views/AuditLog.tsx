'use client';

import { useMemo, useState } from 'react';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { PageHeader } from '@/components/common';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/context/AppContext';
import { usePipeline } from '@/context/PipelineContext';

export default function AuditLog() {
  const { currentOrg } = useApp();
  const { events } = usePipeline();
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return [...events]
      .sort((a, b) => b.time - a.time)
      .filter(
        (event) =>
          !query ||
          `${event.actor} ${event.action} ${event.detail}`
            .toLowerCase()
            .includes(query),
      );
  }, [events, search]);

  return (
    <AppShell crumb="Audit log">
      <div
        className="p-5 sm:p-8 max-w-[1280px] mx-auto w-full pb-16 space-y-6"
        data-od-id="audit-page"
      >
        <PageHeader
          title="Audit log"
          description={`Recent activity across ${currentOrg.name}.`}
          dataOdId="page-title"
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold">Organization activity</h2>
            <p className="mt-1 text-sm text-muted">
              Recent demo activity stored in this browser.
            </p>
          </div>
          <label className="relative w-full sm:w-72">
            <Icon
              name="search"
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted"
            />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search activity"
              aria-label="Search activity"
              className="pl-9"
            />
          </label>
        </div>
        {filtered.length ? (
          <Card className="divide-y divide-border overflow-hidden p-0">
            {filtered.map((event) => (
              <article
                key={event.id}
                className="flex items-start gap-3.5 px-4 py-4 sm:px-5"
              >
                <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface-inset">
                  <Icon name="scroll" className="h-4 w-4 text-muted" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground">
                    <span className="font-medium">{event.actor}</span>{' '}
                    {event.action}
                  </p>
                  <p className="mt-1 text-sm text-muted">{event.detail}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <time
                    className="text-xs text-muted"
                    dateTime={new Date(event.time).toISOString()}
                  >
                    {new Intl.DateTimeFormat(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    }).format(event.time)}
                  </time>
                  {event.workspaceId && (
                    <Badge
                      variant="outline"
                      className="max-w-32 truncate text-[10px]"
                    >
                      Project activity
                    </Badge>
                  )}
                </div>
              </article>
            ))}
          </Card>
        ) : (
          <Card className="border-dashed p-8 text-center">
            <span className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-surface-inset">
              <Icon name="scroll" className="h-5 w-5 text-muted" />
            </span>
            <h2 className="mt-3 text-sm font-semibold">
              {events.length ? 'No activity found' : 'No activity yet'}
            </h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted">
              {events.length
                ? `No organization events match “${search}”.`
                : 'Member, project, and pipeline activity will appear here as it happens in the demo.'}
            </p>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
