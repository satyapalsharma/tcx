import { useCallback, useMemo, useState } from 'react';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { useToast } from '../components/Toast';

type AuditEvent = {
  id: string;
  when: string;
  date: string;
  icon: Parameters<typeof Icon>[0]['name'];
  sev?: 'ok' | 'warn' | 'act';
  html: string;
  detail: string;
  actor: string;
};

type AuditRow = AuditEvent | { id: string; type: 'sep'; date: string; label: string };

const INITIAL: AuditRow[] = [
  { id: '1', when: '2 min ago', date: '2026-08-16', icon: 'play', sev: 'act', actor: 'Arjun Shah', html: '<span class="actor">Arjun Shah</span> started <strong>GEN-0143</strong> on <span class="mono" style="font-size:12px">Google ADK</span> from <span class="mono" style="font-size:12px">map v3</span>', detail: 'Develop · build queued behind RUN-4821 · 4 tests incl. supervisor-token edge case' },
  { id: '2', when: '48 min ago', date: '2026-08-16', icon: 'check', sev: 'ok', actor: 'Devika Sharma', html: '<span class="actor">Devika Sharma</span> approved <strong>process map v3</strong> and handed off to Develop', detail: 'Design · Billing Dispute Resolution · UML v3 included in snapshot' },
  { id: '3', when: '1 h ago', date: '2026-08-16', icon: 'mail', actor: 'Devika Sharma', html: '<span class="actor">Devika Sharma</span> requested changes on <strong>Port-out Retention</strong>', detail: 'Design · escalation should trigger after two declined offers, not one' },
  { id: '4', when: '12:41 today', date: '2026-08-16', icon: 'sync', actor: 'System', html: '<span class="actor">System</span> completed <strong>RUN-4819</strong> — intent extraction on wk26 wave', detail: 'Analysis · 18,442 records · 3,214 raw intents, deduped to 286' },
  { id: '5', when: '11:55 today', date: '2026-08-16', icon: 'warn', sev: 'warn', actor: 'System', html: '<span class="actor">System</span> flagged <strong>Salesforce connector</strong> for re-auth', detail: 'Connectors · OAuth refresh token rejected · sync paused since 3 days ago' },
  { id: 'sep1', type: 'sep', date: '2026-08-15', label: 'Yesterday · 15 Aug' },
  { id: '6', when: '18:22', date: '2026-08-15', icon: 'check', sev: 'ok', actor: 'Riya Menon', html: '<span class="actor">Riya Menon</span> approved <strong>4 L1 clusters</strong> and sent to Design', detail: 'Analysis · Billing 38.2% · Connectivity 24.1% · Install 13.8% · Cancel 8.4%' },
  { id: '7', when: '16:03', date: '2026-08-15', icon: 'upload', actor: 'Riya Menon', html: '<span class="actor">Riya Menon</span> uploaded <strong>genesys_Aug_w26.jsonl</strong> to staging', detail: 'Analysis · 4,120 call transcripts · PII redaction on' },
  { id: '8', when: '14:19', date: '2026-08-15', icon: 'bolt', sev: 'act', actor: 'Arjun Shah', html: '<span class="actor">Arjun Shah</span> deployed <strong>ADK-0142</strong> to staging', detail: 'Develop · from map v2 · Cloud Run revision adk-0142 · 4/4 tests' },
  { id: 'sep2', type: 'sep', date: '2026-08-13', label: '13 Aug' },
  { id: '9', when: '17:44', date: '2026-08-13', icon: 'users', actor: 'Priya Nair', html: '<span class="actor">Priya Nair</span> changed <strong>Karan Mehta</strong> role: Viewer → limited Design-view', detail: 'Admin · applies on next sign-in · umbrella chips unchanged' },
  { id: '10', when: '15:30', date: '2026-08-13', icon: 'warn', sev: 'warn', actor: 'System', html: '<span class="actor">System</span> aborted <strong>RUN-4812</strong> after 40 min — embedding quota exhausted', detail: 'Analysis · 12% raw intents extracted before abort · rerun queued wk27' },
  { id: '11', when: '11:12', date: '2026-08-13', icon: 'check', sev: 'ok', actor: 'Devika Sharma', html: '<span class="actor">Devika Sharma</span> approved <strong>New Installation Booking</strong> map v2', detail: 'Design · handed off to Develop as snapshot v2' },
  { id: '12', when: '09:05', date: '2026-08-13', icon: 'key', actor: 'Priya Nair', html: '<span class="actor">Priya Nair</span> rotated <strong>svc-transform-bot</strong> deploy token', detail: 'Admin · old token valid 24 h overlap · audit logged with vault ref vault:tdx-9182' },
];

