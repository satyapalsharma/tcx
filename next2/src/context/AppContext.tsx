'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type ModularTaskType =
  | 'extract_intents'    // 🎯 1. Extract intents from transcripts/logs
  | 'cluster_intents'    // 🧩 2. Cluster existing intents into L1/L2
  | 'design_flow'        // 🗺️ 3. Design visual process map from intent/cluster
  | 'generate_agent'     // 🤖 4. Generate agent code (ADK / Bedrock)
  | 'full_pipeline';     // ⚡ 5. End-to-end full pipeline

export type Organization = {
  id: string;
  name: string;
  slug: string;
  plan: 'Enterprise' | 'Team' | 'Starter';
  role: 'Owner' | 'Admin' | 'Member';
  memberCount: number;
};

export type Workspace = {
  id: string;
  name: string;
  orgId: string;
  description: string;
  isDefault?: boolean;
  jobCount: number;
};

const INITIAL_ORGS: Organization[] = [
  { id: 'org-skyline', name: 'Skyline Communications', slug: 'skyline-broadband', plan: 'Enterprise', role: 'Owner', memberCount: 6 },
  { id: 'org-northwind', name: 'Northwind Global Retail', slug: 'northwind-retail', plan: 'Team', role: 'Admin', memberCount: 3 },
  { id: 'org-acme', name: 'Acme Digital Systems', slug: 'acme-systems', plan: 'Starter', role: 'Member', memberCount: 2 },
];

const INITIAL_WORKSPACES: Workspace[] = [
  { id: 'ws-cust-ops', name: 'Customer Operations', orgId: 'org-skyline', description: 'Primary production interactions & pipeline', isDefault: true, jobCount: 48 },
  { id: 'ws-billing', name: 'Billing & Payments', orgId: 'org-skyline', description: 'Dispute handling & refund automation', jobCount: 12 },
  { id: 'ws-broadband-dev', name: 'Network Support Staging', orgId: 'org-skyline', description: 'Technical triage & field escalations', jobCount: 27 },
  { id: 'ws-returns', name: 'Returns & Exchanges', orgId: 'org-northwind', description: 'E-commerce return flow automation', isDefault: true, jobCount: 16 },
  { id: 'ws-support', name: 'Omnichannel Chat', orgId: 'org-northwind', description: 'Customer service AI agents', jobCount: 9 },
  { id: 'ws-main', name: 'Core Automation', orgId: 'org-acme', description: 'General workspace', isDefault: true, jobCount: 5 },
];

type AppContextType = {
  organizations: Organization[];
  currentOrg: Organization;
  switchOrg: (orgId: string) => void;
  createOrg: (name: string) => Organization;

  workspaces: Workspace[];
  currentWorkspace: Workspace;
  workspacesForCurrentOrg: Workspace[];
  switchWorkspace: (wsId: string) => void;
  createWorkspace: (name: string, description?: string) => Workspace;

  // Global Modular Run Modal
  isNewRunOpen: boolean;
  newRunDefaultType: ModularTaskType;
  openNewRun: (type?: ModularTaskType) => void;
  closeNewRun: () => void;

  // Quick Modals
  isNewOrgOpen: boolean;
  setIsNewOrgOpen: (open: boolean) => void;
  isNewWsOpen: boolean;
  setIsNewWsOpen: (open: boolean) => void;
  isInviteOpen: boolean;
  setIsInviteOpen: (open: boolean) => void;
};

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [organizations, setOrganizations] = useState<Organization[]>(INITIAL_ORGS);
  const [currentOrgId, setCurrentOrgId] = useState<string>('org-skyline');

  const [workspaces, setWorkspaces] = useState<Workspace[]>(INITIAL_WORKSPACES);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string>('ws-cust-ops');

  const [isNewRunOpen, setIsNewRunOpen] = useState(false);
  const [newRunDefaultType, setNewRunDefaultType] = useState<ModularTaskType>('extract_intents');

  const [isNewOrgOpen, setIsNewOrgOpen] = useState(false);
  const [isNewWsOpen, setIsNewWsOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  // Sync current workspace when org changes
  const workspacesForCurrentOrg = workspaces.filter((w) => w.orgId === currentOrgId);
  const currentOrg = organizations.find((o) => o.id === currentOrgId) ?? organizations[0];
  const currentWorkspace = workspacesForCurrentOrg.find((w) => w.id === currentWorkspaceId) ?? workspacesForCurrentOrg[0] ?? workspaces[0];

  const switchOrg = (orgId: string) => {
    setCurrentOrgId(orgId);
    const orgWorkspaces = workspaces.filter((w) => w.orgId === orgId);
    if (orgWorkspaces.length > 0) {
      setCurrentWorkspaceId(orgWorkspaces[0].id);
    }
  };

  const createOrg = (name: string): Organization => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const newOrg: Organization = {
      id: `org-${Date.now()}`,
      name,
      slug: slug || 'new-org',
      plan: 'Starter',
      role: 'Owner',
      memberCount: 1,
    };
    const defaultWs: Workspace = {
      id: `ws-${Date.now()}`,
      name: 'Default Workspace',
      orgId: newOrg.id,
      description: 'Main production workspace',
      isDefault: true,
      jobCount: 0,
    };
    setOrganizations((prev) => [...prev, newOrg]);
    setWorkspaces((prev) => [...prev, defaultWs]);
    setCurrentOrgId(newOrg.id);
    setCurrentWorkspaceId(defaultWs.id);
    return newOrg;
  };

  const switchWorkspace = (wsId: string) => {
    setCurrentWorkspaceId(wsId);
  };

  const createWorkspace = (name: string, description = 'Workspace for pipeline runs'): Workspace => {
    const newWs: Workspace = {
      id: `ws-${Date.now()}`,
      name,
      orgId: currentOrgId,
      description,
      isDefault: false,
      jobCount: 0,
    };
    setWorkspaces((prev) => [...prev, newWs]);
    setCurrentWorkspaceId(newWs.id);
    return newWs;
  };

  const openNewRun = (type: ModularTaskType = 'extract_intents') => {
    setNewRunDefaultType(type);
    setIsNewRunOpen(true);
  };

  const closeNewRun = () => {
    setIsNewRunOpen(false);
  };

  return (
    <AppContext.Provider
      value={{
        organizations,
        currentOrg,
        switchOrg,
        createOrg,
        workspaces,
        currentWorkspace,
        workspacesForCurrentOrg,
        switchWorkspace,
        createWorkspace,
        isNewRunOpen,
        newRunDefaultType,
        openNewRun,
        closeNewRun,
        isNewOrgOpen,
        setIsNewOrgOpen,
        isNewWsOpen,
        setIsNewWsOpen,
        isInviteOpen,
        setIsInviteOpen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
