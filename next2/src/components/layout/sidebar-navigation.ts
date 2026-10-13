import type { IconName } from '@/components/Icon';

export type NavigationItem = { to: string; label: string; icon: IconName };
export const PROJECT_LINKS: NavigationItem[] = [
  { to: '/dashboard', label: 'Project home', icon: 'grid' },
  { to: '/jobs', label: 'Jobs', icon: 'clock' },
];
export const TOOL_LINKS: NavigationItem[] = [
  { to: '/analysis', label: 'Analysis', icon: 'search' },
  { to: '/design', label: 'Design', icon: 'flow' },
  { to: '/develop', label: 'Develop', icon: 'code' },
  { to: '/job-analytics', label: 'Job dashboard', icon: 'chart' },
];
export const ORGANIZATION_LINKS: NavigationItem[] = [
  { to: '/organization-dashboard', label: 'Org dashboard', icon: 'grid' },
  { to: '/projects', label: 'Projects', icon: 'folder' },
  { to: '/rbac', label: 'Members & roles', icon: 'users' },
  { to: '/connectors', label: 'Connectors', icon: 'plug' },
  { to: '/audit-log', label: 'Audit log', icon: 'scroll' },
  { to: '/settings', label: 'Settings', icon: 'gear' },
];
export function isOrganizationPage(pathname: string) {
  return ORGANIZATION_LINKS.some((item) => item.to === pathname);
}
