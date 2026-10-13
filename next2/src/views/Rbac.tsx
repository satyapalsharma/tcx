'use client';

import { useMemo, useState } from 'react';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { useToast } from '../components/Toast';
import { useApp, type MemberRole } from '@/context/AppContext';
import { usePipeline } from '@/context/PipelineContext';
import {
  PageHeader,
  EmptyState,
  SearchToolbar,
  SelectField,
} from '@/components/common';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Dialog as ShadcnDialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const ROLE_OPTIONS: MemberRole[] = [
  'Admin',
  'Business Analyst',
  'CX Designer',
  'Developer',
  'Viewer',
];
const ROLE_SUMMARIES: Record<MemberRole, string> = {
  Admin: 'Manage organization settings, members, and all projects.',
  'Business Analyst':
    'Explore customer intent, analyze signals, and organize taxonomies.',
  'CX Designer': 'Create and revise process maps and service flow designs.',
  Developer: 'Build agent drafts from approved design artifacts.',
  Viewer: 'View project work and shared results.',
};

export default function Rbac() {
  const toast = useToast();
  const {
    currentOrg,
    setIsInviteOpen,
    membersForCurrentOrg,
    updateMemberRole,
    removeMember,
  } = useApp();
  const { recordEvent } = usePipeline();
  const [search, setSearch] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const people = useMemo(
    () => membersForCurrentOrg.filter((member) => member.status !== 'service'),
    [membersForCurrentOrg],
  );
  const filteredMembers = people.filter(
    (member) =>
      !search.trim() ||
      `${member.name} ${member.email}`
        .toLowerCase()
        .includes(search.trim().toLowerCase()),
  );
  const admins = people.filter((member) => member.role === 'Admin');
  const deleteTarget = people.find((member) => member.id === deleteTargetId);

  const confirmDelete = () => {
    if (!deleteTarget) {
      setIsDeleteDialogOpen(false);
      return;
    }
    if (deleteTarget.role === 'Admin' && admins.length <= 1) {
      toast('Keep at least one organization admin', 'warn');
      setDeleteTargetId(null);
      setIsDeleteDialogOpen(false);
      return;
    }
    removeMember(deleteTarget.id);
    recordEvent(
      'Removed organization member',
      `Removed ${deleteTarget.email} from ${currentOrg.name}.`,
    );
    toast(`Removed ${deleteTarget.name} from organization`, 'trash');
    setDeleteTargetId(null);
    setIsDeleteDialogOpen(false);
  };

  return (
    <AppShell crumb="Members">
      <div
        className="p-5 sm:p-8 max-w-[1280px] mx-auto w-full pb-16 space-y-6"
        data-od-id="rbac-page"
      >
        <PageHeader
          title="Members & roles"
          description={`Manage who can access ${currentOrg.name}.`}
          dataOdId="page-title"
          actions={
            <Button
              variant="accent"
              className="gap-2"
              onClick={() => setIsInviteOpen(true)}
            >
              <Icon name="plus" className="h-4 w-4" />
              Invite member
            </Button>
          }
        />
        <Card className="overflow-hidden p-0">
          <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold">
                People{' '}
                <span className="ml-1 font-normal text-muted">
                  {filteredMembers.length}
                </span>
              </h2>
              <p className="mt-1 text-xs text-muted">
                Role changes apply across this organization.
              </p>
            </div>
            <SearchToolbar
              query={search}
              onQueryChange={setSearch}
              placeholder="Search by name or email"
              count={filteredMembers.length}
              countLabel="people"
            />
          </div>
          {filteredMembers.length ? (
            <div className="overflow-x-auto">
              <Table className="md:min-w-[650px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-4">Person</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Projects</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => {
                    const lastAdmin =
                      member.role === 'Admin' && admins.length <= 1;
                    return (
                      <TableRow key={member.id}>
                        <TableCell className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8 border border-border text-xs">
                              <AvatarFallback className="bg-accent-soft text-accent-strong">
                                {member.initials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">
                                {member.name}
                                {member.status === 'invited' && (
                                  <span className="ml-2 text-xs font-normal text-muted">
                                    Invited
                                  </span>
                                )}
                              </p>
                              <p className="truncate text-xs text-muted">
                                {member.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <SelectField
                            value={member.role}
                            onValueChange={(value) => {
                              const role = value as MemberRole;
                              if (role === member.role) return;
                              if (
                                member.role === 'Admin' &&
                                admins.length <= 1
                              ) {
                                toast(
                                  'Keep at least one organization admin',
                                  'warn',
                                );
                                return;
                              }
                              updateMemberRole(member.id, role);
                              recordEvent(
                                'Changed member role',
                                `${member.name} changed from ${member.role} to ${role}.`,
                              );
                              toast(`Role changed to ${role}`, 'check');
                            }}
                            aria-label={`Role for ${member.name}`}
                            className="h-8 w-[168px]"
                            options={ROLE_OPTIONS}
                          />
                        </TableCell>
                        <TableCell className="text-xs text-muted">
                          {member.workspaces}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={lastAdmin}
                            className="text-muted hover:text-danger-fg"
                            aria-label={`Remove ${member.name}`}
                            onClick={() => {
                              setDeleteTargetId(member.id);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Icon name="trash" className="mr-1.5 h-3.5 w-3.5" />
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : people.length === 0 ? (
            <EmptyState
              icon="users"
              title="No members yet"
              description="Invite someone to give them access to this organization."
              action={
                <Button
                  variant="accent"
                  size="sm"
                  onClick={() => setIsInviteOpen(true)}
                >
                  Invite a member
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon="users"
              title="No people found"
              description="Try a different name or email address."
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSearch('')}
                >
                  Clear search
                </Button>
              }
            />
          )}
        </Card>
        <Accordion
          type="single"
          collapsible
          className="rounded-xl border border-border bg-surface px-4"
        >
          <AccordionItem value="roles" className="border-0">
            <AccordionTrigger>Roles & permissions</AccordionTrigger>
            <AccordionContent>
              <p className="text-xs text-muted">
                Roles describe the work each teammate can do in this demo. They
                are product guidance, not enforced access controls.
              </p>
              <div className="mt-4 divide-y divide-border">
                {ROLE_OPTIONS.map((role) => (
                  <div
                    key={role}
                    className="flex flex-col gap-1 py-3 sm:flex-row sm:items-start sm:gap-5"
                  >
                    <span className="w-40 shrink-0 text-sm font-medium">
                      {role}
                    </span>
                    <span className="text-sm text-muted">
                      {ROLE_SUMMARIES[role]}
                    </span>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
      <ShadcnDialog
        open={isDeleteDialogOpen}
        onOpenChange={(isOpen) => {
          setIsDeleteDialogOpen(isOpen);
          if (!isOpen) setDeleteTargetId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove member?</DialogTitle>
            <DialogDescription>
              They will lose access to {currentOrg.name} in this demo.
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm">
            Remove <strong>{deleteTarget?.name}</strong> ({deleteTarget?.email})
            from this organization?
          </p>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setDeleteTargetId(null);
              }}
            >
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDelete}>
              Remove member
            </Button>
          </DialogFooter>
        </DialogContent>
      </ShadcnDialog>
    </AppShell>
  );
}
