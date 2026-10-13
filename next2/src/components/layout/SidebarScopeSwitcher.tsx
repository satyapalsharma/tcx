'use client';

import { Icon } from '@/components/Icon';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type Props = {
  kind: 'organization' | 'project';
  current: { id: string; name: string };
  options: { id: string; name: string }[];
  memberCount?: number;
  onSelect: (id: string) => void;
  onCreate: () => void;
};

/** Reuses shadcn's sidebar button and radio menu for both scope selectors. */
export function SidebarScopeSwitcher({
  kind,
  current,
  options,
  memberCount,
  onSelect,
  onCreate,
}: Props) {
  const organization = kind === 'organization';
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size={organization ? 'lg' : 'default'}
              className={
                organization
                  ? 'h-auto min-h-16 rounded-xl border border-white/10 bg-white/5 p-3 hover:bg-white/10'
                  : 'h-8 px-1 text-xs'
              }
              data-od-id={`${kind}-switcher`}
              aria-label={`Switch ${kind}: ${current.name}`}
            >
              {organization ? (
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/10 text-xs font-semibold text-white">
                  {current.name.slice(0, 2).toUpperCase()}
                </span>
              ) : (
                <Icon name="folder" className="size-4 text-white/60" />
              )}
              <span className="min-w-0 flex-1">
                <span
                  className={`block truncate ${organization ? 'text-xs font-semibold text-white' : 'text-white/80'}`}
                >
                  {current.name}
                </span>
                {organization && (
                  <span className="block text-[11px] text-white/60">
                    Organization · {memberCount} members
                  </span>
                )}
              </span>
              <Icon name="chev" className="size-3.5 shrink-0 text-white/60" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-64 max-w-[calc(100vw-2rem)]"
          >
            <DropdownMenuLabel>
              {organization ? 'Organizations' : 'Projects'}
            </DropdownMenuLabel>
            <DropdownMenuRadioGroup value={current.id} onValueChange={onSelect}>
              {options.map((option) => (
                <DropdownMenuRadioItem key={option.id} value={option.id}>
                  <span className="truncate">{option.name}</span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onCreate}>
              <Icon name="plus" className="size-4" />
              Create {kind}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
