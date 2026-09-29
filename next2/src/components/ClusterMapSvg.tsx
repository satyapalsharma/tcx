export function ClusterMapSvg() {
  return (
    <svg className="cluster-map" viewBox="0 0 940 430" role="img" aria-label="Cluster map: 286 canonical intents grouped into 6 L1 clusters sized by share of volume">
      <g className="cm-hub" transform="translate(24,160)">
        <rect width="196" height="96" rx="12" />
        <text x="98" y="40" textAnchor="middle" fontSize="30" fontWeight="640">286</text>
        <text x="98" y="62" textAnchor="middle" fontSize="12">canonical intents</text>
        <text x="98" y="80" textAnchor="middle" fontSize="11" fill="oklch(80% 0.02 250)">6 L1 · 19 L2 · 57 L3</text>
      </g>
      <path className="cm-link" d="M220 208 C260 208 260 35 300 35" />
      <path className="cm-link" d="M220 208 C260 208 260 103 300 103" />
      <path className="cm-link" d="M220 208 C260 208 260 171 300 171" />
      <path className="cm-link" d="M220 208 C260 208 260 239 300 239" />
      <path className="cm-link" d="M220 208 C260 208 260 307 300 307" />
      <path className="cm-link" d="M220 208 C260 208 260 375 300 375" />
      <g className="cm-l1 on" transform="translate(300,8)">
        <rect width="616" height="54" rx="10" />
        <text x="16" y="22" fontSize="12.5" fontWeight="580">Billing &amp; Payments</text>
        <text x="296" y="22" fontSize="11" fill="var(--muted)">4 L2 · 12 L3</text>
        <text x="600" y="22" textAnchor="end" fontSize="11.5" fill="var(--muted)" className="tabular">7,045 · 38.2%</text>
        <rect className="cm-bar" x="16" y="32" width="584" height="6" rx="3" />
        <rect className="cm-bar-fill" x="16" y="32" width="584" height="6" rx="3" />
      </g>
      <g className="cm-l1" transform="translate(300,76)">
        <rect width="616" height="54" rx="10" />
        <text x="16" y="22" fontSize="12.5" fontWeight="580">Connectivity &amp; Outages</text>
        <text x="296" y="22" fontSize="11" fill="var(--muted)">5 L2 · 18 L3</text>
        <text x="600" y="22" textAnchor="end" fontSize="11.5" fill="var(--muted)" className="tabular">4,445 · 24.1%</text>
        <rect className="cm-bar" x="16" y="32" width="584" height="6" rx="3" />
        <rect className="cm-bar-fill" x="16" y="32" width="368.5" height="6" rx="3" />
      </g>
      <g className="cm-l1" transform="translate(300,144)">
        <rect width="616" height="54" rx="10" />
        <text x="16" y="22" fontSize="12.5" fontWeight="580">New Installation &amp; Provisioning</text>
        <text x="296" y="22" fontSize="11" fill="var(--muted)">3 L2 · 9 L3</text>
        <text x="600" y="22" textAnchor="end" fontSize="11.5" fill="var(--muted)" className="tabular">2,545 · 13.8%</text>
        <rect className="cm-bar" x="16" y="32" width="584" height="6" rx="3" />
        <rect className="cm-bar-fill" x="16" y="32" width="211" height="6" rx="3" />
      </g>
      <g className="cm-l1" transform="translate(300,212)">
        <rect width="616" height="54" rx="10" />
        <text x="16" y="22" fontSize="12.5" fontWeight="580">Plan Changes &amp; Upgrades</text>
        <text x="296" y="22" fontSize="11" fill="var(--muted)">3 L2 · 7 L3</text>
        <text x="600" y="22" textAnchor="end" fontSize="11.5" fill="var(--muted)" className="tabular">1,697 · 9.2%</text>
        <rect className="cm-bar" x="16" y="32" width="584" height="6" rx="3" />
        <rect className="cm-bar-fill" x="16" y="32" width="140.6" height="6" rx="3" />
      </g>
      <g className="cm-l1" transform="translate(300,280)">
        <rect width="616" height="54" rx="10" />
        <text x="16" y="22" fontSize="12.5" fontWeight="580">Cancellation &amp; Port-out</text>
        <text x="296" y="22" fontSize="11" fill="var(--muted)">2 L2 · 6 L3</text>
        <text x="600" y="22" textAnchor="end" fontSize="11.5" fill="var(--muted)" className="tabular">1,550 · 8.4%</text>
        <rect className="cm-bar" x="16" y="32" width="584" height="6" rx="3" />
        <rect className="cm-bar-fill" x="16" y="32" width="128.4" height="6" rx="3" />
      </g>
      <g className="cm-l1" transform="translate(300,348)">
        <rect width="616" height="54" rx="10" />
        <text x="16" y="22" fontSize="12.5" fontWeight="580">Account &amp; Identity</text>
        <text x="296" y="22" fontSize="11" fill="var(--muted)">2 L2 · 5 L3</text>
        <text x="600" y="22" textAnchor="end" fontSize="11.5" fill="var(--muted)" className="tabular">1,160 · 6.3%</text>
        <rect className="cm-bar" x="16" y="32" width="584" height="6" rx="3" />
        <rect className="cm-bar-fill" x="16" y="32" width="96.3" height="6" rx="3" />
      </g>
    </svg>
  );
}
