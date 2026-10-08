'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { JOBS, type Job } from '@/data/jobs';

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

  // Shared data (lifted so global modals can write into page lists)
  jobs: WorkspaceJob[];
  jobsForCurrentWorkspace: WorkspaceJob[];
  addJob: (input: { name: string; type: ModularTaskType }) => WorkspaceJob;
  updateJob: (id: string, patch: Partial<WorkspaceJob>) => void;
  removeJob: (id: string) => void;

  membersForCurrentOrg: Member[];
  addMember: (input: { email: string; name?: string; role: MemberRole; allWorkspaces: boolean }) => void;
  updateMemberRole: (id: string, role: MemberRole) => void;
  removeMember: (id: string) => void;

  updateOrg: (patch: Partial<Pick<Organization, 'name' | 'slug'>>) => void;
};

export type MemberRole = 'Admin' | 'Builder' | 'Viewer';

export type Member = {
  id: string;
  orgId: string;
  name: string;
  email: string;
  role: MemberRole;
  workspaces: string;
  lastActive: string;
  status: 'active' | 'invited' | 'service';
  initials: string;
};

export type WorkspaceJob = Job & { workspaceId: string };

const TASK_META: Record<ModularTaskType, { prefix: string; pipe: Job['pipe']; pipeline: string }> = {
  extract_intents: { prefix: 'RUN', pipe: 'Analysis', pipeline: 'Analysis · extract intents' },
  cluster_intents: { prefix: 'CLU', pipe: 'Analysis', pipeline: 'Analysis · cluster taxonomy' },
  design_flow: { prefix: 'MAP', pipe: 'Design', pipeline: 'Design · process flow' },
  generate_agent: { prefix: 'ADK', pipe: 'Develop', pipeline: 'Develop · agent code' },
  full_pipeline: { prefix: 'E2E', pipe: 'Analysis', pipeline: 'Full pipeline · end-to-end' },
};

// Seed jobs: billing-related runs live in the Billing workspace, the rest in Customer Operations.
const INITIAL_JOBS: WorkspaceJob[] = JOBS.map((j) => ({
  ...j,
  workspaceId: /billing|claims/i.test(j.subtitle) ? 'ws-billing' : 'ws-cust-ops',
}));

const initials = (s: string) =>
  s.split(/[\s.@_-]+/).filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase();

