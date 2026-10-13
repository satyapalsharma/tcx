export type Organization = {
  id: string;
  name: string;
  slug: string;
  plan: 'Enterprise' | 'Team' | 'Starter';
  role: 'Owner' | 'Admin' | 'Member';
  memberCount: number;
};

// Workspace remains the legacy application DTO while the product language moves to Projects.
export type Workspace = {
  id: string;
  name: string;
  orgId: string;
  description: string;
  isDefault?: boolean;
  jobCount: number;
};

export type MemberRole =
  'Admin' | 'Business Analyst' | 'CX Designer' | 'Developer' | 'Viewer';

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

export const INITIAL_ORGANIZATIONS: Organization[] = [
  {
    id: 'org-skyline',
    name: 'Skyline Communications',
    slug: 'skyline-broadband',
    plan: 'Enterprise',
    role: 'Owner',
    memberCount: 6,
  },
  {
    id: 'org-northwind',
    name: 'Northwind Global Retail',
    slug: 'northwind-retail',
    plan: 'Team',
    role: 'Admin',
    memberCount: 3,
  },
  {
    id: 'org-acme',
    name: 'Acme Digital Systems',
    slug: 'acme-systems',
    plan: 'Starter',
    role: 'Member',
    memberCount: 2,
  },
];

export const INITIAL_PROJECTS: Workspace[] = [
  {
    id: 'ws-cust-ops',
    name: 'Customer Operations',
    orgId: 'org-skyline',
    description: 'Primary production interactions & pipeline',
    isDefault: true,
    jobCount: 48,
  },
  {
    id: 'ws-billing',
    name: 'Billing & Payments',
    orgId: 'org-skyline',
    description: 'Dispute handling & refund automation',
    jobCount: 12,
  },
  {
    id: 'ws-broadband-dev',
    name: 'Network Support Staging',
    orgId: 'org-skyline',
    description: 'Technical triage & field escalations',
    jobCount: 27,
  },
  {
    id: 'ws-returns',
    name: 'Returns & Exchanges',
    orgId: 'org-northwind',
    description: 'E-commerce return flow automation',
    isDefault: true,
    jobCount: 16,
  },
  {
    id: 'ws-support',
    name: 'Omnichannel Chat',
    orgId: 'org-northwind',
    description: 'Customer service AI agents',
    jobCount: 9,
  },
  {
    id: 'ws-main',
    name: 'Core Automation',
    orgId: 'org-acme',
    description: 'General project',
    isDefault: true,
    jobCount: 5,
  },
];

export const INITIAL_MEMBERS: Member[] = [
  {
    id: 'priya',
    orgId: 'org-skyline',
    name: 'Priya Nair',
    email: 'priya@skyline-broadband.com',
    role: 'Admin',
    workspaces: 'All projects',
    lastActive: 'Just now',
    status: 'active',
    initials: 'PN',
  },
  {
    id: 'riya',
    orgId: 'org-skyline',
    name: 'Riya Menon',
    email: 'riya.m@skyline-broadband.com',
    role: 'Business Analyst',
    workspaces: 'Customer Operations',
    lastActive: '12 min ago',
    status: 'active',
    initials: 'RM',
  },
  {
    id: 'devika',
    orgId: 'org-skyline',
    name: 'Devika Sharma',
    email: 'devika.s@skyline-broadband.com',
    role: 'CX Designer',
    workspaces: 'Billing & Payments',
    lastActive: '1 hr ago',
    status: 'active',
    initials: 'DS',
  },
  {
    id: 'arjun',
    orgId: 'org-skyline',
    name: 'Arjun Shah',
    email: 'arjun.sh@skyline-broadband.com',
    role: 'Developer',
    workspaces: 'Network Support Staging',
    lastActive: '24 min ago',
    status: 'active',
    initials: 'AS',
  },
  {
    id: 'karan',
    orgId: 'org-skyline',
    name: 'Karan Mehta',
    email: 'k.mehta@partner.skylinebb.com',
    role: 'Viewer',
    workspaces: 'Customer Operations',
    lastActive: '2 days ago',
    status: 'invited',
    initials: 'KM',
  },
  {
    id: 'svc',
    orgId: 'org-skyline',
    name: 'svc-transform-bot',
    email: 'ci-runner@skyline-broadband.internal',
    role: 'Developer',
    workspaces: 'All projects',
    lastActive: 'via CI',
    status: 'service',
    initials: 'SB',
  },
  {
    id: 'rohan',
    orgId: 'org-northwind',
    name: 'Rohan Gupta',
    email: 'rohan@northwind.in',
    role: 'Admin',
    workspaces: 'All projects',
    lastActive: '5 min ago',
    status: 'active',
    initials: 'RG',
  },
  {
    id: 'anita',
    orgId: 'org-northwind',
    name: 'Anita Rao',
    email: 'anita@northwind.in',
    role: 'Business Analyst',
    workspaces: 'Returns & Exchanges',
    lastActive: '3 hr ago',
    status: 'active',
    initials: 'AR',
  },
  {
    id: 'vik',
    orgId: 'org-northwind',
    name: 'Vikram Joshi',
    email: 'vikram@northwind.in',
    role: 'Viewer',
    workspaces: 'Omnichannel Chat',
    lastActive: 'Yesterday',
    status: 'active',
    initials: 'VJ',
  },
  {
    id: 'sam',
    orgId: 'org-acme',
    name: 'Sam Carter',
    email: 'sam@acme.io',
    role: 'Admin',
    workspaces: 'All projects',
    lastActive: '1 hr ago',
    status: 'active',
    initials: 'SC',
  },
  {
    id: 'lee',
    orgId: 'org-acme',
    name: 'Lee Wong',
    email: 'lee@acme.io',
    role: 'Developer',
    workspaces: 'Core Automation',
    lastActive: '2 days ago',
    status: 'active',
    initials: 'LW',
  },
];

export function initials(value: string): string {
  return value
    .split(/[\s.@_-]+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}
