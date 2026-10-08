'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/components/Toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function CreateOrgModal() {
  const { isNewOrgOpen, setIsNewOrgOpen, createOrg } = useApp();
  const toast = useToast();
  const [name, setName] = useState('');

  const close = () => {
    setIsNewOrgOpen(false);
    setName('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const org = createOrg(name.trim());
    toast(`Organization "${org.name}" created`, 'check');
    close();
  };

  return (
    <Dialog open={isNewOrgOpen} onOpenChange={(o) => !o && close()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New organization</DialogTitle>
          <DialogDescription>You&apos;ll be the owner. A default workspace is created for you.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="new-org-name" className="text-xs">Organization name</Label>
            <Input
              id="new-org-name"
              placeholder="e.g. Acme Corporation"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-9 text-sm"
              required
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={close}>Cancel</Button>
            <Button type="submit" variant="accent">Create organization</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
