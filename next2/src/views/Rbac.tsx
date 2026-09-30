'use client';

import { useState } from 'react';
import { AppShell } from '../components/AppShell';
import { Icon, type IconName } from '../components/Icon';
import { CloseButton, Dialog, OpenButton, useOverlay } from '../components/Overlay';
import { useTextFilter } from '../components/ui';
import { useToast } from '../components/Toast';
import { useReveal } from '../hooks/useReveal';
import { PageHeader, StatusBadge, EmptyState, SearchToolbar } from '@/components/common';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const ROLE_OPTIONS = ['Admin', 'Business Analyst', 'CX Designer', 'Developer', 'Viewer'];

type UmbrellaChip = { label: string; off?: boolean };

type Member = {
  id: string;
  odId: string;
  name: string;
  email: string;
  role: string;
  roleDisabled?: boolean;
  roleOptions?: string[];
  chips: UmbrellaChip[];
  lastActive: string;
  statusLabel: string;
  statusBadge: string;
  actionTitle: string;
  actionIcon: IconName;
  actionToast: string;
  service?: boolean;
  initials: string;
  avatarMuted?: boolean;
};

type RoleCard = {
  id: string;
  icon: IconName;
  name: string;
  desc: string;
  deletable: boolean;
};

const INITIAL_MEMBERS: Member[] = [
  {
    id: 'priya', odId: 'mem-priya', name: 'Priya Nair', email: 'priya@skyline-broadband.com', role: 'Admin',
    chips: [{ label: 'Analysis' }, { label: 'Design' }, { label: 'Develop' }, { label: 'Admin' }],
    lastActive: 'now', statusLabel: 'Active', statusBadge: 'ok',
    actionTitle: 'Reset password', actionIcon: 'key', actionToast: 'Reset link sent to Priya',
    initials: 'PN',
  },
  {
    id: 'riya', odId: 'mem-riya', name: 'Riya Menon', email: 'riya.m@skyline-broadband.com', role: 'Business Analyst',
    chips: [{ label: 'Analysis' }, { label: 'Design · view', off: true }, { label: 'Develop · —', off: true }],
    lastActive: '12 min ago', statusLabel: 'Active', statusBadge: 'ok',
    actionTitle: 'Reset password', actionIcon: 'key', actionToast: 'Reset link sent to Riya',
    initials: 'RM',
  },
  {
    id: 'devika', odId: 'mem-devika', name: 'Devika Sharma', email: 'devika.s@skyline-broadband.com', role: 'CX Designer',
    chips: [{ label: 'Analysis · view', off: true }, { label: 'Design' }, { label: 'Develop · —', off: true }],
    lastActive: '1 h ago', statusLabel: 'Active', statusBadge: 'ok',
    actionTitle: 'Reset password', actionIcon: 'key', actionToast: 'Reset link sent to Devika',
    initials: 'DS',
  },
  {
    id: 'arjun', odId: 'mem-arjun', name: 'Arjun Shah', email: 'arjun.sh@skyline-broadband.com', role: 'Developer',
    chips: [{ label: 'Analysis · —', off: true }, { label: 'Design · view', off: true }, { label: 'Develop' }],
    lastActive: '24 min ago', statusLabel: 'Active', statusBadge: 'ok',
    actionTitle: 'Reset password', actionIcon: 'key', actionToast: 'Reset link sent to Arjun',
    initials: 'AS',
  },
  {
    id: 'karan', odId: 'mem-karan', name: 'Karan Mehta', email: 'k.mehhta@partner.skylinebb.com', role: 'Viewer',
    chips: [{ label: 'Analysis · view', off: true }, { label: 'Design · view', off: true }, { label: 'Develop · view', off: true }],
    lastActive: '2 days ago', statusLabel: 'Invite pending', statusBadge: 'warn',
    actionTitle: 'Resend invite', actionIcon: 'sync', actionToast: 'Invite resent to Karan',
    initials: 'KM',
  },
  {
    id: 'svc', odId: 'mem-svc', name: 'svc-transform-bot', email: 'service account · deploy CI', role: 'Developer',
    roleDisabled: true, roleOptions: ['Developer'], service: true,
    chips: [{ label: 'Develop · deploy only', off: true }],
    lastActive: 'via CI', statusLabel: 'Service acct', statusBadge: 'default',
    actionTitle: 'Rotate token', actionIcon: 'key', actionToast: 'Token rotation started — old token valid for 24 h',
    initials: 'SC', avatarMuted: true,
  },
];

