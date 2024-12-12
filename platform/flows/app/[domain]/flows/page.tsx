// src/app/[domain]/flows/page.tsx
import { subdomainFromHostname } from '#/lib/domains';
import { getFlowsBySubdomainAction } from '#/lib/prisma';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { PageFrame } from '#/ui/shared';
import { Button, Paper, rem } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import Link from 'next/link';
import { TableBooksSelection } from './TableBooksSelection';

export const metadata: Metadata = {
  title: 'All Flows | Flowbuilder',
};

interface FlowsPageProps {
  params: Promise<{
    domain: string;
  }>;
}

export default async function FlowsPage({ params }: FlowsPageProps) {
  const { domain } = await params;
  const subdomain = subdomainFromHostname(domain);
  const userFlows = await getFlowsBySubdomainAction(subdomain);

  if (!userFlows || userFlows.length === 0) {
    redirect('/flows/new');
    return null;
  }

  // Transform the flow data for the table component
  const tableData = userFlows.map((flow) => ({
    id: flow.id,
    name: flow.name,
    // owner: flow.owner?.name || 'Torin',
    owner: 'Torin',
    runs: {
      positive: flow.statistics?.successfulRuns ?? 0,
      negative: flow.statistics?.failedRuns ?? 0,
    },
    isEnabled: flow.isEnabled,
    metadata: flow.metadata,
  }));

  return (
    <PageFrame
      title="All Flows"
      description="View and manage your data integration flows"
      sideContent={
        <Button
          leftSection={<IconPlus size={16} />}
          variant="light"
          color="blue.8"
          component={Link}
          href="/flows/new"
        >
          New Flow
        </Button>
      }
    >
      <Paper withBorder mb={rem(50)}>
        <TableBooksSelection data={tableData} />
      </Paper>
    </PageFrame>
  );
}
