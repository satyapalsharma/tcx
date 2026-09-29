import type { ReactNode } from 'react';

type ProcessMapSvgProps = {
  activeNode?: string | null;
  onNodeClick?: (id: string) => void;
};

function Node({ id, className, transform, w, h, active, onClick, children }: {
  id: string;
  className: string;
  transform: string;
  w: number;
  h: number;
  active?: boolean;
  onClick?: (id: string) => void;
  children: ReactNode;
}) {
  return (
    <g
      className={`${className}${active ? ' active' : ''}`}
      data-od-id={id}
      transform={transform}
      onClick={() => onClick?.(id)}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick?.(id); }}
    >
      <rect className="n1" width={w} height={h} rx="10" />
      {className.includes('start') && id === 'pn-start' && (
        <rect className="n2" width={w} height={h} rx="10" fill="none" stroke="var(--accent-strong)" strokeWidth="2" strokeOpacity="0" />
      )}
      {children}
    </g>
  );
}

export function ProcessMapSvg({ activeNode, onNodeClick }: ProcessMapSvgProps) {
  return (
    <svg className="pmap" viewBox="0 0 940 560" role="img" aria-label="Process map of the billing dispute conversation flow" data-od-id="pmap-canvas">
      <defs>
        <marker id="arrowhead" markerWidth="9" markerHeight="9" refX="7.5" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill="var(--lineln)" />
        </marker>
      </defs>
      <Node id="pn-start" className="pmap-node start" transform="translate(40,42)" w={176} h={46} active={activeNode === 'pn-start'} onClick={onNodeClick}>
        <text x="88" y="28" textAnchor="middle" fontSize="12.5">START · call connected</text>
      </Node>
      <path className="pmap-edge" d="M216 65 H304" />
      <Node id="pn-auth" className="pmap-node" transform="translate(304,42)" w={176} h={46} active={activeNode === 'pn-auth'} onClick={onNodeClick}>
        <text className="pm-name" x="88" y="20" textAnchor="middle" fontSize="12.5">Authenticate caller</text>
        <text x="88" y="35" textAnchor="middle" fontSize="10.5" fill="var(--muted)">IVR + account match</text>
      </Node>
      <path className="pmap-edge" d="M480 65 H568" />
      <Node id="pn-fetch" className="pmap-node tool" transform="translate(568,42)" w={176} h={46} active={activeNode === 'pn-fetch'} onClick={onNodeClick}>
        <text className="pm-name" x="88" y="20" textAnchor="middle" fontSize="12.5" fill="var(--success-fg)">Fetch invoice</text>
        <text x="88" y="35" textAnchor="middle" fontSize="10.5" fill="var(--muted)">crm.get_invoice</text>
      </Node>
      <path className="pmap-edge" d="M744 65 H812 Q820 65 820 73 V88" />
      <Node id="pn-valid" className="pmap-node decision" transform="translate(732,88)" w={176} h={46} active={activeNode === 'pn-valid'} onClick={onNodeClick}>
        <text className="pm-name" x="88" y="20" textAnchor="middle" fontSize="12.5" fill="var(--warn-fg)">Dispute valid?</text>
        <text x="88" y="35" textAnchor="middle" fontSize="10.5" fill="var(--muted)">policy.dispute_rules</text>
      </Node>
      <path className="pmap-edge" d="M732 111 H664" />
      <text x="698" y="103" fontSize="11" fill="var(--muted)" textAnchor="middle">yes</text>
      <Node id="pn-credit" className="pmap-node tool" transform="translate(488,88)" w={176} h={46} active={activeNode === 'pn-credit'} onClick={onNodeClick}>
        <text className="pm-name" x="88" y="20" textAnchor="middle" fontSize="12.5" fill="var(--success-fg)">Issue credit</text>
        <text x="88" y="35" textAnchor="middle" fontSize="10.5" fill="var(--muted)">billing.apply_credit</text>
      </Node>
      <path className="pmap-edge" d="M488 111 H420" />
      <Node id="pn-confirm" className="pmap-node" transform="translate(244,88)" w={176} h={46} active={activeNode === 'pn-confirm'} onClick={onNodeClick}>
        <text className="pm-name" x="88" y="20" textAnchor="middle" fontSize="12.5">Send confirmation</text>
        <text x="88" y="35" textAnchor="middle" fontSize="10.5" fill="var(--muted)">SMS + email + ref code</text>
      </Node>
      <path className="pmap-edge" d="M244 111 H176" />
      <Node id="pn-end" className="pmap-node start" transform="translate(40,88)" w={136} h={46} active={activeNode === 'pn-end'} onClick={onNodeClick}>
        <text x="68" y="28" textAnchor="middle" fontSize="12.5">END · resolved</text>
      </Node>
      <path className="pmap-edge" d="M820 134 V194" />
      <text x="830" y="166" fontSize="11" fill="var(--muted)">no</text>
      <Node id="pn-explain" className="pmap-node" transform="translate(732,194)" w={176} h={46} active={activeNode === 'pn-explain'} onClick={onNodeClick}>
        <text className="pm-name" x="88" y="20" textAnchor="middle" fontSize="12.5">Explain charges</text>
        <text x="88" y="35" textAnchor="middle" fontSize="10.5" fill="var(--muted)">kb.get_terms + goodwill offer</text>
      </Node>
      <path className="pmap-edge" d="M820 240 V304" />
      <Node id="pn-retain" className="pmap-node" transform="translate(732,304)" w={176} h={46} active={activeNode === 'pn-retain'} onClick={onNodeClick}>
        <text className="pm-name" x="88" y="20" textAnchor="middle" fontSize="12.5">Escalate to retention</text>
        <text x="88" y="35" textAnchor="middle" fontSize="10.5" fill="var(--muted)">sub-agent · after 2 declines</text>
      </Node>
      <path className="pmap-edge dash" d="M732 327 H664 Q656 327 656 319 V245" />
      <text x="694" y="282" fontSize="11" fill="var(--muted)" textAnchor="end">declines ×1 → retry explain</text>
      <g transform="translate(40,382)">
        <rect width="620" height="118" rx="10" fill="var(--surface)" stroke="var(--border)" />
        <text x="16" y="26" className="seg-label">Conversation pattern — what the map was trained on</text>
        <text x="16" y="50" fontSize="12" fill="var(--fg)">Caller → “I cancelled last month but I’m still being charged”</text>
        <text x="16" y="70" fontSize="12" fill="var(--muted)">Agent → verifies cancellation effective date → compares plan terms → decides refund path.</text>
        <text x="16" y="98" fontSize="11.5" fill="var(--muted)">2,847 real calls clustered into this flow · avg handle 3m 40s · 41% reach an agent</text>
      </g>
      <g transform="translate(40,524)" fontSize="11.5" fill="var(--muted)">
        <rect x="0" y="-9" width="12" height="12" rx="3.5" fill="oklch(22% 0.01 250)" />
        <text x="18" y="1">start / end</text>
        <rect x="102" y="-9" width="12" height="12" rx="3.5" fill="var(--success-soft)" stroke="oklch(80% 0.06 150)" />
        <text x="120" y="1">tool call</text>
        <rect x="196" y="-9" width="12" height="12" rx="3.5" fill="var(--warn-soft)" stroke="oklch(78% 0.09 80)" />
        <text x="214" y="1">decision</text>
        <rect x="294" y="-9" width="12" height="12" rx="3.5" fill="var(--surface)" stroke="oklch(82% 0.01 250)" />
        <text x="312" y="1">agent step</text>
        <path d="M384 -3 H404" stroke="var(--lineln)" strokeDasharray="4 3" />
        <text x="410" y="1">conditional retry</text>
      </g>
    </svg>
  );
}