const INITIAL_ROLES: RoleCard[] = [
  { id: 'role-admin', icon: 'shield', name: 'Admin', desc: 'Full workspace control, connectors, billing, users.', deletable: false },
  { id: 'role-analyst', icon: 'chart', name: 'Business Analyst', desc: 'Runs pipelines, curates intents, approves clusters.', deletable: true },
  { id: 'role-designer', icon: 'flow', name: 'CX Designer', desc: 'Edits process maps & UML, manages the review queue.', deletable: true },
  { id: 'role-developer', icon: 'code', name: 'Developer', desc: 'Generates builds, deploys to staging, reads approved maps.', deletable: true },
  { id: 'role-viewer', icon: 'eye', name: 'Viewer', desc: 'Read-only across all stages. Good for leadership reviews.', deletable: true },
];

const MATRIX_ROWS: { cap: string; perms: ('f' | 'p' | 'n')[] }[] = [
  { cap: 'Upload data & run intent pipeline', perms: ['f', 'f', 'n', 'n', 'n'] },
  { cap: 'Edit / merge intents, curate taxonomy', perms: ['f', 'f', 'p', 'n', 'n'] },
  { cap: 'Approve clusters & hand to Design', perms: ['f', 'f', 'n', 'n', 'n'] },
  { cap: 'Edit process maps & UML diagrams', perms: ['f', 'p', 'f', 'n', 'n'] },
  { cap: 'Approve maps / request changes', perms: ['f', 'p', 'f', 'n', 'n'] },
  { cap: 'Generate agent builds', perms: ['f', 'n', 'p', 'f', 'n'] },
  { cap: 'Deploy to staging / production', perms: ['f', 'n', 'n', 'p', 'n'] },
  { cap: 'Manage connectors & credentials', perms: ['f', 'p', 'n', 'n', 'n'] },
  { cap: 'Invite users & change roles', perms: ['f', 'n', 'n', 'n', 'n'] },
  { cap: 'View audit log', perms: ['f', 'p', 'p', 'p', 'p'] },
];

function Perm({ type }: { type: 'f' | 'p' | 'n' }) {
  if (type === 'f') return <span className="inline-block w-3.5 h-3.5 rounded-full bg-foreground align-middle" title="Full" />;
  if (type === 'p') return <span className="inline-block w-3.5 h-3.5 rounded-full bg-warn ring-2 ring-warn-soft align-middle" title="Limited" />;
  return <span className="inline-block w-3.5 h-3.5 rounded-full border border-border align-middle" title="None" />;
}

