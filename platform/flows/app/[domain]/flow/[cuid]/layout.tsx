// layout.tsx

import { sanitizeFormName } from '#/lib';
import { getInstanceIdBySubdomainAction, getFlowAction } from '#/lib/prisma';
import { FlowProvider } from './FlowProvider';

interface FlowLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    domain: string;
    cuid: string;
  }>;
}

export default async function FlowLayout({
  children,
  params,
}: FlowLayoutProps) {
  // Await the params since they're now a Promise
  const { domain, cuid } = await params;

  const instanceId = await getInstanceIdBySubdomainAction(domain);
  if (!instanceId) throw new Error('Instance ID not found');

  const flowData = await getFlowAction(cuid, instanceId);
  console.log('🔍 Flow Data:', JSON.stringify(flowData, null, 2));

  const sanitizedCuid = sanitizeFormName(cuid);
  if (!sanitizedCuid) {
    throw new Error('Invalid CUID after sanitization');
  }

  const formOptions = {
    mode: 'uncontrolled' as const,
    name: `flow-${sanitizedCuid}`,
  };

  return (
    <FlowProvider
      formOptions={formOptions}
      nextParams={await params} // Pass the resolved params
      instanceId={instanceId}
      prismaData={flowData}
      error={null}
    >
      {children}
    </FlowProvider>
  );
}
