'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import {
  INITIAL_MEMBERS,
  INITIAL_ORGANIZATIONS,
  INITIAL_PROJECTS,
  initials,
  type Member,
  type MemberRole,
  type Organization,
  type Workspace,
} from '@/data/organization';
import type { StageType } from '@/data/pipeline';
import { useBrowserState } from '@/hooks/use-browser-state';
import { readAppState, type AppState } from '@/lib/app-state';

export type {
  Member,
  MemberRole,
  Organization,
  Workspace,
} from '@/data/organization';
export type ModularTaskType = StageType;

type AppContextType = {
  organizations: Organization[];
  currentOrg: Organization;
  hasOrganization: boolean;
  switchOrg: (orgId: string) => void;
  createOrg: (name: string) => Organization;
  workspaces: Workspace[];
  currentWorkspace: Workspace;
  hasProject: boolean;
  workspacesForCurrentOrg: Workspace[];
  switchWorkspace: (wsId: string) => void;
  createWorkspace: (name: string, description?: string) => Workspace;
  isNewRunOpen: boolean;
  newRunDefaultType: ModularTaskType;
  newRunSource?: { sourceArtifactId: string; sourceVersion?: number };
  openNewRun: (
    type?: ModularTaskType,
    source?: { sourceArtifactId: string; sourceVersion?: number },
  ) => void;
  closeNewRun: () => void;
  isNewOrgOpen: boolean;
  setIsNewOrgOpen: (open: boolean) => void;
  isNewWsOpen: boolean;
  setIsNewWsOpen: (open: boolean) => void;
  isInviteOpen: boolean;
  setIsInviteOpen: (open: boolean) => void;
  membersForCurrentOrg: Member[];
  addMember: (input: {
    email: string;
    name?: string;
    role: MemberRole;
    allWorkspaces: boolean;
  }) => void;
  updateMemberRole: (id: string, role: MemberRole) => void;
  removeMember: (id: string) => void;
  updateOrg: (patch: Partial<Pick<Organization, 'name' | 'slug'>>) => void;
  accountEmail: string;
  storageScope: string;
  startSession: (email: string, mode: 'account' | 'demo') => void;
};

