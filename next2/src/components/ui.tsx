import { useState, type ReactNode } from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tabs as ShadcnTabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
export { Switch } from '@/components/ui/switch';

export function Tabs({ tabs, panels, defaultTab }: {
  tabs: { id: string; label: ReactNode }[];
  panels: Record<string, ReactNode>;
  defaultTab?: string;
}) {
  const initial = defaultTab ?? tabs[0]?.id;
  const [active, setActive] = useState(initial);

  return (
    <ShadcnTabs value={active} onValueChange={setActive} className="w-full" data-tab-scope>
      <TabsList className="h-9 w-full justify-start rounded-none border-b border-border bg-transparent p-0 gap-1 overflow-x-auto scrollbar-none">
        {tabs.map((t) => (
          <TabsTrigger
            key={t.id}
            value={t.id}
            data-tab={t.id}
            className="h-9 px-3.5 text-xs sm:text-[13px] font-medium border-b-2 rounded-none border-transparent data-[state=active]:border-foreground data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none -mb-px flex items-center gap-2 transition-colors cursor-pointer"
          >
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {Object.entries(panels).map(([id, panel]) => (
        <TabsContent key={id} value={id} data-panel={id} className="mt-0 focus-visible:outline-none">
          {panel}
        </TabsContent>
      ))}
    </ShadcnTabs>
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
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={(val) => { if (val) onChange(val); }}
        className="flex flex-wrap items-center gap-1.5"
        data-chips
        data-swap={swapPrefix}
      >
        {options.map((o) => (
          <ToggleGroupItem
            key={o.val}
            value={o.val}
            data-val={o.val}
            className="h-6.5 px-2.5 text-xs font-medium rounded-full border border-border bg-surface text-foreground hover:bg-surface-hover data-[state=on]:bg-foreground data-[state=on]:border-foreground data-[state=on]:text-surface data-[state=on]:font-semibold shadow-none transition-all cursor-pointer whitespace-nowrap"
          >
            {o.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      {swapPrefix && options.map((o) => (
        <div key={o.val} data-swap-panel={`${swapPrefix}-${o.val}`} hidden={value !== o.val} />
      ))}
    </>
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