function MultiChips({ labels, selected, onChange, odId }: {
  labels: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  odId?: string;
}) {
  const toggle = (label: string) => {
    onChange(selected.includes(label) ? selected.filter((l) => l !== label) : [...selected, label]);
  };
  return (
    <div className="flex flex-wrap items-center gap-1.5" data-chips-multi data-od-id={odId}>
      {labels.map((label) => {
        const isSelected = selected.includes(label);
        return (
          <button
            key={label}
            type="button"
            aria-pressed={isSelected}
            onClick={() => toggle(label)}
            className={`inline-flex items-center h-6.5 px-2.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
              isSelected
                ? 'bg-foreground border-foreground text-surface font-semibold'
                : 'bg-surface border-border text-foreground hover:bg-surface-hover'
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export default function Rbac() {
  useReveal();
  const toast = useToast();
  const { open, close } = useOverlay();
  const [members, setMembers] = useState(INITIAL_MEMBERS);
  const [roles, setRoles] = useState(INITIAL_ROLES);
  const { query, setQuery, filtered, count } = useTextFilter(members, (m) => `${m.name} ${m.email} ${m.role}`);

  const [invite, setInvite] = useState({ name: '', email: '', role: 'Business Analyst' });
  const [inviteUmbrellas, setInviteUmbrellas] = useState(['Analysis']);
  const [roleForm, setRoleForm] = useState({ name: '', desc: '' });
  const [roleUmbrellas, setRoleUmbrellas] = useState(['Analysis']);
  const [editingRole, setEditingRole] = useState<string | null>(null);

  const [confirm, setConfirm] = useState<{
    title: string;
    body: string;
    okLabel: string;
    onOk: () => void;
  } | null>(null);

  const askConfirm = (title: string, body: string, okLabel: string, onOk: () => void) => {
    setConfirm({ title, body, okLabel, onOk });
    open('dlg-confirm');
  };

  const updateMemberRole = (id: string, newRole: string) => {
    setMembers((prev) => prev.map((m) => {
      if (m.id !== id) return m;
      const chips: UmbrellaChip[] = newRole === 'Admin'
        ? [{ label: 'Analysis' }, { label: 'Design' }, { label: 'Develop' }, { label: 'Admin' }]
        : newRole === 'Business Analyst'
        ? [{ label: 'Analysis' }, { label: 'Design · view', off: true }, { label: 'Develop · —', off: true }]
        : newRole === 'CX Designer'
        ? [{ label: 'Analysis · view', off: true }, { label: 'Design' }, { label: 'Develop · —', off: true }]
        : newRole === 'Developer'
        ? [{ label: 'Analysis · —', off: true }, { label: 'Design · view', off: true }, { label: 'Develop' }]
        : [{ label: 'Analysis · view', off: true }, { label: 'Design · view', off: true }, { label: 'Develop · view', off: true }];
      return { ...m, role: newRole, chips };
    }));
    toast(`Role updated to ${newRole}`, 'check');
  };

  const sendInvite = () => {
    const name = invite.name.trim();
    const email = invite.email.trim();
    if (!email) {
      toast('Please provide a work email', 'warn');
      return;
    }
    const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || email.slice(0, 2).toUpperCase();
    const newMember: Member = {
      id: `mem-${Date.now()}`,
      odId: `mem-${Date.now()}`,
      name: name || email.split('@')[0],
      email,
      role: invite.role,
      chips: inviteUmbrellas.map((u) => ({ label: u })),
      lastActive: 'just now',
      statusLabel: 'Invite pending',
      statusBadge: 'warn',
      actionTitle: 'Resend invite',
      actionIcon: 'sync',
      actionToast: `Invite resent to ${email}`,
      initials,
    };
    setMembers((prev) => [newMember, ...prev]);
    close();
    toast(`Invitation sent to ${email}`, 'mail');
    setInvite({ name: '', email: '', role: 'Business Analyst' });
    setInviteUmbrellas(['Analysis']);
  };

  const deleteMember = (m: Member) => {
    if (m.service) {
      toast('Service accounts are revoked from Connectors, not deleted here', 'info');
      return;
    }
    askConfirm(
      `Delete ${m.name}?`,
      'They lose access immediately. Existing work they own stays in the workspace and is reassigned to the workspace admin. This is logged in the audit log.',
      'Delete member',
      () => {
        setMembers((prev) => prev.filter((x) => x.id !== m.id));
        toast(`${m.name} removed — access revoked`, 'trash');
        setConfirm(null);
      },
    );
  };

  const openRoleDialog = (name = '', desc = '') => {
    setEditingRole(name && name !== 'New role' ? name : null);
    setRoleForm({ name, desc });
    setRoleUmbrellas(['Analysis']);
    open('dlg-role');
  };

  const deleteRole = (role: RoleCard) => {
    askConfirm(
      `Delete the ${role.name} role?`,
      'Members holding this role fall back to Viewer. Connectors, builds and maps created by them are unaffected.',
      'Delete role',
      () => {
        setRoles((prev) => prev.filter((r) => r.id !== role.id));
        toast(`${role.name} role deleted — holders moved to Viewer`, 'trash');
        setConfirm(null);
      },
    );
  };

  const saveRole = () => {
    const name = roleForm.name.trim() || 'Untitled role';
    close();
    toast(editingRole ? `Role "${name}" updated` : `Role "${name}" created`, 'users');
    setRoleForm({ name: '', desc: '' });
    setEditingRole(null);
  };

  return (
    <AppShell crumb="Team & roles">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6" data-od-id="rbac-page">
        <PageHeader
          title="Team & roles"
          description="Roles map to umbrellas — Analysts own Analysis, Designers own Design, Developers own Develop. Everyone else watches. Access changes apply on next sign-in and are logged in the audit log."
          dataOdId="page-title"
          className="pb-4 border-b border-border mb-0"
          actions={
            <>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md text-xs sm:text-sm font-medium border border-border bg-surface hover:bg-surface-hover transition-colors text-foreground shadow-xs cursor-pointer"
                id="new-role-btn"
                data-od-id="new-role-btn"
                onClick={() => openRoleDialog()}
              >
                <Icon name="plus" />New role
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md text-xs sm:text-sm font-medium border border-border bg-surface hover:bg-surface-hover transition-colors text-foreground shadow-xs cursor-pointer"
                onClick={() => toast('Role report exported as roles-skyline.csv', 'download')}
              >
                <Icon name="download" />Export roles
              </button>
              <OpenButton
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md text-xs sm:text-sm font-medium bg-accent-strong text-white hover:bg-accent-hover active:bg-accent-active transition-colors shadow-xs cursor-pointer"
                target="dlg-invite"
                data-od-id="invite-btn"
              >
                <Icon name="plus" />Invite member
              </OpenButton>
            </>
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5" data-od-id="roles-strip">
          {roles.map((role) => (
            <Card key={role.id} className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-2 shadow-xs hover:border-border-strong transition-all" data-od-id={role.id}>
              <div className="flex items-center gap-2">
                <Icon name={role.icon} className="text-muted" />
                <strong className="text-[13px] font-semibold text-foreground truncate">{role.name}</strong>
              </div>
              <span className="text-xs text-muted leading-relaxed line-clamp-2">{role.desc}</span>
              <span className="text-[11.5px] text-muted">1 member</span>
              <div className="flex items-center gap-1 mt-auto pt-2 border-t border-border/60">
                <button
                  type="button"
                  className="inline-flex items-center justify-center w-7 h-7 rounded-md text-muted hover:text-foreground hover:bg-surface-hover transition-colors cursor-pointer"
                  aria-label="Edit role"
                  onClick={() => openRoleDialog(role.name, role.desc)}
                >
                  <Icon name="edit" />
                </button>
                {role.deletable && (
                  <button
                    type="button"
                    className="inline-flex items-center justify-center w-7 h-7 rounded-md text-muted hover:text-danger-fg hover:bg-danger-soft transition-colors cursor-pointer"
                    aria-label="Delete role"
                    onClick={() => deleteRole(role)}
                  >
                    <Icon name="trash" />
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>

        <Card className="bg-surface border border-border rounded-xl shadow-xs overflow-hidden p-0 gap-0" data-od-id="members-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:px-5 sm:py-3.5 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">
              Members <span className="font-normal text-muted">· {members.length}</span>
            </h3>
            <SearchToolbar
              query={query}
              onQueryChange={setQuery}
              placeholder="Search members"
              inputClassName="w-full sm:w-56"
            />
          </div>

          <Table id="members-table">
            <TableHeader className="bg-surface-inset/60 text-muted font-semibold border-b border-border">
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-4 py-2.5 whitespace-nowrap text-muted font-semibold">Member</TableHead>
                <TableHead className="px-4 py-2.5 whitespace-nowrap w-44 text-muted font-semibold">Role</TableHead>
                <TableHead className="px-4 py-2.5 whitespace-nowrap text-muted font-semibold">Umbrella access</TableHead>
                <TableHead className="px-4 py-2.5 whitespace-nowrap text-muted font-semibold">Last active</TableHead>
                <TableHead className="px-4 py-2.5 whitespace-nowrap text-muted font-semibold">Status</TableHead>
                <TableHead className="px-4 py-2.5 whitespace-nowrap w-20" />
              </TableRow>
            </TableHeader>
            <TableBody id="members-body" className="divide-y divide-border/60">
              {filtered.map((m) => {
                const statusType = m.statusBadge === 'ok' || m.statusBadge.includes('badge-ok')
                  ? 'ok'
                  : m.statusBadge === 'warn' || m.statusBadge.includes('badge-warn')
                  ? 'warn'
                  : 'neutral';

                return (
                  <TableRow key={m.id} className="hover:bg-surface-hover/30 transition-colors" data-filter-row data-od-id={m.odId}>
                    <TableCell className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <Avatar className={`w-7 h-7 text-[11px] font-bold ${m.avatarMuted ? 'bg-surface-inset text-muted' : 'bg-foreground text-surface'}`}>
                          <AvatarFallback className={m.avatarMuted ? 'bg-surface-inset text-muted' : 'bg-foreground text-surface font-bold text-[11px]'}>
                            {m.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold text-foreground text-xs">{m.name}</div>
                          <div className="text-[11.5px] text-muted">{m.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 whitespace-nowrap">
                      <select
                        className="h-7.5 px-2.5 rounded-md border border-border bg-surface text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50 disabled:bg-surface-inset"
                        data-role-select
                        value={m.role}
                        disabled={m.roleDisabled}
                        onChange={(e) => updateMemberRole(m.id, e.target.value)}
                      >
                        {(m.roleOptions ?? ROLE_OPTIONS).map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </TableCell>
                    <TableCell className="px-4 py-3 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {m.chips.map((c) => (
                          <span
                            key={c.label}
                            className={`text-[11px] px-2 py-0.5 rounded-full border ${
                              c.off
                                ? 'bg-surface text-muted/60 border-border/60 opacity-60'
                                : 'bg-surface-inset text-foreground border-border font-medium'
                            }`}
                          >
                            {c.label}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 whitespace-nowrap text-muted">{m.lastActive}</TableCell>
                    <TableCell className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge status={statusType}>
                        {m.statusLabel}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          type="button"
                          className="inline-flex items-center justify-center w-7 h-7 rounded-md text-muted hover:text-foreground hover:bg-surface-hover transition-colors cursor-pointer"
                          title={m.actionTitle}
                          onClick={() => toast(m.actionToast, m.actionIcon === 'sync' ? 'mail' : m.actionIcon)}
                        >
                          <Icon name={m.actionIcon} />
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center w-7 h-7 rounded-md text-muted hover:text-danger-fg hover:bg-danger-soft transition-colors cursor-pointer"
                          aria-label="Delete member"
                          data-del-member
                          onClick={() => deleteMember(m)}
                        >
                          <Icon name="trash" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {filtered.length === 0 && (
            <EmptyState
              icon="filter"
              title="No members match this search."
              dataOdId="members-empty"
            />
          )}

          <div className="flex items-center justify-end px-4 py-2.5 border-t border-border bg-surface-inset/20 text-xs text-muted">
            <span><span id="members-count" className="font-semibold text-foreground">{count}</span> shown</span>
          </div>
        </Card>

        <Card className="bg-surface border border-border rounded-xl shadow-xs overflow-hidden p-0 gap-0" data-od-id="matrix-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:px-5 sm:py-3.5 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Permission matrix</h3>
            <div className="flex items-center gap-4 text-xs text-muted">
              <span className="inline-flex items-center gap-1.5"><Perm type="f" />Full</span>
              <span className="inline-flex items-center gap-1.5"><Perm type="p" />Limited</span>
              <span className="inline-flex items-center gap-1.5"><Perm type="n" />None</span>
            </div>
          </div>
          <Table data-od-id="perm-matrix">
            <TableHeader className="bg-surface-inset/60 text-muted font-semibold border-b border-border">
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-4 py-2.5 text-left text-muted font-semibold">Capability</TableHead>
                <TableHead className="px-4 py-2.5 text-center text-muted font-semibold">Admin</TableHead>
                <TableHead className="px-4 py-2.5 text-center text-muted font-semibold">Business Analyst</TableHead>
                <TableHead className="px-4 py-2.5 text-center text-muted font-semibold">CX Designer</TableHead>
                <TableHead className="px-4 py-2.5 text-center text-muted font-semibold">Developer</TableHead>
                <TableHead className="px-4 py-2.5 text-center text-muted font-semibold">Viewer</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border/60">
              {MATRIX_ROWS.map((row) => (
                <TableRow key={row.cap} className="hover:bg-surface-hover/30 transition-colors">
                  <TableCell className="px-4 py-2.5 font-medium text-foreground">{row.cap}</TableCell>
                  {row.perms.map((p, i) => (
                    <TableCell key={i} className="px-4 py-2.5 text-center">
                      <Perm type={p} />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      <Dialog id="dlg-invite" data-od-id="invite-dialog">
        <div className="p-4 sm:p-5 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">Invite member</h2>
          <p className="text-xs text-muted mt-0.5">They get an email with a sign-in link. Access starts on first sign-in.</p>
        </div>
        <div className="p-4 sm:p-5 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5" htmlFor="inv-name">Full name</label>
            <input className="w-full h-9 px-3 rounded-md border border-border bg-surface text-xs sm:text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent" id="inv-name" placeholder="e.g. Sneha Kulkarni" value={invite.name} onChange={(e) => setInvite({ ...invite, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5" htmlFor="inv-email">Work email</label>
            <input className="w-full h-9 px-3 rounded-md border border-border bg-surface text-xs sm:text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent" id="inv-email" type="email" placeholder="name@company.com" value={invite.email} onChange={(e) => setInvite({ ...invite, email: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5" htmlFor="inv-role">Role</label>
            <select className="w-full h-9 px-3 rounded-md border border-border bg-surface text-xs sm:text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent" id="inv-role" value={invite.role} onChange={(e) => setInvite({ ...invite, role: e.target.value })}>
              <option>Business Analyst</option>
              <option>CX Designer</option>
              <option>Developer</option>
              <option>Viewer</option>
              <option>Admin</option>
            </select>
          </div>
          <div>
            <span className="block text-xs font-semibold text-foreground mb-1.5">Umbrella access</span>
            <MultiChips labels={['Analysis', 'Design', 'Develop']} selected={inviteUmbrellas} onChange={setInviteUmbrellas} odId="inv-umbrellas" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 p-4 border-t border-border bg-surface-inset/30">
          <CloseButton className="inline-flex items-center justify-center h-8 px-3 rounded-md text-xs font-medium border border-border bg-surface hover:bg-surface-hover text-foreground transition-colors cursor-pointer">Cancel</CloseButton>
          <button type="button" className="inline-flex items-center justify-center h-8 px-3.5 rounded-md text-xs font-medium bg-accent-strong text-white hover:bg-accent-hover transition-colors shadow-xs cursor-pointer" id="inv-send" data-od-id="invite-send" onClick={sendInvite}>Send invite</button>
        </div>
      </Dialog>

      <Dialog id="dlg-role" data-od-id="role-dialog">
        <div className="p-4 sm:p-5 border-b border-border">
          <h2 className="text-base font-semibold text-foreground" id="role-title">{editingRole ? `Edit ${editingRole}` : 'New role'}</h2>
          <p className="text-xs text-muted mt-0.5">Roles decide which umbrella a teammate can work in and which pipeline actions they can take. Changes are written to the audit log.</p>
        </div>
        <div className="p-4 sm:p-5 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5" htmlFor="role-name">Role name</label>
            <input className="w-full h-9 px-3 rounded-md border border-border bg-surface text-xs sm:text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent" id="role-name" placeholder="e.g. QA Reviewer" value={roleForm.name} onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5" htmlFor="role-desc">Description</label>
            <input className="w-full h-9 px-3 rounded-md border border-border bg-surface text-xs sm:text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent" id="role-desc" placeholder="What this role can do" value={roleForm.desc} onChange={(e) => setRoleForm({ ...roleForm, desc: e.target.value })} />
          </div>
          <div>
            <span className="block text-xs font-semibold text-foreground mb-1.5">Umbrella access</span>
            <MultiChips labels={['Analysis', 'Design', 'Develop']} selected={roleUmbrellas} onChange={setRoleUmbrellas} odId="role-umbs" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-foreground mb-2">Capabilities</span>
            <div className="flex flex-col gap-2 max-h-44 overflow-y-auto pr-1">
              <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer"><input type="checkbox" className="rounded border-border accent-accent" defaultChecked /> Upload data &amp; run intent pipeline</label>
              <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer"><input type="checkbox" className="rounded border-border accent-accent" defaultChecked /> Edit / merge intents and clusters</label>
              <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer"><input type="checkbox" className="rounded border-border accent-accent" /> Edit process maps &amp; UML diagrams</label>
              <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer"><input type="checkbox" className="rounded border-border accent-accent" /> Generate agent builds</label>
              <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer"><input type="checkbox" className="rounded border-border accent-accent" /> Deploy to staging / production</label>
              <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer"><input type="checkbox" className="rounded border-border accent-accent" /> View audit log</label>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 p-4 border-t border-border bg-surface-inset/30">
          <CloseButton className="inline-flex items-center justify-center h-8 px-3 rounded-md text-xs font-medium border border-border bg-surface hover:bg-surface-hover text-foreground transition-colors cursor-pointer">Cancel</CloseButton>
          <button type="button" className="inline-flex items-center justify-center h-8 px-3.5 rounded-md text-xs font-medium bg-accent-strong text-white hover:bg-accent-hover transition-colors shadow-xs cursor-pointer" id="role-save" data-od-id="role-save" onClick={saveRole}>Save role</button>
        </div>
      </Dialog>

      {confirm && (
        <Dialog id="dlg-confirm" data-od-id="confirm-dialog">
          <div className="p-4 sm:p-5 border-b border-border">
            <h2 className="text-base font-semibold text-foreground" id="cf-title">{confirm.title}</h2>
            <p className="text-xs text-muted mt-0.5" id="cf-body">{confirm.body}</p>
          </div>
          <div className="flex items-center justify-end gap-2 p-4 border-t border-border bg-surface-inset/30">
            <CloseButton className="inline-flex items-center justify-center h-8 px-3 rounded-md text-xs font-medium border border-border bg-surface hover:bg-surface-hover text-foreground transition-colors cursor-pointer" onClick={() => setConfirm(null)}>Cancel</CloseButton>
            <button
              type="button"
              className="inline-flex items-center justify-center h-8 px-3.5 rounded-md text-xs font-medium bg-danger-soft text-danger-fg border border-danger/20 hover:bg-danger-soft/80 transition-colors shadow-xs cursor-pointer"
              id="cf-ok"
              data-od-id="confirm-ok"
              onClick={confirm.onOk}
            >
              {confirm.okLabel}
            </button>
          </div>
        </Dialog>
      )}
    </AppShell>
  );
}
