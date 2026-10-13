'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/components/Toast';
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

export function CreateOrgModal() {
  const { isNewOrgOpen, setIsNewOrgOpen, createOrg } = useApp();
  const toast = useToast();
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');

  const close = () => {
    setIsNewOrgOpen(false);
    setName('');
    setNameError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setNameError('Enter an organization name.');
      return;
    }
    const org = createOrg(name.trim());
    toast(`Organization "${org.name}" created`, 'check');
    close();
  };

  return (
    <Dialog open={isNewOrgOpen} onOpenChange={(o) => !o && close()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New organization</DialogTitle>
          <DialogDescription>
            You&apos;ll be the owner. Create projects for your team after setup.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="new-org-name" className="text-xs">
              Organization name
            </Label>
            <Input
              id="new-org-name"
              placeholder="e.g. Acme Corporation"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setNameError('');
              }}
              className="h-9 text-sm"
              required
              aria-invalid={Boolean(nameError)}
              aria-describedby={nameError ? 'new-org-name-error' : undefined}
              autoFocus
            />
            {nameError && (
              <p
                id="new-org-name-error"
                role="alert"
                className="text-sm text-danger-fg"
              >
                {nameError}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" variant="accent">
              Create organization
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
