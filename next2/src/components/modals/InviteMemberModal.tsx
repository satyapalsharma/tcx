'use client';

import React, { useState } from 'react';
import { useApp, type MemberRole } from '@/context/AppContext';
import { usePipeline } from '@/context/PipelineContext';
import { useToast } from '@/components/Toast';
import { Icon } from '@/components/Icon';
import { SelectField } from '@/components/common';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const ROLES: { value: MemberRole; label: string }[] = [
  { value: 'Admin', label: 'Admin · Organization, members & projects' },
  {
    value: 'Business Analyst',
    label: 'Business Analyst · Intent discovery & taxonomy',
  },
  { value: 'CX Designer', label: 'CX Designer · Process maps & service flows' },
  { value: 'Developer', label: 'Developer · Agent code drafts' },
  { value: 'Viewer', label: 'Viewer · View shared work and results' },
];

export function InviteMemberModal() {
  const {
    isInviteOpen,
    setIsInviteOpen,
    currentOrg,
    membersForCurrentOrg,
    addMember,
  } = useApp();
  const { recordEvent } = usePipeline();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<MemberRole>('Business Analyst');

  const close = () => {
    setIsInviteOpen(false);
    setEmail('');
    setRole('Business Analyst');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    const duplicate = membersForCurrentOrg.some(
      (member) => member.email.trim().toLowerCase() === trimmed.toLowerCase(),
    );
    if (duplicate) {
      toast(`${trimmed} already belongs to this organization`, 'warn');
      return;
    }
    addMember({ email: trimmed, role, allWorkspaces: true });
    recordEvent(
      'Added organization member',
      `Added ${trimmed} as ${role}. This demo does not send an invitation email.`,
    );
    toast(`${trimmed} added to this demo`, 'check');
    close();
  };

  return (
    <Dialog open={isInviteOpen} onOpenChange={(o) => !o && close()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite to {currentOrg.name}</DialogTitle>
          <DialogDescription>
            Add a person to this organization. This demo does not send an email;
            you can change their role later.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="inv-email" className="text-xs">
              Work email
            </Label>
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
            <Label htmlFor="inv-role" className="text-xs">
              Role
            </Label>
            <SelectField
              id="inv-role"
              value={role}
              onValueChange={(v) => setRole(v as MemberRole)}
              options={ROLES}
              size="default"
              className="w-full h-9"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" variant="accent" className="gap-1.5">
              <Icon name="mail" className="w-3.5 h-3.5" />
              Add to demo
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
