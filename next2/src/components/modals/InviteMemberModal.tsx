'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/components/Toast';
import { Icon } from '@/components/Icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

export function InviteMemberModal({ onInvite }: { onInvite?: (member: any) => void }) {
  const { isInviteOpen, setIsInviteOpen, currentOrg, currentWorkspace } = useApp();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('Builder');
  const [wsScope, setWsScope] = useState('all');

  if (!isInviteOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    const trimmedEmail = email.trim();
    const initials = (name.trim() || trimmedEmail.split('@')[0])
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    const newMember = {
      id: `mem-${Date.now()}`,
      odId: `mem-${Date.now()}`,
      name: name.trim() || trimmedEmail.split('@')[0],
      email: trimmedEmail,
      role,
      lastActive: 'just now',
      statusLabel: 'Invite pending',
      statusBadge: 'warn',
      initials,
      workspace: wsScope === 'all' ? 'All workspaces' : currentWorkspace.name,
    };

    if (onInvite) onInvite(newMember);
    toast(`Invitation sent to ${trimmedEmail}`, 'mail');
    setEmail('');
    setName('');
    setRole('Builder');
    setIsInviteOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-sm animate-in fade-in-0">
      <Card className="w-full max-w-md bg-surface border border-border rounded-xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border bg-surface-inset/20">
          <div>
            <h2 className="text-base font-bold text-foreground">Invite Team Member</h2>
            <p className="text-xs text-muted mt-0.5">
              To <span className="font-semibold text-foreground">{currentOrg.name}</span>
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setIsInviteOpen(false)}
            aria-label="Close"
            className="text-muted hover:text-foreground"
          >
            <Icon name="x" className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          <div>
            <Label htmlFor="inv-email" className="text-xs font-semibold text-foreground mb-1.5 block">
              Work Email
            </Label>
            <Input
              id="inv-email"
              type="email"
              placeholder="colleague@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-surface h-9 text-xs sm:text-sm"
              required
              autoFocus
            />
          </div>

          <div>
            <Label htmlFor="inv-name" className="text-xs font-semibold text-foreground mb-1.5 block">
              Full Name (Optional)
            </Label>
            <Input
              id="inv-name"
              placeholder="e.g. Rahul Verma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-surface h-9 text-xs sm:text-sm"
            />
          </div>

          <div>
            <Label htmlFor="inv-role" className="text-xs font-semibold text-foreground mb-1.5 block">
              Organization Role
            </Label>
            <select
              id="inv-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full h-9 px-3 bg-surface border border-border rounded-md text-xs sm:text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="Admin">Admin (Full workspace, billing &amp; member management)</option>
              <option value="Builder">Builder / Editor (Can run pipelines, edit flows &amp; build agents)</option>
              <option value="Viewer">Viewer (Read-only access to maps, clusters &amp; logs)</option>
            </select>
          </div>

          <div>
            <Label htmlFor="inv-scope" className="text-xs font-semibold text-foreground mb-1.5 block">
              Workspace Access
            </Label>
            <select
              id="inv-scope"
              value={wsScope}
              onChange={(e) => setWsScope(e.target.value)}
              className="w-full h-9 px-3 bg-surface border border-border rounded-md text-xs sm:text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="all">All workspaces in {currentOrg.name}</option>
              <option value="current">Current workspace only ({currentWorkspace.name})</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsInviteOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="accent" size="sm" className="gap-1.5 font-medium">
              <Icon name="mail" className="w-3.5 h-3.5" />
              Send Invitation
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
