'use client';

import { useMemo, useState } from 'react';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { CloseButton, Dialog, useOverlay } from '../components/Overlay';
import { useToast } from '../components/Toast';
import { useApp, type Member, type MemberRole } from '@/context/AppContext';
import { usePipeline } from '@/context/PipelineContext';
import { PageHeader, EmptyState, SearchToolbar, SelectField } from '@/components/common';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

const ROLE_OPTIONS: MemberRole[] = ['Admin', 'Business Analyst', 'CX Designer', 'Developer', 'Viewer'];
const ROLE_SUMMARIES: Record<MemberRole, string> = {
  Admin: 'Manage organization settings, members, and all projects.',
  'Business Analyst': 'Explore customer intent, analyze signals, and organize taxonomies.',
  'CX Designer': 'Create and revise process maps and service flow designs.',
  Developer: 'Build agent drafts from approved design artifacts.',
  Viewer: 'View project work and shared results.',
};

export default function Rbac() {
  const toast = useToast();
  const { open, close } = useOverlay();
  const { currentOrg, setIsInviteOpen, membersForCurrentOrg, updateMemberRole, removeMember } = useApp();
  const { recordEvent } = usePipeline();
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);
  const people = useMemo(() => membersForCurrentOrg.filter((member) => member.status !== 'service'), [membersForCurrentOrg]);
  const filteredMembers = people.filter((member) => !search.trim() || `${member.name} ${member.email}`.toLowerCase().includes(search.trim().toLowerCase()));
  const admins = people.filter((member) => member.role === 'Admin');

  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.role === 'Admin' && admins.length <= 1) {
      toast('Keep at least one organization admin', 'warn');
      setDeleteTarget(null);
      close();
      return;
    }
    removeMember(deleteTarget.id);
    recordEvent('Removed organization member', `Removed ${deleteTarget.email} from ${currentOrg.name}.`);
    toast(`Removed ${deleteTarget.name} from organization`, 'trash');
    setDeleteTarget(null);
    close();
  };

  return (
    <AppShell crumb="Members">
      <main className="p-5 sm:p-8 max-w-[1280px] mx-auto w-full pb-16 space-y-6" data-od-id="rbac-page">
        <PageHeader title="Members & roles" description={`Manage who can access ${currentOrg.name}.`} dataOdId="page-title" actions={<Button variant="accent" className="gap-2" onClick={() => setIsInviteOpen(true)}><Icon name="plus" className="h-4 w-4" />Invite member</Button>} />
        <Card className="overflow-hidden p-0">
          <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div><h2 className="text-sm font-semibold">People <span className="ml-1 font-normal text-muted">{filteredMembers.length}</span></h2><p className="mt-1 text-xs text-muted">Role changes apply across this organization.</p></div>
            <SearchToolbar query={search} onQueryChange={setSearch} placeholder="Search by name or email" count={filteredMembers.length} countLabel="people" />
          </div>
          {filteredMembers.length ? <div className="overflow-x-auto"><Table className="md:min-w-[650px]">
            <TableHeader><TableRow><TableHead className="px-4">Person</TableHead><TableHead>Role</TableHead><TableHead>Projects</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>{filteredMembers.map((member) => {
              const lastAdmin = member.role === 'Admin' && admins.length <= 1;
              return <TableRow key={member.id}>
                <TableCell className="px-4 py-3"><div className="flex items-center gap-3"><Avatar className="h-8 w-8 border border-border text-xs"><AvatarFallback className="bg-accent-soft text-accent-strong">{member.initials}</AvatarFallback></Avatar><div className="min-w-0"><p className="truncate text-sm font-medium">{member.name}{member.status === 'invited' && <span className="ml-2 text-xs font-normal text-muted">Invited</span>}</p><p className="truncate text-xs text-muted">{member.email}</p></div></div></TableCell>
                <TableCell><SelectField value={member.role} onValueChange={(value) => { const role = value as MemberRole; if (role === member.role) return; if (member.role === 'Admin' && admins.length <= 1) { toast('Keep at least one organization admin', 'warn'); return; } updateMemberRole(member.id, role); recordEvent('Changed member role', `${member.name} changed from ${member.role} to ${role}.`); toast(`Role changed to ${role}`, 'check'); }} aria-label={`Role for ${member.name}`} className="h-8 w-[168px]" options={ROLE_OPTIONS} /></TableCell>
                <TableCell className="text-xs text-muted">{member.workspaces}</TableCell>
                <TableCell className="text-right"><Button variant="ghost" size="sm" disabled={lastAdmin} className="text-muted hover:text-danger-fg" aria-label={`Remove ${member.name}`} onClick={() => { setDeleteTarget(member); open('dlg-delete-member'); }}><Icon name="trash" className="mr-1.5 h-3.5 w-3.5" />Remove</Button></TableCell>
              </TableRow>;
            })}</TableBody>
          </Table></div> : people.length === 0 ? <EmptyState icon="users" title="No members yet" description="Invite someone to give them access to this organization." action={<Button variant="accent" size="sm" onClick={() => setIsInviteOpen(true)}>Invite a member</Button>} /> : <EmptyState icon="users" title="No people found" description="Try a different name or email address." action={<Button variant="outline" size="sm" onClick={() => setSearch('')}>Clear search</Button>} />}
        </Card>
        <details className="group rounded-xl border border-border bg-surface px-4 py-3.5">
          <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium">Roles & permissions<Icon name="chev" className="h-4 w-4 text-muted transition-transform group-open:rotate-180" /></summary>
          <p className="mt-2 text-xs text-muted">Roles describe the work each teammate can do in this demo. They are product guidance, not enforced access controls.</p>
          <div className="mt-4 divide-y divide-border">{ROLE_OPTIONS.map((role) => <div key={role} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-start sm:gap-5"><span className="w-40 shrink-0 text-sm font-medium">{role}</span><span className="text-sm text-muted">{ROLE_SUMMARIES[role]}</span></div>)}</div>
        </details>
      </main>
      <Dialog id="dlg-delete-member"><div className="border-b border-border p-5"><h2 className="text-base font-semibold">Remove member?</h2><p className="mt-1 text-xs text-muted">They will lose access to {currentOrg.name}.</p></div><div className="p-5 text-sm">Remove <strong>{deleteTarget?.name}</strong> ({deleteTarget?.email}) from this organization?</div><div className="flex justify-end gap-2 border-t border-border bg-surface-inset/40 p-4"><CloseButton variant="outline">Cancel</CloseButton><Button variant="destructive" onClick={confirmDelete}>Remove member</Button></div></Dialog>
    </AppShell>
  );
}
