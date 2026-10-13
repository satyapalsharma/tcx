'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useApp } from '@/context/AppContext';

type Props = {
  crumb: string;
  middleCrumb?: ReactNode;
  organizationPage: boolean;
};

export function AppBreadcrumb({ crumb, middleCrumb, organizationPage }: Props) {
  const { currentOrg, currentWorkspace } = useApp();
  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList className="flex-nowrap gap-2 text-xs">
        <BreadcrumbItem className="hidden min-w-0 md:inline-flex">
          <BreadcrumbLink asChild className="max-w-48 truncate">
            <Link href="/organization-dashboard">{currentOrg.name}</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="hidden md:block" />
        {!organizationPage && (
          <>
            <BreadcrumbItem className="hidden min-w-0 lg:inline-flex">
              <BreadcrumbLink asChild className="max-w-40 truncate">
                <Link href="/dashboard">{currentWorkspace.name}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden lg:block" />
          </>
        )}
        {middleCrumb && (
          <>
            <BreadcrumbItem className="hidden min-w-0 md:inline-flex">
              <span className="truncate">{middleCrumb}</span>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
          </>
        )}
        <BreadcrumbItem className="min-w-0">
          <BreadcrumbPage className="truncate font-medium">
            {crumb}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
