import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';

const SCREENS = [
  { to: '/login', pri: true, od: 'scr-login', icon: 'lock' as const, name: 'Login', desc: 'Sign in · SSO + SAML stubs · demo gate' },
  { to: '/projects', od: 'scr-projects', icon: 'grid' as const, name: 'Projects home', desc: '3 umbrellas · project cards · pipeline status' },
  { to: '/jobs', od: 'scr-jobs', icon: 'clock' as const, name: 'Jobs', desc: 'All runs · status, cost tag, cancel / rerun / delete' },
  { to: '/dashboard', od: 'scr-dashboard', icon: 'chart' as const, name: 'Run dashboard', desc: 'Intents · L1→L2→L3 clusters · agents with filters + sort' },
  { to: '/analysis', od: 'scr-analysis', icon: 'chart' as const, name: "Analysis · Riya's view", desc: 'Intents · L1→L2→L3 clusters · live run progress' },
  { to: '/design', od: 'scr-design', icon: 'flow' as const, name: "Design · Devika's view", desc: 'Process map + UML · review & approve workflow' },
  { to: '/develop', od: 'scr-develop', icon: 'code' as const, name: "Develop · Arjun's view", desc: 'ADK / Bedrock / LangGraph code gen · build tracking' },
  { to: '/connectors', od: 'scr-connectors', icon: 'plug' as const, name: "Connectors · Priya's view", desc: 'S3 · Genesys · Salesforce · sync health' },
  { to: '/rbac', od: 'scr-rbac', icon: 'users' as const, name: 'Team & roles (RBAC)', desc: 'Members · umbrella chips · permission matrix' },
  { to: '/settings', od: 'scr-settings', icon: 'gear' as const, name: 'Settings', desc: 'Clients · cost tagging · workspace defaults' },
  { to: '/audit-log', od: 'scr-audit', icon: 'scroll' as const, name: 'Audit log', desc: 'Filterable timeline · actor + scope filters · export' },
];

export default function Launcher() {
  const [lastPage, setLastPage] = useState<string | null>(null);

  useEffect(() => {
    document.body.classList.add('launcher');
    try {
      const lp = localStorage.getItem('tx-last-page');
      if (lp && lp !== 'index') setLastPage(lp);
    } catch { /* noop */ }
    return () => document.body.classList.remove('launcher');
  }, []);

  const lastLabel = lastPage ? lastPage.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase()) : '';

  return (
    <main className="ov" data-od-id="launcher">
      <div className="row" style={{ gap: 10, alignItems: 'center' }}>
        <img className="exl-logo" src="/EXL_Service_logo.svg.webp" alt="EXL" style={{ height: 22, width: 'auto', display: 'block' }} />
        <span style={{ width: 1, height: 22, background: 'var(--border)' }} aria-hidden="true" />
        <div>
          <div style={{ fontWeight: 640, fontSize: 16, letterSpacing: '-0.02em' }}>Transform.cx</div>
          <div className="caps" style={{ marginTop: 1 }}>Prototype v1 · EXL</div>
        </div>
        <span className="badge" style={{ marginLeft: 'auto' }}><span className="dot" />12 screens</span>
      </div>
      <h1>Conversation-to-automation pipeline,<br />broken into clean stages</h1>
      <p className="lede">Customer interactions in → intents extracted → L1→L2→L3 clusters → process maps → agent code. Three umbrellas — <strong>Analysis</strong> (Analysts), <strong>Design</strong> (CX Designers), <strong>Develop</strong> (Developers) — each usable on its own or stacked end-to-end. Demo tells the Skyline Broadband story throughout.</p>
      <div className="screens" data-od-id="screen-list">
        {SCREENS.map((s) => (
          <Link key={s.to} className={`scr${s.pri ? ' pri' : ''}`} to={s.to} data-od-id={s.od} onClick={() => { try { localStorage.setItem('tx-last-page', s.to.slice(1)); } catch { /* noop */ } }}>
            <span className="ic"><Icon name={s.icon} /></span>
            <div><div className="n">{s.name}</div><div className="d">{s.desc}</div></div>
            <Icon name="arrowr" className="go" />
          </Link>
        ))}
      </div>
      {lastPage && (
        <div className="note" data-od-id="resume-note">
          <Icon name="clock" />
          Last opened in this session:
          <Link className="link" to={`/${lastPage}`} style={{ marginLeft: 2 }}>{lastLabel}</Link>
          · sidebar also returns you to any stage directly
        </div>
      )}
    </main>
  );
}
