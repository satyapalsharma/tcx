'use client';

import { useMemo, useState } from 'react';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { CloseButton, Dialog, useOverlay } from '../components/Overlay';
import { useToast } from '../components/Toast';
import { useReveal } from '../hooks/useReveal';
import { useApp, type Member, type MemberRole } from '@/context/AppContext';
import { PageHeader, EmptyState, SearchToolbar, SelectField } from '@/components/common';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

export default function Rbac() {
  useReveal();
  const toast = useToast();
  const { open, close } = useOverlay();
  const { currentOrg, setIsInviteOpen, membersForCurrentOrg, updateMemberRole, removeMember } = useApp();
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);

  const people = useMemo(() => membersForCurrentOrg.filter((member) => member.status !== 'service'), [membersForCurrentOrg]);
  const filteredMembers = people.filter((member) =>
    !search.trim() || `${member.name} ${member.email}`.toLowerCase().includes(search.trim().toLowerCase()),
  );

  const askDelete = (member: Member) => {
    setDeleteTarget(member);
    open('dlg-delete-member');
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    removeMember(deleteTarget.id);
    toast(`Removed ${deleteTarget.name} from organization`, 'trash');
    setDeleteTarget(null);
    close();
  };

  return (
    <AppShell crumb="Members">
      <div className="p-4 sm:p-6 lg:p-7 max-w-[1240px] mx-auto w-full pb-16 space-y-6" data-od-id="rbac-page">
        <PageHeader
          title="Members"
          description={`People who can access ${currentOrg.name}.`}
          dataOdId="page-title"
          actions={<Button type="button" variant="accent" className="gap-2 h-9 px-3.5 text-xs sm:text-sm font-medium cursor-pointer" onClick={() => setIsInviteOpen(true)} data-od-id="invite-member-btn"><Icon name="plus" className="w-4 h-4" />Invite member</Button>}
        />

        {/* 3 Core SaaS Team Personas Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card className="p-4 bg-surface border border-border rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-7 h-7 rounded-lg bg-surface-inset grid place-items-center text-muted"><Icon name="search" className="w-3.5 h-3.5" /></span>
              <span className="text-xs font-semibold text-foreground">Business Analyst</span>
            </div>
            <p className="text-[11px] text-muted leading-relaxed">Extracts customer intents, resolutions, pain points, and builds L1 &rarr; L2 &rarr; L3 taxonomy clusters.</p>
          </Card>
          <Card className="p-4 bg-surface border border-border rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-7 h-7 rounded-lg bg-surface-inset grid place-items-center text-muted"><Icon name="flow" className="w-3.5 h-3.5" /></span>
              <span className="text-xs font-semibold text-foreground">CX Designer</span>
            </div>
            <p className="text-[11px] text-muted leading-relaxed">Designs and edits visual process flow maps, verifies UML sequence logic, and hands off to development.</p>
          </Card>
          <Card className="p-4 bg-surface border border-border rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-7 h-7 rounded-lg bg-surface-inset grid place-items-center text-muted"><Icon name="code" className="w-3.5 h-3.5" /></span>
              <span className="text-xs font-semibold text-foreground">Developer</span>
            </div>
            <p className="text-[11px] text-muted leading-relaxed">Generates production agent code (Google ADK, Bedrock, LangGraph, CX Studio), configures guardrails, and tests.</p>
          </Card>
        </div>

        <Card className="bg-surface border border-border rounded-xl shadow-xs overflow-hidden p-0 gap-0">
          <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">People</h3>
              <p className="text-xs text-muted">Manage organization access and team roles.</p>
            </div>
            <SearchToolbar query={search} onQueryChange={setSearch} placeholder="Search by name or email" count={filteredMembers.length} countLabel="people" />
          </div>

          {filteredMembers.length ? (
            <div className="overflow-x-auto">
              <Table className="md:min-w-[620px]">
                <TableHeader className="bg-surface-inset/50 border-b border-border">
                  <TableRow className="text-[11px] font-semibold uppercase tracking-wider text-muted hover:bg-transparent">
                    <TableHead className="px-4 py-3 text-muted">Person</TableHead>
                    <TableHead className="px-4 py-3 text-muted">Role</TableHead>
                    <TableHead className="px-4 py-3 text-right text-muted">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border/60">
                  {filteredMembers.map((member) => (
                    <TableRow key={member.id} className="hover:bg-surface-hover/40 transition-colors">
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8 rounded-full border border-border text-xs font-semibold"><AvatarFallback className="bg-foreground text-background">{member.initials}</AvatarFallback></Avatar>
                          <div className="min-w-0">
                            <div className="font-semibold text-xs text-foreground">{member.name}{member.status === 'invited' && <span className="ml-2 font-normal text-muted">Invited</span>}</div>
                            <div className="text-[11px] text-muted truncate">{member.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <SelectField value={member.role} onValueChange={(role) => { updateMemberRole(member.id, role as MemberRole); toast(`Role changed to ${role}`, 'check'); }} aria-label={`Role for ${member.name}`} className="h-8 w-[168px]" options={['Admin', 'Business Analyst', 'CX Designer', 'Developer', 'Viewer']} />
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right">
                        <Button type="button" variant="ghost" size="sm" className="text-muted hover:text-danger-fg hover:bg-danger-soft cursor-pointer" aria-label={`Remove ${member.name}`} onClick={() => askDelete(member)}>
                          <Icon name="trash" className="w-3.5 h-3.5 mr-1.5" />Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : people.length === 0 ? (
            <EmptyState icon="users" title="No members yet" description="Invite someone to give them access to this organization." action={<Button type="button" variant="accent" size="sm" className="mt-2" onClick={() => setIsInviteOpen(true)}>Invite a member</Button>} />
          ) : (
            <EmptyState icon="users" title="No people found" description="Try a different name or email address." action={<Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => setSearch('')}>Clear search</Button>} />
          )}
        </Card>
      </div>

      <Dialog id="dlg-delete-member">
        <div className="p-5 border-b border-border">
          <h2 className="text-base font-semibold text-foreground tracking-tight">Remove member?</h2>
          <p className="text-xs text-muted mt-1">They will lose access to {currentOrg.name}.</p>
        </div>
        <div className="p-5 text-xs text-foreground">Remove <strong className="font-semibold">{deleteTarget?.name}</strong> ({deleteTarget?.email}) from this organization?</div>
        <div className="p-4 border-t border-border bg-surface-inset/40 flex items-center justify-end gap-2.5 rounded-b-xl">
          <CloseButton variant="outline" className="px-3.5 h-8.5 text-xs">Cancel</CloseButton>
          <Button type="button" variant="destructive" className="px-3.5 h-8.5 text-xs" onClick={confirmDelete}>Remove member</Button>
        </div>
      </Dialog>
    </AppShell>
  );
}
