'use client';

import NextLink from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { ComponentProps } from 'react';

type LinkProps = Omit<ComponentProps<typeof NextLink>, 'href'> & { to?: string; href?: string };

export function Link({ to, href, ...rest }: LinkProps) {
  const target = href ?? to ?? '/';
  return <NextLink href={target} {...rest} />;
}

export function useNavigate() {
  const router = useRouter();
  return (path: string) => router.push(path);
}

export { usePathname };
