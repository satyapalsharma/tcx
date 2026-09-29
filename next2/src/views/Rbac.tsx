'use client';

import { useState } from 'react';
import { AppShell } from '../components/AppShell';
import { Icon, type IconName } from '../components/Icon';
import { CloseButton, Dialog, OpenButton, useOverlay } from '../components/Overlay';
import { useTextFilter } from '../components/ui';
import { useToast } from '../components/Toast';
import { useReveal } from '../hooks/useReveal';

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
    lastActive: 'now', statusLabel: 'Active', statusBadge: 'badge badge-ok',
    actionTitle: 'Reset password', actionIcon: 'key', actionToast: 'Reset link sent to Priya',
    initials: 'PN',
  },
  {
    id: 'riya', odId: 'mem-riya', name: 'Riya Menon', email: 'riya.m@skyline-broadband.com', role: 'Business Analyst',
    chips: [{ label: 'Analysis' }, { label: 'Design · view', off: true }, { label: 'Develop · —', off: true }],
    lastActive: '12 min ago', statusLabel: 'Active', statusBadge: 'badge badge-ok',
    actionTitle: 'Reset password', actionIcon: 'key', actionToast: 'Reset link sent to Riya',
    initials: 'RM',
  },
  {
    id: 'devika', odId: 'mem-devika', name: 'Devika Sharma', email: 'devika.s@skyline-broadband.com', role: 'CX Designer',
    chips: [{ label: 'Analysis · view', off: true }, { label: 'Design' }, { label: 'Develop · —', off: true }],
    lastActive: '1 h ago', statusLabel: 'Active', statusBadge: 'badge badge-ok',
    actionTitle: 'Reset password', actionIcon: 'key', actionToast: 'Reset link sent to Devika',
    initials: 'DS',
  },
  {
    id: 'arjun', odId: 'mem-arjun', name: 'Arjun Shah', email: 'arjun.sh@skyline-broadband.com', role: 'Developer',
    chips: [{ label: 'Analysis · —', off: true }, { label: 'Design · view', off: true }, { label: 'Develop' }],
    lastActive: '24 min ago', statusLabel: 'Active', statusBadge: 'badge badge-ok',
    actionTitle: 'Reset password', actionIcon: 'key', actionToast: 'Reset link sent to Arjun',
    initials: 'AS',
  },
  {
    id: 'karan', odId: 'mem-karan', name: 'Karan Mehta', email: 'k.mehhta@partner.skylinebb.com', role: 'Viewer',
    chips: [{ label: 'Analysis · view', off: true }, { label: 'Design · view', off: true }, { label: 'Develop · view', off: true }],
    lastActive: '2 days ago', statusLabel: 'Invite pending', statusBadge: 'badge badge-warn',
    actionTitle: 'Resend invite', actionIcon: 'sync', actionToast: 'Invite resent to Karan',
    initials: 'KM',
  },
  {
    id: 'svc', odId: 'mem-svc', name: 'svc-transform-bot', email: 'service account · deploy CI', role: 'Developer',
    roleDisabled: true, roleOptions: ['Developer'], service: true,
    chips: [{ label: 'Develop · deploy only', off: true }],
    lastActive: 'via CI', statusLabel: 'Service acct', statusBadge: 'badge',
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
  return <span className={`perm perm-${type}`} />;
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
    <div className="row" style={{ gap: 6, flexWrap: 'wrap' }} data-chips-multi data-od-id={odId}>
      {labels.map((label) => (
        <button
          key={label}
          type="button"
          className="chip"
          aria-pressed={selected.includes(label)}
          onClick={() => toggle(label)}
        >
          {label}
        </button>
      ))}
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
  const [roleUmbrellas, setRoleUmbrellas] = useState(['Analysis']);
  const [roleForm, setRoleForm] = useState({ name: '', desc: '' });
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ title: string; body: string; okLabel: string; onOk: () => void } | null>(null);

  const askConfirm = (title: string, body: string, okLabel: string, onOk: () => void) => {
    setConfirm({ title, body, okLabel, onOk });
    open('dlg-confirm');
  };

  const updateMemberRole = (id: string, role: string) => {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, role } : m)));
    toast('Role updated — applies on next sign-in', 'users');
  };

  const sendInvite = () => {
    const name = invite.name.trim() || 'New member';
    const email = invite.email.trim() || '—';
    const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || 'NM';
    setMembers((prev) => [...prev, {
      id: String(Date.now()),
      odId: `mem-${Date.now()}`,
      name,
      email,
      role: invite.role,
      roleDisabled: true,
      roleOptions: [invite.role],
      chips: [{ label: 'Umbrella · pending', off: true }],
      lastActive: '—',
      statusLabel: 'Invite pending',
      statusBadge: 'badge badge-warn',
      actionTitle: 'Resend invite',
      actionIcon: 'sync',
      actionToast: 'Invite resent',
      initials,
    }]);
    close();
    toast(`Invite sent to ${email}`, 'mail');
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
      <div className="page" data-od-id="rbac-page">
        <div className="page-h">
          <div style={{ flex: 1 }}>
            <h1 data-od-id="page-title">Team &amp; roles</h1>
            <p className="sub">Roles map to umbrellas — Analysts own Analysis, Designers own Design, Developers own Develop. Everyone else watches. Access changes apply on next sign-in and are logged in the audit log.</p>
          </div>
          <button type="button" className="btn" id="new-role-btn" data-od-id="new-role-btn" onClick={() => openRoleDialog()}><Icon name="plus" />New role</button>
          <button type="button" className="btn" onClick={() => toast('Role report exported as roles-skyline.csv', 'download')}><Icon name="download" />Export roles</button>
          <OpenButton className="btn btn-primary" target="dlg-invite" data-od-id="invite-btn"><Icon name="plus" />Invite member</OpenButton>
        </div>

        <div className="roles-grid" data-od-id="roles-strip">
          {roles.map((role) => (
            <div key={role.id} className="card role-card" data-od-id={role.id}>
              <div className="row" style={{ gap: 7 }}><Icon name={role.icon} /><strong style={{ fontSize: 13 }}>{role.name}</strong></div>
              <span className="muted" style={{ fontSize: 12 }}>{role.desc}</span>
              <span className="hint" style={{ fontSize: '11.5px' }}>1 member</span>
              <div className="role-acts" style={{ marginTop: 'auto' }}>
                <button type="button" className="icon-btn" aria-label="Edit role" onClick={() => openRoleDialog(role.name, role.desc)}><Icon name="edit" /></button>
                {role.deletable && (
                  <button type="button" className="icon-btn" aria-label="Delete role" onClick={() => deleteRole(role)}><Icon name="trash" /></button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="card" data-od-id="members-card">
          <div className="card-h" style={{ justifyContent: 'space-between' }}>
            <h3>Members <span className="muted" style={{ fontWeight: 460 }}>· {members.length}</span></h3>
            <div style={{ position: 'relative' }}>
              <Icon name="search" style={{ position: 'absolute', left: 9, top: 8, color: 'var(--muted)' }} />
              <input
                className="input"
                style={{ height: 30, paddingLeft: 30, width: 220 }}
                placeholder="Search members"
                aria-label="Search members"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
          <table className="table" id="members-table" style={{ marginTop: 8 }}>
            <thead>
              <tr>
                <th>Member</th>
                <th style={{ width: 170 }}>Role</th>
                <th>Umbrella access</th>
                <th>Last active</th>
                <th>Status</th>
                <th style={{ width: 84 }} />
              </tr>
            </thead>
            <tbody id="members-body">
              {filtered.map((m) => (
                <tr key={m.id} data-filter-row data-od-id={m.odId}>
                  <td>
                    <div className="row" style={{ gap: 9 }}>
                      <span className="avatar avatar-sm" style={m.avatarMuted ? { background: 'var(--muted)' } : undefined}>{m.initials}</span>
                      <div>
                        <div style={{ fontWeight: 540 }}>{m.name}</div>
                        <div className="hint" style={{ fontSize: '11.5px' }}>{m.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <select
                      className="input"
                      style={{ height: 30 }}
                      data-role-select
                      value={m.role}
                      disabled={m.roleDisabled}
                      onChange={(e) => updateMemberRole(m.id, e.target.value)}
                    >
                      {(m.roleOptions ?? ROLE_OPTIONS).map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td>
                    {m.chips.map((c) => (
                      <span key={c.label} className={`um-chip${c.off ? ' off' : ''}`}>{c.label}</span>
                    ))}
                  </td>
                  <td className="muted">{m.lastActive}</td>
                  <td><span className={m.statusBadge}><span className="dot" />{m.statusLabel}</span></td>
                  <td>
                    <div className="row" style={{ gap: 2 }}>
                      <button type="button" className="icon-btn" title={m.actionTitle} onClick={() => toast(m.actionToast, m.actionIcon === 'sync' ? 'mail' : m.actionIcon)}><Icon name={m.actionIcon} /></button>
                      <button type="button" className="icon-btn" aria-label="Delete member" data-del-member onClick={() => deleteMember(m)}><Icon name="trash" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="empty" id="members-empty" data-od-id="members-empty">
              <div style={{ marginBottom: 8 }}><Icon name="filter" large /></div>
              No members match this search.
            </div>
          )}
          <div className="row" style={{ padding: '10px 16px', justifyContent: 'flex-end' }}>
            <span className="hint"><span id="members-count">{count}</span> shown</span>
          </div>
        </div>

        <div className="card" style={{ marginTop: 16 }} data-od-id="matrix-card">
          <div className="card-h" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <h3>Permission matrix</h3>
            <div className="pm-legend">
              <span className="row"><Perm type="f" />Full</span>
              <span className="row"><Perm type="p" />Limited</span>
              <span className="row"><Perm type="n" />None</span>
            </div>
          </div>
          <table className="table matrix" style={{ marginTop: 8 }} data-od-id="perm-matrix">
            <thead>
              <tr>
                <th>Capability</th>
                <th>Admin</th>
                <th>Business Analyst</th>
                <th>CX Designer</th>
                <th>Developer</th>
                <th>Viewer</th>
              </tr>
            </thead>
            <tbody>
              {MATRIX_ROWS.map((row) => (
                <tr key={row.cap}>
                  <td>{row.cap}</td>
                  {row.perms.map((p, i) => <td key={i}><Perm type={p} /></td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog id="dlg-invite" data-od-id="invite-dialog">
        <div className="dialog-h">
          <h2>Invite member</h2>
          <p className="hint">They get an email with a sign-in link. Access starts on first sign-in.</p>
        </div>
        <div className="dialog-b">
          <div className="field">
            <label className="label" htmlFor="inv-name">Full name</label>
            <input className="input" id="inv-name" placeholder="e.g. Sneha Kulkarni" value={invite.name} onChange={(e) => setInvite({ ...invite, name: e.target.value })} />
          </div>
          <div className="field">
            <label className="label" htmlFor="inv-email">Work email</label>
            <input className="input" id="inv-email" type="email" placeholder="name@company.com" value={invite.email} onChange={(e) => setInvite({ ...invite, email: e.target.value })} />
          </div>
          <div className="field">
            <label className="label" htmlFor="inv-role">Role</label>
            <select className="input" id="inv-role" value={invite.role} onChange={(e) => setInvite({ ...invite, role: e.target.value })}>
              <option>Business Analyst</option>
              <option>CX Designer</option>
              <option>Developer</option>
              <option>Viewer</option>
              <option>Admin</option>
            </select>
          </div>
          <div className="field">
            <span className="label">Umbrella access</span>
            <MultiChips labels={['Analysis', 'Design', 'Develop']} selected={inviteUmbrellas} onChange={setInviteUmbrellas} odId="inv-umbrellas" />
          </div>
        </div>
        <div className="dialog-f">
          <CloseButton className="btn">Cancel</CloseButton>
          <button type="button" className="btn btn-primary" id="inv-send" data-od-id="invite-send" onClick={sendInvite}>Send invite</button>
        </div>
      </Dialog>

      <Dialog id="dlg-role" data-od-id="role-dialog">
        <div className="dialog-h">
          <h2 id="role-title">{editingRole ? `Edit ${editingRole}` : 'New role'}</h2>
          <p className="hint">Roles decide which umbrella a teammate can work in and which pipeline actions they can take. Changes are written to the audit log.</p>
        </div>
        <div className="dialog-b">
          <div className="field">
            <label className="label" htmlFor="role-name">Role name</label>
            <input className="input" id="role-name" placeholder="e.g. QA Reviewer" value={roleForm.name} onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })} />
          </div>
          <div className="field">
            <label className="label" htmlFor="role-desc">Description</label>
            <input className="input" id="role-desc" placeholder="What this role can do" value={roleForm.desc} onChange={(e) => setRoleForm({ ...roleForm, desc: e.target.value })} />
          </div>
          <div className="field">
            <span className="label">Umbrella access</span>
            <MultiChips labels={['Analysis', 'Design', 'Develop']} selected={roleUmbrellas} onChange={setRoleUmbrellas} odId="role-umbs" />
          </div>
          <div className="field">
            <span className="label">Capabilities</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 170, overflowY: 'auto', paddingRight: 4 }}>
              <label className="row" style={{ gap: 8, fontSize: '12.5px' }}><input type="checkbox" defaultChecked /> Upload data &amp; run intent pipeline</label>
              <label className="row" style={{ gap: 8, fontSize: '12.5px' }}><input type="checkbox" defaultChecked /> Edit / merge intents and clusters</label>
              <label className="row" style={{ gap: 8, fontSize: '12.5px' }}><input type="checkbox" /> Edit process maps &amp; UML diagrams</label>
              <label className="row" style={{ gap: 8, fontSize: '12.5px' }}><input type="checkbox" /> Generate agent builds</label>
              <label className="row" style={{ gap: 8, fontSize: '12.5px' }}><input type="checkbox" /> Deploy to staging / production</label>
              <label className="row" style={{ gap: 8, fontSize: '12.5px' }}><input type="checkbox" /> View audit log</label>
            </div>
          </div>
        </div>
        <div className="dialog-f">
          <CloseButton className="btn">Cancel</CloseButton>
          <button type="button" className="btn btn-primary" id="role-save" data-od-id="role-save" onClick={saveRole}>Save role</button>
        </div>
      </Dialog>

      {confirm && (
        <Dialog id="dlg-confirm" data-od-id="confirm-dialog">
          <div className="dialog-h">
            <h2 id="cf-title">{confirm.title}</h2>
            <p className="hint" id="cf-body">{confirm.body}</p>
          </div>
          <div className="dialog-f">
            <CloseButton className="btn" onClick={() => setConfirm(null)}>Cancel</CloseButton>
            <button
              type="button"
              className="btn"
              id="cf-ok"
              style={{ color: 'var(--danger-fg)', borderColor: 'oklch(87% 0.05 27)', background: 'var(--danger-soft)' }}
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
