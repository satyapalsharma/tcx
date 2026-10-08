'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/components/Toast';
import { Icon } from '@/components/Icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

export function CreateWorkspaceModal() {
  const { isNewWsOpen, setIsNewWsOpen, createWorkspace, currentOrg } = useApp();
  const toast = useToast();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  if (!isNewWsOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const ws = createWorkspace(name.trim(), desc.trim());
    toast(`Workspace "${ws.name}" created under ${currentOrg.name}`, 'check');
    setName('');
    setDesc('');
    setIsNewWsOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-sm animate-in fade-in-0">
      <Card className="w-full max-w-md bg-surface border border-border rounded-xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border bg-surface-inset/20">
          <div>
            <h2 className="text-base font-bold text-foreground">Create Workspace</h2>
            <p className="text-xs text-muted mt-0.5">
              Add a dedicated workspace in <span className="font-semibold text-foreground">{currentOrg.name}</span>.
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setIsNewWsOpen(false)}
            aria-label="Close"
            className="text-muted hover:text-foreground"
          >
            <Icon name="x" className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          <div>
            <Label htmlFor="ws-name" className="text-xs font-semibold text-foreground mb-1.5 block">
              Workspace Name
            </Label>
            <Input
              id="ws-name"
              placeholder="e.g. Billing Automation Staging"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-surface h-9 text-xs sm:text-sm"
              required
              autoFocus
            />
          </div>

          <div>
            <Label htmlFor="ws-desc" className="text-xs font-semibold text-foreground mb-1.5 block">
              Description (Optional)
            </Label>
            <Input
              id="ws-desc"
              placeholder="e.g. Dedicated environment for dispute handling agents"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="bg-surface h-9 text-xs sm:text-sm"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsNewWsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="accent" size="sm">
              Create Workspace
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
