'use client';

import { useState } from 'react';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { CloseButton, Dialog, useOverlay } from '../components/Overlay';
import { useToast } from '../components/Toast';
import { useReveal } from '../hooks/useReveal';
import { useApp } from '@/context/AppContext';
import { PageHeader, StatusBadge, EmptyState, SearchToolbar } from '@/components/common';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type Member = {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Builder' | 'Viewer';
  workspaces: string;
  lastActive: string;
  status: 'active' | 'invited' | 'service';
  initials: string;
};

const INITIAL_MEMBERS: Member[] = [
  {
    id: 'priya',
    name: 'Priya Nair',
    email: 'priya@skyline-broadband.com',
    role: 'Admin',
    workspaces: 'All Workspaces',
    lastActive: 'Just now',
    status: 'active',
    initials: 'PN',
  },
  {
    id: 'riya',
    name: 'Riya Menon',
    email: 'riya.m@skyline-broadband.com',
    role: 'Builder',
    workspaces: 'Customer Operations',
    lastActive: '12 min ago',
    status: 'active',
    initials: 'RM',
  },
  {
    id: 'devika',
    name: 'Devika Sharma',
    email: 'devika.s@skyline-broadband.com',
    role: 'Builder',
    workspaces: 'Billing & Payments',
    lastActive: '1 hr ago',
    status: 'active',
    initials: 'DS',
  },
  {
    id: 'arjun',
    name: 'Arjun Shah',
    email: 'arjun.sh@skyline-broadband.com',
    role: 'Builder',
    workspaces: 'Network Support Staging',
    lastActive: '24 min ago',
    status: 'active',
    initials: 'AS',
  },
  {
    id: 'karan',
    name: 'Karan Mehta',
    email: 'k.mehta@partner.skylinebb.com',
    role: 'Viewer',
    workspaces: 'Customer Operations',
    lastActive: '2 days ago',
    status: 'invited',
    initials: 'KM',
  },
  {
    id: 'svc-deploy',
    name: 'svc-transform-bot',
    email: 'ci-runner@skyline-broadband.internal',
    role: 'Builder',
    workspaces: 'All Workspaces',
    lastActive: 'via CI (5m ago)',
    status: 'service',
    initials: 'SB',
  },
];

const ROLES_INFO = [
  {
    role: 'Admin',
    icon: 'shield' as const,
    summary: 'Full access to organization settings, team members, workspace creation, and billing.',
    badge: 'Full Access',
  },
  {
    role: 'Builder',
    icon: 'code' as const,
    summary: 'Can run intent discovery, design process maps, scaffold agent code, and trigger jobs.',
    badge: 'Pipeline & Code',
  },
  {
    role: 'Viewer',
    icon: 'eye' as const,
    summary: 'Read-only access to view dashboards, analytics, execution traces, and architecture diagrams.',
    badge: 'Read Only',
  },
];

