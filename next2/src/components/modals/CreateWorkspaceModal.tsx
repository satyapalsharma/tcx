'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/components/Toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function CreateWorkspaceModal() {
  const { isNewWsOpen, setIsNewWsOpen, createWorkspace, currentOrg } = useApp();
  const toast = useToast();
  const [name, setName] = useState('');

  const close = () => {
    setIsNewWsOpen(false);
    setName('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const ws = createWorkspace(name.trim());
    toast(`Workspace "${ws.name}" created`, 'check');
    close();
  };

  return (
    <Dialog open={isNewWsOpen} onOpenChange={(o) => !o && close()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New workspace</DialogTitle>
          <DialogDescription>Workspaces keep jobs, flows and agents separate inside {currentOrg.name}.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ws-name" className="text-xs">Name</Label>
            <Input
              id="ws-name"
              placeholder="e.g. Billing Automation"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-9 text-sm"
              required
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={close}>Cancel</Button>
            <Button type="submit" variant="accent">Create workspace</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
