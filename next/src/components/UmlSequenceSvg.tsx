export function UmlSequenceSvg() {
  return (
    <svg className="pmap" viewBox="0 0 860 470" role="img" aria-label="UML sequence diagram for billing dispute" data-od-id="uml-canvas">
      <g fontSize="12" fill="var(--fg)">
        <g>
          <rect x="20" y="14" width="128" height="36" rx="8" fill="var(--surface)" stroke="var(--border)" />
          <text x="84" y="37" textAnchor="middle">Customer</text>
          <line className="seqll" x1="84" y1="50" x2="84" y2="442" />
        </g>
        <g>
          <rect x="212" y="14" width="150" height="36" rx="8" fill="oklch(22% 0.01 250)" />
          <text x="287" y="37" textAnchor="middle" fill="var(--surface)">Orchestrator</text>
          <line className="seqll" x1="287" y1="50" x2="287" y2="442" />
        </g>
        <g>
          <rect x="402" y="14" width="120" height="36" rx="8" fill="var(--success-soft)" stroke="oklch(80% 0.06 150)" />
          <text x="462" y="37" textAnchor="middle" fill="var(--success-fg)">CRM tool</text>
          <line className="seqll" x1="462" y1="50" x2="462" y2="442" />
        </g>
        <g>
          <rect x="542" y="14" width="120" height="36" rx="8" fill="var(--success-soft)" stroke="oklch(80% 0.06 150)" />
          <text x="602" y="37" textAnchor="middle" fill="var(--success-fg)">Billing tool</text>
          <line className="seqll" x1="602" y1="50" x2="602" y2="442" />
        </g>
        <g>
          <rect x="682" y="14" width="150" height="36" rx="8" fill="var(--warn-soft)" stroke="oklch(78% 0.09 80)" />
          <text x="757" y="37" textAnchor="middle" fill="var(--warn-fg)">Escalation agent</text>
          <line className="seqll" x1="757" y1="50" x2="757" y2="442" />
        </g>
      </g>
      <g fontSize="11.5">
        <path className="pmap-edge" d="M84 84 H280" />
        <text x="182" y="76" textAnchor="middle" fill="var(--fg)">“I was charged after cancelling”</text>
        <path className="pmap-edge" d="M287 120 H455" />
        <text x="371" y="112" textAnchor="middle" fill="var(--muted)">get_customer(msisdn)</text>
        <path className="pmap-edge" d="M287 154 H455" />
        <text x="371" y="146" textAnchor="middle" fill="var(--muted)">get_invoice(inv_98231)</text>
        <path className="pmap-edge" d="M287 188 H595" />
        <text x="441" y="180" textAnchor="middle" fill="var(--muted)">validate_terms(plan, charges)</text>
        <path className="pmap-edge" d="M287 222 v0 c0 -14 26 -14 26 0 V222" fill="none" />
        <path d="M300 214 c0 -12 22 -12 22 0" stroke="var(--lineln)" fill="none" markerEnd="url(#arrowhead)" />
        <text x="300" y="207" fill="var(--muted)" textAnchor="end" transform="translate(64,0)">score_dispute()</text>
        <path className="pmap-edge" d="M287 262 H595" />
        <text x="441" y="254" textAnchor="middle" fill="var(--muted)">apply_credit(−₹412.00)</text>
        <path className="pmap-edge" d="M287 300 H92" />
        <text x="190" y="292" textAnchor="middle" fill="var(--fg)">“Credit applied — SMS + email sent”</text>
        <path className="pmap-edge dash" d="M287 354 H750" />
        <text x="518" y="346" textAnchor="middle" fill="var(--muted)">handoff(reason: high-value account) · optional</text>
      </g>
    </svg>
  );
}
