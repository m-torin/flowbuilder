import { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { getInstanceBySubdomain } from '#/lib/prisma/ormApi/instance';
import { isolateSubdomain } from '#/lib/utils/parse';

interface InstanceLayoutProps {
  children: ReactNode;
  params: Promise<{
    domain: string;
  }>;
}

export default async function InstanceLayout({
  children,
  params,
}: InstanceLayoutProps) {
  const { domain } = await params;
  const subdomain = isolateSubdomain(domain);
  const instance = await getInstanceBySubdomain(subdomain);

  if (instance) {
    return <>{children}</>;
  }

  notFound();
}