const INITIAL_MEMBERS: Member[] = [
  { id: 'priya', orgId: 'org-skyline', name: 'Priya Nair', email: 'priya@skyline-broadband.com', role: 'Admin', workspaces: 'All workspaces', lastActive: 'Just now', status: 'active', initials: 'PN' },
  { id: 'riya', orgId: 'org-skyline', name: 'Riya Menon', email: 'riya.m@skyline-broadband.com', role: 'Builder', workspaces: 'Customer Operations', lastActive: '12 min ago', status: 'active', initials: 'RM' },
  { id: 'devika', orgId: 'org-skyline', name: 'Devika Sharma', email: 'devika.s@skyline-broadband.com', role: 'Builder', workspaces: 'Billing & Payments', lastActive: '1 hr ago', status: 'active', initials: 'DS' },
  { id: 'arjun', orgId: 'org-skyline', name: 'Arjun Shah', email: 'arjun.sh@skyline-broadband.com', role: 'Builder', workspaces: 'Network Support Staging', lastActive: '24 min ago', status: 'active', initials: 'AS' },
  { id: 'karan', orgId: 'org-skyline', name: 'Karan Mehta', email: 'k.mehta@partner.skylinebb.com', role: 'Viewer', workspaces: 'Customer Operations', lastActive: '2 days ago', status: 'invited', initials: 'KM' },
  { id: 'svc', orgId: 'org-skyline', name: 'svc-transform-bot', email: 'ci-runner@skyline-broadband.internal', role: 'Builder', workspaces: 'All workspaces', lastActive: 'via CI', status: 'service', initials: 'SB' },
  { id: 'rohan', orgId: 'org-northwind', name: 'Rohan Gupta', email: 'rohan@northwind.in', role: 'Admin', workspaces: 'All workspaces', lastActive: '5 min ago', status: 'active', initials: 'RG' },
  { id: 'anita', orgId: 'org-northwind', name: 'Anita Rao', email: 'anita@northwind.in', role: 'Builder', workspaces: 'Returns & Exchanges', lastActive: '3 hr ago', status: 'active', initials: 'AR' },
  { id: 'vik', orgId: 'org-northwind', name: 'Vikram Joshi', email: 'vikram@northwind.in', role: 'Viewer', workspaces: 'Omnichannel Chat', lastActive: 'Yesterday', status: 'active', initials: 'VJ' },
  { id: 'sam', orgId: 'org-acme', name: 'Sam Carter', email: 'sam@acme.io', role: 'Admin', workspaces: 'All workspaces', lastActive: '1 hr ago', status: 'active', initials: 'SC' },
  { id: 'lee', orgId: 'org-acme', name: 'Lee Wong', email: 'lee@acme.io', role: 'Builder', workspaces: 'Core Automation', lastActive: '2 days ago', status: 'active', initials: 'LW' },
];

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

  // Hydrate selected org/workspace from localStorage
  useEffect(() => {
    try {
      const savedOrg = localStorage.getItem('tx-org');
      const savedWs = localStorage.getItem('tx-ws');
      if (savedOrg && INITIAL_ORGS.some((o) => o.id === savedOrg)) setCurrentOrgId(savedOrg);
      if (savedWs) setCurrentWorkspaceId(savedWs);
    } catch { /* noop */ }
  }, []);

  // Sync current workspace when org changes
  const workspacesForCurrentOrg = workspaces.filter((w) => w.orgId === currentOrgId);
  const currentOrg = organizations.find((o) => o.id === currentOrgId) ?? organizations[0];
  const currentWorkspace = workspacesForCurrentOrg.find((w) => w.id === currentWorkspaceId) ?? workspacesForCurrentOrg[0] ?? workspaces[0];

  const switchOrg = (orgId: string) => {
    setCurrentOrgId(orgId);
    try { localStorage.setItem('tx-org', orgId); } catch { /* noop */ }
    const orgWorkspaces = workspaces.filter((w) => w.orgId === orgId);
    if (orgWorkspaces.length > 0) {
      setCurrentWorkspaceId(orgWorkspaces[0].id);
      try { localStorage.setItem('tx-ws', orgWorkspaces[0].id); } catch { /* noop */ }
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
    setMembers((prev) => [
      { id: `mem-${Date.now()}`, orgId: newOrg.id, name: 'Priya Nair', email: 'priya@skyline-broadband.com', role: 'Admin', workspaces: 'All workspaces', lastActive: 'Just now', status: 'active', initials: 'PN' },
      ...prev,
    ]);
    setCurrentOrgId(newOrg.id);
    setCurrentWorkspaceId(defaultWs.id);
    return newOrg;
  };

  const switchWorkspace = (wsId: string) => {
    setCurrentWorkspaceId(wsId);
    try { localStorage.setItem('tx-ws', wsId); } catch { /* noop */ }
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

  // ---- Shared jobs ----
  const [jobs, setJobs] = useState<WorkspaceJob[]>(INITIAL_JOBS);
  const jobsForCurrentWorkspace = jobs.filter((j) => j.workspaceId === currentWorkspace.id);

  const addJob = ({ name, type }: { name: string; type: ModularTaskType }): WorkspaceJob => {
    const meta = TASK_META[type];
    const job: WorkspaceJob = {
      id: `${meta.prefix}-${Math.floor(4900 + Math.random() * 900)}`,
      subtitle: name,
      client: currentOrg.name,
      pipeline: meta.pipeline,
      pipe: meta.pipe,
      status: 'queued',
      statusLabel: 'Queued',
      badgeClass: 'badge',
      progress: 0,
      progressLabel: '—',
      progressFill: '',
      started: 'just now',
      cost: '—',
      costMuted: true,
      workspaceId: currentWorkspace.id,
    };
    setJobs((prev) => [job, ...prev]);
    return job;
  };
  const updateJob = (id: string, patch: Partial<WorkspaceJob>) =>
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...patch } : j)));
  const removeJob = (id: string) => setJobs((prev) => prev.filter((j) => j.id !== id));

  // ---- Shared members ----
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const membersForCurrentOrg = members.filter((m) => m.orgId === currentOrg.id);

  const addMember = ({ email, name, role, allWorkspaces }: { email: string; name?: string; role: MemberRole; allWorkspaces: boolean }) => {
    const display = name?.trim() || email.split('@')[0];
    setMembers((prev) => [
      {
        id: `mem-${Date.now()}`,
        orgId: currentOrg.id,
        name: display,
        email,
        role,
        workspaces: allWorkspaces ? 'All workspaces' : currentWorkspace.name,
        lastActive: '—',
        status: 'invited',
        initials: initials(display),
      },
      ...prev,
    ]);
  };
  const updateMemberRole = (id: string, role: MemberRole) =>
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, role } : m)));
  const removeMember = (id: string) => setMembers((prev) => prev.filter((m) => m.id !== id));

  const updateOrg = (patch: Partial<Pick<Organization, 'name' | 'slug'>>) =>
    setOrganizations((prev) => prev.map((o) => (o.id === currentOrg.id ? { ...o, ...patch } : o)));

  // Member count shown in switchers is derived, never stale.
  const orgsWithCounts = organizations.map((o) => ({
    ...o,
    memberCount: members.filter((m) => m.orgId === o.id && m.status !== 'service').length,
  }));
  const currentOrgWithCount = orgsWithCounts.find((o) => o.id === currentOrg.id) ?? currentOrg;
  const workspacesWithCounts = workspaces.map((w) => ({
    ...w,
    jobCount: jobs.filter((j) => j.workspaceId === w.id).length,
  }));
  const wsCount = (w: Workspace) => workspacesWithCounts.find((x) => x.id === w.id) ?? w;

  return (
    <AppContext.Provider
      value={{
        organizations: orgsWithCounts,
        currentOrg: currentOrgWithCount,
        switchOrg,
        createOrg,
        workspaces: workspacesWithCounts,
        currentWorkspace: wsCount(currentWorkspace),
        workspacesForCurrentOrg: workspacesForCurrentOrg.map(wsCount),
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
        jobs,
        jobsForCurrentWorkspace,
        addJob,
        updateJob,
        removeJob,
        membersForCurrentOrg,
        addMember,
        updateMemberRole,
        removeMember,
        updateOrg,
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
