'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/components/Toast';
import { Icon } from '@/components/Icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

export function CreateOrgModal() {
  const { isNewOrgOpen, setIsNewOrgOpen, createOrg } = useApp();
  const toast = useToast();
  const [name, setName] = useState('');

  if (!isNewOrgOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const org = createOrg(name.trim());
    toast(`Organization "${org.name}" created`, 'check');
    setName('');
    setIsNewOrgOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-sm animate-in fade-in-0">
      <Card className="w-full max-w-md bg-surface border border-border rounded-xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border bg-surface-inset/20">
          <div>
            <h2 className="text-base font-bold text-foreground">Create Organization</h2>
            <p className="text-xs text-muted mt-0.5">Manage multiple workspaces, teams, and billing.</p>
          </div>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setIsNewOrgOpen(false)}
            aria-label="Close"
            className="text-muted hover:text-foreground"
          >
            <Icon name="x" className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          <div>
            <Label htmlFor="org-name" className="text-xs font-semibold text-foreground mb-1.5 block">
              Organization Name
            </Label>
            <Input
              id="org-name"
              placeholder="e.g. Acme Corporation"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-surface h-9 text-xs sm:text-sm"
              required
              autoFocus
            />
          </div>

          <div className="p-3 bg-surface-inset rounded-lg border border-border text-xs text-muted">
            <span className="font-semibold text-foreground">What happens next:</span>
            <ul className="list-disc pl-4 mt-1 space-y-0.5">
              <li>A default workspace is created automatically.</li>
              <li>You become the Organization Owner with full admin permissions.</li>
              <li>You can invite team members and set up connectors anytime.</li>
            </ul>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsNewOrgOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="accent" size="sm">
              Create Organization
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
