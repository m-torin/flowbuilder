// src/app/[domain]/flows/page.tsx
import { subdomainFromHostname } from '#/lib/domains';
import { getFlowsBySubdomainAction } from '#/lib/prisma';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { PageFrame } from '#/ui/shared';
import { Paper, rem } from '@mantine/core';
import { TableBooksSelection } from './TableBooksSelection';
import { NewFlowButton } from '#/ui/shared/NewFlowButton';

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
      sideContent={<NewFlowButton />}
    >
      <Paper withBorder mb={rem(50)}>
        <TableBooksSelection data={tableData} />
      </Paper>
    </PageFrame>
  );
}
