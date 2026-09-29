import { useState, type ReactNode } from 'react';

export function Tabs({ tabs, panels, defaultTab }: {
  tabs: { id: string; label: ReactNode }[];
  panels: Record<string, ReactNode>;
  defaultTab?: string;
}) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.id);
  return (
    <div data-tab-scope>
      <div className="flex items-center gap-1 border-b border-border overflow-x-auto scrollbar-none" data-tabs>
        {tabs.map((t) => {
          const isSelected = active === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              data-tab={t.id}
              onClick={() => setActive(t.id)}
              className={`h-9 px-3.5 text-xs sm:text-[13px] font-medium border-b-2 -mb-px flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer ${
                isSelected
                  ? 'border-foreground text-foreground font-semibold'
                  : 'border-transparent text-muted hover:text-foreground'
              }`}
            >
              {t.label}
            </button>
          );
        })}
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
      <div className="flex flex-wrap items-center gap-1.5" data-chips data-swap={swapPrefix}>
        {options.map((o) => {
          const isSelected = value === o.val;
          return (
            <button
              key={o.val}
              type="button"
              data-val={o.val}
              aria-pressed={isSelected}
              onClick={() => onChange(o.val)}
              className={`inline-flex items-center gap-1.5 h-6.5 px-2.5 text-xs font-medium rounded-full border transition-all cursor-pointer whitespace-nowrap ${
                isSelected
                  ? 'bg-foreground border-foreground text-surface font-semibold shadow-xs'
                  : 'bg-surface border-border text-foreground hover:bg-surface-hover hover:border-[oklch(87%_0.006_250)]'
              }`}
            >
              {o.label}
            </button>
          );
        })}
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
      className={`relative inline-flex items-center h-5 w-8.5 shrink-0 rounded-full transition-colors cursor-pointer ${
        checked ? 'bg-accent-strong' : 'bg-[oklch(88%_0.006_250)]'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-surface shadow-xs transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-0.5'
        }`}
      />
    </span>
  );
}

export function useTextFilter<T>(items: T[], getText: (item: T) => string) {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const filtered = q ? items.filter((item) => getText(item).toLowerCase().includes(q)) : items;
  return { query, setQuery, filtered, count: filtered.length };
}

export function usePageReveal() {
  // handled cleanly via Tailwind animate utilities
}