const OLDER: AuditRow[] = [
  { id: 'sep3', type: 'sep', date: '2026-08-12', label: '12 Aug' },
  { id: '13', when: '16:47', date: '2026-08-12', icon: 'sync', actor: 'System', html: '<span class="actor">System</span> completed <strong>RUN-4811</strong> — cluster re-run on Billing L2', detail: 'Analysis · silhouette 0.41 to 0.46 after merging duplicate payment nodes' },
  { id: '14', when: '14:02', date: '2026-08-12', icon: 'flow', actor: 'Devika Sharma', html: '<span class="actor">Devika Sharma</span> edited <strong>Port-out Retention</strong> map v1', detail: 'Design · added declined-offer loop node before escalation branch' },
  { id: '15', when: '10:18', date: '2026-08-12', icon: 'bolt', sev: 'act', actor: 'Arjun Shah', html: '<span class="actor">Arjun Shah</span> generated <strong>GEN-0139</strong> draft for Amazon Bedrock', detail: 'Develop · from map v1 · superseded by ADK target on 13 Aug' },
];

function isEvent(row: AuditRow): row is AuditEvent {
  return !('type' in row);
}

export default function AuditLog() {
  const toast = useToast();
  const [rows, setRows] = useState(INITIAL);
  const [q, setQ] = useState('');
  const [actor, setActor] = useState('all');
  const [scope, setScope] = useState('all');
  const [rangeMode, setRangeMode] = useState('week');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState(false);

  const inRange = useCallback((ds: string) => {
    if (!ds) return true;
    if (rangeMode === '24h') return ds >= '2026-08-15';
    if (rangeMode === 'custom') {
      if (fromDate && ds < fromDate) return false;
      if (toDate && ds > toDate) return false;
    }
    return true;
  }, [rangeMode, fromDate, toDate]);

  const eventVisible = useCallback((ev: AuditEvent) => {
    const txt = `${ev.actor} ${ev.html} ${ev.detail}`.toLowerCase();
    const actorMatch = actor === 'all' || (actor === 'system' ? txt.includes('system') : txt.includes(actor.toLowerCase()));
    const scopeMatch = scope === 'all' || ev.detail.includes(scope);
    const qMatch = !q.trim() || txt.includes(q.trim().toLowerCase());
    return actorMatch && scopeMatch && qMatch && inRange(ev.date);
  }, [actor, scope, q, inRange]);

  const { visibleCount, visibleRows, loadedEvents } = useMemo(() => {
    const events = rows.filter(isEvent);
    const visibleEvents = new Set(events.filter(eventVisible).map((e) => e.id));
    const out: AuditRow[] = [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if ('type' in row) {
        let show = false;
        for (let j = i + 1; j < rows.length; j++) {
          if ('type' in rows[j]) break;
          if (visibleEvents.has((rows[j] as AuditEvent).id)) { show = true; break; }
        }
        if (show) out.push(row);
      } else if (visibleEvents.has(row.id)) {
        out.push(row);
      }
    }
    return { visibleCount: visibleEvents.size, visibleRows: out, loadedEvents: events.length };
  }, [rows, eventVisible]);

  const showingHint = visibleCount === loadedEvents
    ? `Showing ${loadedEvents} of 481 events in the selected window`
    : `${visibleCount} of ${loadedEvents} loaded events match · 481 in full window`;

  const resetFilters = () => {
    setQ('');
    setActor('all');
    setScope('all');
    setRangeMode('week');
    setFromDate('');
    setToDate('');
  };

  const exportCsv = () => {
    const out: string[][] = [];
    rows.forEach((row) => {
      if ('type' in row || !eventVisible(row)) return;
      out.push([row.date, row.when, row.html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(), row.detail]);
    });
    const csv = 'date,time,event,detail\n' + out.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'audit-skyline-aug.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast(`Exported ${out.length} events as CSV`, 'download');
  };

  const loadOlder = () => {
    setLoading(true);
    setTimeout(() => {
      setRows((prev) => [...prev, ...OLDER]);
      setLoading(false);
      toast('3 older events loaded — 12 Aug', 'chevr');
    }, 700);
  };

  return (
    <AppShell
      crumb="Audit log"
      actions={<button type="button" className="btn btn-sm" onClick={exportCsv}><Icon name="download" />Export CSV</button>}
    >
      <div className="page" data-no-reveal data-od-id="audit-page">
        <div className="page-h mo-sec">
          <div style={{ flex: 1 }}>
            <h1 data-od-id="page-title">Audit log</h1>
            <p className="sub">Every mutation across Analysis, Design, Develop, connectors and admin — who, what and when. Retention: 365 days. Exports are signed URLs valid 15 minutes.</p>
          </div>
          <button type="button" className="btn" onClick={() => toast('Retention applies workspace-wide — contact admin to change', 'info')}><Icon name="gear" />Retention policy</button>
        </div>

        <div className="card mo-sec mo-sec-1" data-od-id="audit-filters">
          <div className="card-b" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', padding: '12px 16px' }}>
            <input className="input" style={{ flex: '1 1 220px', maxWidth: 280 }} placeholder="Search actor, target, detail…" aria-label="Search events by actor, target or detail" value={q} onChange={(e) => setQ(e.target.value)} />
            <select className="input" style={{ width: 160 }} aria-label="Filter by actor" value={actor} onChange={(e) => setActor(e.target.value)}>
              <option value="all">All actors</option>
              <option value="Riya Menon">Riya Menon</option>
              <option value="Devika Sharma">Devika Sharma</option>
              <option value="Arjun Shah">Arjun Shah</option>
              <option value="Priya Nair">Priya Nair</option>
              <option value="system">System / runs</option>
            </select>
            <select className="input" style={{ width: 170 }} aria-label="Filter by scope" value={scope} onChange={(e) => setScope(e.target.value)}>
              <option value="all">All scopes</option>
              <option value="Analysis">Analysis</option>
              <option value="Design">Design</option>
              <option value="Develop">Develop</option>
              <option value="Connectors">Connectors</option>
              <option value="Admin">Admin</option>
            </select>
            <div className="row" style={{ gap: 6 }} role="group" aria-label="Date range">
              {[
                { val: '24h', label: 'Last 24 h' },
                { val: 'week', label: 'This week' },
                { val: 'custom', label: 'Custom range' },
              ].map((c) => (
                <button key={c.val} type="button" className="chip" data-val={c.val} aria-pressed={rangeMode === c.val} onClick={() => setRangeMode(c.val)}>{c.label}</button>
              ))}
            </div>
            <span className={`date-range${rangeMode === 'custom' ? ' on' : ''}`}>
              <input type="date" className="input" min="2026-08-01" max="2026-08-16" aria-label="From date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              <span className="hint" aria-hidden="true">→</span>
              <input type="date" className="input" min="2026-08-01" max="2026-08-16" aria-label="To date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </span>
            <span style={{ flex: 1 }} />
            <span className="hint"><span>{visibleCount}</span> events</span>
          </div>
        </div>

        <div className="card mo-sec mo-sec-2" style={{ marginTop: 14 }} data-od-id="audit-events">
          {visibleRows.map((row) => (
            'type' in row ? (
              <div key={row.id} className="date-sep ev" data-date={row.date}><span style={{ fontSize: 12 }}>{row.label}</span></div>
            ) : (
              <div key={row.id} className={`ev mo-ev${row.sev ? ` ${row.sev}` : ''}`} data-date={row.date}>
                <div className="when tabular">{row.when}</div>
                <div className="ico"><Icon name={row.icon} /></div>
                <div className="meta">
                  <div dangerouslySetInnerHTML={{ __html: row.html }} />
                  <div className="detail">{row.detail}</div>
                </div>
              </div>
            )
          ))}
          {visibleCount === 0 && (
            <div className="empty" data-od-id="audit-empty">
              <Icon name="search" className="i-lg" style={{ marginBottom: 8 }} />
              <div style={{ fontWeight: 560, color: 'var(--fg)' }}>No events match these filters</div>
              <div>Try a different actor, scope, date range, or search term.</div>
              <button type="button" className="btn btn-sm" style={{ marginTop: 10 }} onClick={resetFilters}>Reset filters</button>
            </div>
          )}
        </div>

        <div className="row" style={{ marginTop: 14, justifyContent: 'space-between' }}>
          <span className="hint">{showingHint}</span>
          <button type="button" className="btn btn-sm" id="load-older" data-od-id="load-older" disabled={loading} onClick={loadOlder}>
            {loading ? <span className="spinner" aria-hidden="true" /> : <Icon name="chevr" />}Load older events
          </button>
        </div>
      </div>
    </AppShell>
  );
}