export default function Rbac() {
  useReveal();
  const toast = useToast();
  const { open, close } = useOverlay();
  const { currentOrg, setIsInviteOpen } = useApp();

  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);

  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      !search.trim() ||
      `${m.name} ${m.email} ${m.workspaces}`.toLowerCase().includes(search.trim().toLowerCase());
    const matchesRole = !roleFilter || m.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleRoleChange = (memberId: string, newRole: 'Admin' | 'Builder' | 'Viewer') => {
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
    );
    toast(`Updated role to ${newRole}`, 'check');
  };

  const askDelete = (member: Member) => {
    setDeleteTarget(member);
    open('dlg-delete-member');
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setMembers((prev) => prev.filter((m) => m.id !== deleteTarget.id));
    toast(`Removed ${deleteTarget.name} from organization`, 'trash');
    setDeleteTarget(null);
    close();
  };

  return (
    <AppShell crumb="Team & Members">
      <div className="p-4 sm:p-6 lg:p-7 max-w-[1240px] mx-auto w-full pb-16 space-y-6" data-od-id="rbac-page">
        <PageHeader
          title="Team & Access Control"
          description={`Organization: ${currentOrg.name} · Manage collaborators, access permissions, and workspace scoping.`}
          dataOdId="page-title"
          actions={
            <Button
              type="button"
              variant="accent"
              className="gap-2 h-9 px-3.5 text-xs sm:text-sm font-medium cursor-pointer"
              onClick={() => setIsInviteOpen(true)}
              data-od-id="invite-member-btn"
            >
              <Icon name="plus" className="w-4 h-4" />Invite team member
            </Button>
          }
        />

        {/* Roles Overview Cards (Occam's Razor: 3 clear SaaS roles instead of 60-checkbox matrix) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {ROLES_INFO.map((r) => (
            <Card key={r.role} className="p-4 bg-surface border border-border rounded-xl shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-surface-inset border border-border grid place-items-center text-foreground">
                    <Icon name={r.icon} className="w-4 h-4" />
                  </div>
                  <span className="font-semibold text-sm text-foreground">{r.role}</span>
                </div>
                <Badge variant="outline" className="text-[10px] font-medium border-border">
                  {r.badge}
                </Badge>
              </div>
              <p className="text-xs text-muted leading-relaxed">{r.summary}</p>
            </Card>
          ))}
        </div>

        {/* Members Table */}
        <Card className="bg-surface border border-border rounded-xl shadow-xs overflow-hidden p-0 gap-0">
          <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Organization Members</h3>
              <p className="text-xs text-muted">People with access to workspaces in {currentOrg.name}</p>
            </div>
            <SearchToolbar
              query={search}
              onQueryChange={setSearch}
              placeholder="Search member or email"
              count={filteredMembers.length}
              countLabel="shown"
            >
              <select
                className="h-8 px-2.5 bg-surface-inset border border-border rounded-md text-xs text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                aria-label="Filter by role"
              >
                <option value="">All roles</option>
                <option value="Admin">Admin</option>
                <option value="Builder">Builder</option>
                <option value="Viewer">Viewer</option>
              </select>
            </SearchToolbar>
          </div>

          <div className="overflow-x-auto">
            <Table className="min-w-[700px]">
              <TableHeader className="bg-surface-inset/50 border-b border-border">
                <TableRow className="text-[11px] font-semibold uppercase tracking-wider text-muted hover:bg-transparent">
                  <TableHead className="px-4 py-3 text-muted">Member</TableHead>
                  <TableHead className="px-4 py-3 text-muted">Role</TableHead>
                  <TableHead className="px-4 py-3 text-muted">Workspace Scope</TableHead>
                  <TableHead className="px-4 py-3 text-muted">Status</TableHead>
                  <TableHead className="px-4 py-3 text-muted">Last Active</TableHead>
                  <TableHead className="px-4 py-3 text-right text-muted">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/60">
                {filteredMembers.map((m) => (
                  <TableRow key={m.id} className="hover:bg-surface-hover/40 transition-colors">
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8 rounded-full border border-border text-xs font-semibold">
                          <AvatarFallback className={m.status === 'service' ? 'bg-surface-inset text-muted' : 'bg-foreground text-background'}>
                            {m.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                            {m.name}
                            {m.status === 'service' && (
                              <Badge variant="outline" className="text-[9px] py-0 px-1 border-border text-muted">
                                Service Account
                              </Badge>
                            )}
                          </div>
                          <div className="text-[11px] text-muted">{m.email}</div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="px-4 py-3">
                      <select
                        value={m.role}
                        onChange={(e) => handleRoleChange(m.id, e.target.value as 'Admin' | 'Builder' | 'Viewer')}
                        className="h-7 px-2 bg-surface-inset border border-border rounded-md text-xs font-medium text-foreground focus:outline-none focus:border-accent"
                        aria-label={`Change role for ${m.name}`}
                      >
                        <option value="Admin">Admin</option>
                        <option value="Builder">Builder</option>
                        <option value="Viewer">Viewer</option>
                      </select>
                    </TableCell>

                    <TableCell className="px-4 py-3 text-xs text-foreground">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-inset border border-border text-[11px]">
                        <Icon name="grid" className="w-3 h-3 text-muted" />
                        {m.workspaces}
                      </span>
                    </TableCell>

                    <TableCell className="px-4 py-3">
                      {m.status === 'active' ? (
                        <StatusBadge status="ok">Active</StatusBadge>
                      ) : m.status === 'invited' ? (
                        <StatusBadge status="warn">Invited</StatusBadge>
                      ) : (
                        <StatusBadge status="neutral">System</StatusBadge>
                      )}
                    </TableCell>

                    <TableCell className="px-4 py-3 text-xs text-muted font-mono">
                      {m.lastActive}
                    </TableCell>

                    <TableCell className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {m.status === 'invited' ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            className="text-muted hover:text-foreground cursor-pointer"
                            title="Resend Invitation"
                            onClick={() => toast(`Invitation resent to ${m.email}`, 'mail')}
                          >
                            <Icon name="sync" className="w-3.5 h-3.5" />
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            className="text-muted hover:text-foreground cursor-pointer"
                            title="Reset Password / Keys"
                            onClick={() => toast(`Password reset sent to ${m.email}`, 'key')}
                          >
                            <Icon name="key" className="w-3.5 h-3.5" />
                          </Button>
                        )}

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          className="text-muted hover:text-danger-fg hover:bg-danger-soft cursor-pointer"
                          title="Remove Member"
                          onClick={() => askDelete(m)}
                        >
                          <Icon name="trash" className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredMembers.length === 0 && (
            <EmptyState
              icon="users"
              title="No members match this search."
              description="Try adjusting your search query or role filter."
              action={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2 text-xs"
                  onClick={() => {
                    setSearch('');
                    setRoleFilter('');
                  }}
                >
                  Reset filters
                </Button>
              }
            />
          )}

          <div className="p-3.5 border-t border-border bg-surface-inset/30 flex justify-between items-center text-xs text-muted">
            <span>
              Showing <span className="font-semibold text-foreground">{filteredMembers.length}</span> of {members.length} members
            </span>
            <Button
              type="button"
              variant="link"
              size="sm"
              className="text-xs text-accent p-0 h-auto cursor-pointer"
              onClick={() => setIsInviteOpen(true)}
            >
              + Invite another collaborator
            </Button>
          </div>
        </Card>
      </div>

      {/* Confirm Delete Dialog */}
      <Dialog id="dlg-delete-member">
        <div className="p-5 border-b border-border">
          <h2 className="text-base font-semibold text-foreground tracking-tight">Remove team member?</h2>
          <p className="text-xs text-muted mt-1">
            They will lose access to all workspaces and pipelines in <span className="font-semibold text-foreground">{currentOrg.name}</span> immediately.
          </p>
        </div>
        <div className="p-5 text-xs text-foreground">
          Are you sure you want to remove <strong className="font-semibold">{deleteTarget?.name}</strong> ({deleteTarget?.email})? This action cannot be undone.
        </div>
        <div className="p-4 border-t border-border bg-surface-inset/40 flex items-center justify-end gap-2.5 rounded-b-xl">
          <CloseButton variant="outline" className="px-3.5 h-8.5 text-xs">
            Cancel
          </CloseButton>
          <Button
            type="button"
            variant="destructive"
            className="px-3.5 h-8.5 text-xs"
            onClick={confirmDelete}
          >
            Remove member
          </Button>
        </div>
      </Dialog>
    </AppShell>
  );
}
