import type {
  Member,
  MemberRole,
  Organization,
  Workspace,
} from '../data/organization';

export type AppState = {
  organizations: Organization[];
  workspaces: Workspace[];
  members: Member[];
  currentOrgId: string;
  currentWorkspaceId: string;
  jobs: unknown[];
};

const plans = new Set(['Enterprise', 'Team', 'Starter']);
const orgRoles = new Set(['Owner', 'Admin', 'Member']);
const memberRoles = new Set([
  'Admin',
  'Business Analyst',
  'CX Designer',
  'Developer',
  'Viewer',
  'Builder',
]);
const memberStatuses = new Set(['active', 'invited', 'service']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function uniqueIds(items: { id: string }[]): boolean {
  return new Set(items.map(({ id }) => id)).size === items.length;
}

function isOrganization(value: unknown): value is Organization {
  if (!isRecord(value)) return false;
  return (
    nonEmptyString(value.id) &&
    nonEmptyString(value.name) &&
    nonEmptyString(value.slug) &&
    typeof value.plan === 'string' &&
    plans.has(value.plan) &&
    typeof value.role === 'string' &&
    orgRoles.has(value.role) &&
    typeof value.memberCount === 'number' &&
    Number.isFinite(value.memberCount) &&
    value.memberCount >= 0
  );
}

function isWorkspace(value: unknown): value is Workspace {
  if (!isRecord(value)) return false;
  return (
    nonEmptyString(value.id) &&
    nonEmptyString(value.name) &&
    nonEmptyString(value.orgId) &&
    typeof value.description === 'string' &&
    (value.isDefault === undefined || typeof value.isDefault === 'boolean') &&
    typeof value.jobCount === 'number' &&
    Number.isFinite(value.jobCount) &&
    value.jobCount >= 0
  );
}

type PersistedMember = Omit<Member, 'role'> & { role: MemberRole | 'Builder' };

function isMember(value: unknown): value is PersistedMember {
  if (!isRecord(value)) return false;
  return (
    nonEmptyString(value.id) &&
    nonEmptyString(value.orgId) &&
    nonEmptyString(value.name) &&
    nonEmptyString(value.email) &&
    typeof value.role === 'string' &&
    memberRoles.has(value.role) &&
    typeof value.workspaces === 'string' &&
    typeof value.lastActive === 'string' &&
    typeof value.status === 'string' &&
    memberStatuses.has(value.status) &&
    typeof value.initials === 'string'
  );
}

function migrateMember(member: PersistedMember): Member {
  const role: MemberRole =
    member.role === 'Builder'
      ? member.id === 'devika'
        ? 'CX Designer'
        : member.id === 'arjun'
          ? 'Developer'
          : 'Business Analyst'
      : member.role;
  return {
    ...member,
    role,
    workspaces: member.workspaces.replace('All workspaces', 'All projects'),
  };
}

/** Validates and normalizes persisted app data without mutating the supplied value. */
export function readAppState(value: unknown): AppState | null {
  if (
    !isRecord(value) ||
    !Array.isArray(value.organizations) ||
    !Array.isArray(value.workspaces) ||
    !Array.isArray(value.members) ||
    !Array.isArray(value.jobs)
  )
    return null;

  if (
    !value.organizations.every(isOrganization) ||
    !value.workspaces.every(isWorkspace) ||
    !value.members.every(isMember)
  )
    return null;

  const organizations = value.organizations as Organization[];
  const workspaces = value.workspaces as Workspace[];
  const rawMembers = value.members as PersistedMember[];
  if (
    !uniqueIds(organizations) ||
    !uniqueIds(workspaces) ||
    !uniqueIds(rawMembers)
  )
    return null;

  const organizationIds = new Set(
    organizations.map((organization) => organization.id),
  );
  if (
    workspaces.some((workspace) => !organizationIds.has(workspace.orgId)) ||
    rawMembers.some((member) => !organizationIds.has(member.orgId))
  )
    return null;

  const currentOrgId =
    typeof value.currentOrgId === 'string' &&
    organizationIds.has(value.currentOrgId)
      ? value.currentOrgId
      : (organizations[0]?.id ?? '');
  const orgWorkspaces = workspaces.filter(
    (workspace) => workspace.orgId === currentOrgId,
  );
  const currentWorkspaceId =
    typeof value.currentWorkspaceId === 'string' &&
    orgWorkspaces.some((workspace) => workspace.id === value.currentWorkspaceId)
      ? value.currentWorkspaceId
      : (orgWorkspaces[0]?.id ?? '');

  return {
    organizations: organizations.map((organization) => ({ ...organization })),
    workspaces: workspaces.map((workspace) => ({ ...workspace })),
    members: rawMembers.map(migrateMember),
    currentOrgId,
    currentWorkspaceId,
    jobs: [...value.jobs],
  };
}