const INITIAL_STATE: AppState = {
  organizations: INITIAL_ORGANIZATIONS,
  workspaces: INITIAL_PROJECTS,
  members: INITIAL_MEMBERS,
  currentOrgId: 'org-skyline',
  currentWorkspaceId: 'ws-cust-ops',
  // Older prototypes stored a second job list here. Keep saved records opaque;
  // PipelineContext is now the single source of truth for active jobs.
  jobs: [],
};
const EMPTY_STATE: AppState = {
  organizations: [],
  workspaces: [],
  members: [],
  currentOrgId: '',
  currentWorkspaceId: '',
  jobs: [],
};
type Session = { email: string; mode: 'account' | 'demo' };
const INITIAL_SESSION: Session = {
  email: 'priya.nair@skyline.com',
  mode: 'demo',
};
function readSession(value: unknown): Session | null {
  if (!value || typeof value !== 'object') return null;
  const session = value as Partial<Session>;
  return typeof session.email === 'string' &&
    (session.mode === 'account' || session.mode === 'demo')
    ? { email: session.email.trim().toLowerCase(), mode: session.mode }
    : null;
}
const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [session, setSession, sessionHydrated] = useBrowserState(
    'tx-session-v1',
    INITIAL_SESSION,
    readSession,
  );
  const accountEmail = session.email;
  const storageScope =
    session.mode === 'demo' ? '' : `:${accountEmail.trim().toLowerCase()}`;
  const startSession = (rawEmail: string, mode: 'account' | 'demo') => {
    const email = rawEmail.trim().toLowerCase();
    if (!email) throw new Error('Enter an email address.');
    try {
      localStorage.setItem('tx-user', email);
    } catch {
      /* The session store reports browser storage failures through hydration. */
    }
    setIsNewRunOpen(false);
    setNewRunSource(undefined);
    setIsNewOrgOpen(false);
    setIsNewWsOpen(false);
    setIsInviteOpen(false);
    setSession({ email, mode });
  };
  const [state, setState, hydrated] = useBrowserState(
    `tx-app-v1${storageScope}`,
    session.mode === 'demo' ? INITIAL_STATE : EMPTY_STATE,
    readAppState,
  );
  const [isNewRunOpen, setIsNewRunOpen] = useState(false);
  const [newRunDefaultType, setNewRunDefaultType] =
    useState<ModularTaskType>('full_pipeline');
  const [newRunSource, setNewRunSource] = useState<{
    sourceArtifactId: string;
    sourceVersion?: number;
  }>();
  const [isNewOrgOpen, setIsNewOrgOpen] = useState(false);
  const [isNewWsOpen, setIsNewWsOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const {
    organizations,
    workspaces,
    members,
    currentOrgId,
    currentWorkspaceId,
  } = state;
  const workspacesForCurrentOrg = workspaces.filter(
    (project) => project.orgId === currentOrgId,
  );
  const hasOrganization = Boolean(
    currentOrgId && organizations.some((org) => org.id === currentOrgId),
  );
  const hasProject = Boolean(
    currentWorkspaceId &&
    workspacesForCurrentOrg.some(
      (project) => project.id === currentWorkspaceId,
    ),
  );
  const currentOrg: Organization = organizations.find(
    (org) => org.id === currentOrgId,
  ) ??
    organizations[0] ?? {
      id: '',
      name: 'Your organization',
      slug: '',
      plan: 'Starter',
      role: 'Owner',
      memberCount: 0,
    };
  const currentWorkspace: Workspace = workspacesForCurrentOrg.find(
    (project) => project.id === currentWorkspaceId,
  ) ??
    workspacesForCurrentOrg[0] ?? {
      id: '',
      name: 'No project yet',
      orgId: currentOrg.id,
      description: '',
      isDefault: false,
      jobCount: 0,
    };
  const membersForCurrentOrg = members.filter(
    (member) => member.orgId === currentOrg.id,
  );

  const closeScopeModals = () => {
    setIsNewRunOpen(false);
    setNewRunSource(undefined);
    setIsNewWsOpen(false);
    setIsInviteOpen(false);
  };
  const switchOrg = (orgId: string) => {
    setState((previous) => {
      if (!previous.organizations.some((org) => org.id === orgId))
        return previous;
      const project = previous.workspaces.find((item) => item.orgId === orgId);
      return {
        ...previous,
        currentOrgId: orgId,
        currentWorkspaceId: project?.id ?? '',
      };
    });
    closeScopeModals();
  };
  const switchWorkspace = (wsId: string) => {
    setState((previous) =>
      previous.workspaces.some(
        (project) =>
          project.id === wsId && project.orgId === previous.currentOrgId,
      )
        ? { ...previous, currentWorkspaceId: wsId }
        : previous,
    );
    closeScopeModals();
  };
  const createOrg = (rawName: string): Organization => {
    const name = rawName.trim();
    if (!name) throw new Error('Enter an organization name.');
    const ownerEmail = accountEmail || 'demo@example.com';
    const ownerName = ownerEmail
      .split('@')[0]
      .replace(/[._-]+/g, ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
    const org: Organization = {
      id: `org-${crypto.randomUUID()}`,
      name,
      slug:
        name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '') || 'new-org',
      plan: 'Starter',
      role: 'Owner',
      memberCount: 1,
    };
    const owner: Member = {
      id: `mem-${crypto.randomUUID()}`,
      orgId: org.id,
      name: ownerName,
      email: ownerEmail,
      role: 'Admin',
      workspaces: 'All projects',
      lastActive: 'Just now',
      status: 'active',
      initials: initials(ownerName),
    };
    setState((previous) => ({
      ...previous,
      organizations: [...previous.organizations, org],
      workspaces: previous.workspaces,
      members: [owner, ...previous.members],
      currentOrgId: org.id,
      currentWorkspaceId: '',
    }));
    closeScopeModals();
    return org;
  };
  const createWorkspace = (
    rawName: string,
    description = 'Jobs and results for your team',
  ): Workspace => {
    if (!hasOrganization) throw new Error('Create an organization first.');
    const name = rawName.trim();
    if (!name) throw new Error('Enter a project name.');
    const project: Workspace = {
      id: `ws-${crypto.randomUUID()}`,
      name,
      orgId: currentOrg.id,
      description: description.trim(),
      isDefault: false,
      jobCount: 0,
    };
    setState((previous) => ({
      ...previous,
      workspaces: [...previous.workspaces, project],
      currentWorkspaceId: project.id,
    }));
    closeScopeModals();
    return project;
  };
  const addMember: AppContextType['addMember'] = ({
    email: rawEmail,
    name,
    role,
    allWorkspaces,
  }) => {
    if (!hasOrganization) throw new Error('Create an organization first.');
    const email = rawEmail.trim().toLowerCase();
    if (!email) throw new Error('Enter an email address.');
    const display = name?.trim() || email.split('@')[0];
    const member: Member = {
      id: `mem-${crypto.randomUUID()}`,
      orgId: currentOrg.id,
      name: display,
      email,
      role,
      workspaces: allWorkspaces ? 'All projects' : currentWorkspace.name,
      lastActive: '—',
      status: 'invited',
      initials: initials(display),
    };
    setState((previous) =>
      previous.members.some(
        (item) =>
          item.orgId === member.orgId && item.email.toLowerCase() === email,
      )
        ? previous
        : { ...previous, members: [member, ...previous.members] },
    );
  };
  const updateMemberRole = (id: string, role: MemberRole) =>
    setState((previous) => ({
      ...previous,
      members: previous.members.map((member) =>
        member.id === id && member.orgId === currentOrg.id
          ? { ...member, role }
          : member,
      ),
    }));
  const removeMember = (id: string) =>
    setState((previous) => ({
      ...previous,
      members: previous.members.filter(
        (member) => member.id !== id || member.orgId !== currentOrg.id,
      ),
    }));
  const updateOrg: AppContextType['updateOrg'] = (patch) => {
    const cleaned = { ...patch };
    if (cleaned.name !== undefined) {
      cleaned.name = cleaned.name.trim();
      if (!cleaned.name) throw new Error('Enter an organization name.');
    }
    if (cleaned.slug !== undefined) {
      cleaned.slug = cleaned.slug.trim();
      if (!cleaned.slug) throw new Error('Enter an organization slug.');
    }
    setState((previous) => ({
      ...previous,
      organizations: previous.organizations.map((org) =>
        org.id === currentOrg.id ? { ...org, ...cleaned } : org,
      ),
    }));
  };
  const orgsWithCounts = organizations.map((org) => ({
    ...org,
    memberCount: members.filter(
      (member) => member.orgId === org.id && member.status !== 'service',
    ).length,
  }));
  if (!hydrated || !sessionHydrated)
    return (
      <div
        className="grid min-h-screen place-items-center text-sm text-muted"
        role="status"
      >
        Opening organization…
      </div>
    );
  return (
    <AppContext.Provider
      value={{
        organizations: orgsWithCounts,
        hasOrganization,
        hasProject,
        currentOrg:
          orgsWithCounts.find((org) => org.id === currentOrg.id) ?? currentOrg,
        workspaces,
        currentWorkspace,
        workspacesForCurrentOrg,
        switchOrg,
        createOrg,
        switchWorkspace,
        createWorkspace,
        isNewRunOpen,
        newRunDefaultType,
        newRunSource,
        openNewRun: (type = 'full_pipeline', source) => {
          if (!hasProject) return;
          setNewRunDefaultType(type);
          setNewRunSource(source);
          setIsNewRunOpen(true);
        },
        closeNewRun: () => {
          setIsNewRunOpen(false);
          setNewRunSource(undefined);
        },
        isNewOrgOpen,
        setIsNewOrgOpen,
        isNewWsOpen,
        setIsNewWsOpen,
        isInviteOpen,
        setIsInviteOpen,
        membersForCurrentOrg,
        addMember,
        updateMemberRole,
        removeMember,
        updateOrg,
        accountEmail,
        storageScope,
        startSession,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('AppProvider is required');
  return context;
}
