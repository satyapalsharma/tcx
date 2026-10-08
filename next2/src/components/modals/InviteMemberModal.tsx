'use client';

import React, { useState } from 'react';
import { useApp, type MemberRole } from '@/context/AppContext';
import { useToast } from '@/components/Toast';
import { Icon } from '@/components/Icon';
import { SelectField } from '@/components/common';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const ROLES = [
  { value: 'Admin', label: 'Admin · manages org, members & billing' },
  { value: 'Builder', label: 'Builder · runs tasks, edits flows, builds agents' },
  { value: 'Viewer', label: 'Viewer · read-only' },
];

export function InviteMemberModal() {
  const { isInviteOpen, setIsInviteOpen, currentOrg, currentWorkspace, addMember } = useApp();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<MemberRole>('Builder');
  const [scope, setScope] = useState('all');

  const close = () => {
    setIsInviteOpen(false);
    setEmail('');
    setRole('Builder');
    setScope('all');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    addMember({ email: trimmed, role, allWorkspaces: scope === 'all' });
    toast(`Invitation sent to ${trimmed}`, 'mail');
    close();
  };

  return (
    <Dialog open={isInviteOpen} onOpenChange={(o) => !o && close()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite to {currentOrg.name}</DialogTitle>
          <DialogDescription>They&apos;ll get an email to join. You can change their role later.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="inv-email" className="text-xs">Work email</Label>
            <Input
              id="inv-email"
              type="email"
              placeholder="colleague@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-9 text-sm"
              required
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="inv-role" className="text-xs">Role</Label>
            <SelectField id="inv-role" value={role} onValueChange={(v) => setRole(v as MemberRole)} options={ROLES} size="default" className="w-full h-9" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="inv-scope" className="text-xs">Workspace access</Label>
            <SelectField
              id="inv-scope"
              value={scope}
              onValueChange={setScope}
              options={[
                { value: 'all', label: 'All workspaces' },
                { value: 'current', label: `Only ${currentWorkspace.name}` },
              ]}
              size="default"
              className="w-full h-9"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={close}>Cancel</Button>
            <Button type="submit" variant="accent" className="gap-1.5">
              <Icon name="mail" className="w-3.5 h-3.5" />
              Send invite
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
