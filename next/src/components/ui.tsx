import { useState, type ReactNode } from 'react';

export function Tabs({ tabs, panels, defaultTab }: {
  tabs: { id: string; label: ReactNode }[];
  panels: Record<string, ReactNode>;
  defaultTab?: string;
}) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.id);
  return (
    <div data-tab-scope>
      <div className="tabs" data-tabs>
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active === t.id}
            data-tab={t.id}
            onClick={() => setActive(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {Object.entries(panels).map(([id, panel]) => (
        <div key={id} data-panel={id} hidden={active !== id}>{panel}</div>
      ))}
    </div>
  );
}

export function ChipGroup({ options, value, onChange, swapPrefix }: {
  options: { val: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  swapPrefix?: string;
}) {
  return (
    <>
      <div className="chips" data-chips data-swap={swapPrefix}>
        {options.map((o) => (
          <button
            key={o.val}
            type="button"
            className="chip"
            data-val={o.val}
            aria-pressed={value === o.val}
            onClick={() => onChange(o.val)}
          >
            {o.label}
          </button>
        ))}
      </div>
      {swapPrefix && options.map((o) => (
        <div key={o.val} data-swap-panel={`${swapPrefix}-${o.val}`} hidden={value !== o.val} />
      ))}
    </>
  );
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  const toggle = () => onChange(!checked);
  return (
    <span
      className="switch"
      role="switch"
      tabIndex={0}
      aria-checked={checked}
      aria-label={label}
      onClick={toggle}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          toggle();
        }
      }}
    />
  );
}

export function useTextFilter<T>(items: T[], getText: (item: T) => string) {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const filtered = q ? items.filter((item) => getText(item).toLowerCase().includes(q)) : items;
  return { query, setQuery, filtered, count: filtered.length };
}

export function usePageReveal() {
  // reveal-in animation handled by tx.css when class added on mount
}
