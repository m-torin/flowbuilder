import { Metadata } from 'next';
import { InstanceHomeUI } from './UI';

interface NewFlowPageProps {
  params: Promise<{
    domain: string;
  }>;
}

export const metadata: Metadata = {
  title: 'Say hi to Flowbuilder',
};

const NewFlowPage = async ({ params }: NewFlowPageProps) => {
  return (
    <>
      <InstanceHomeUI />
    </>
  );
};

export default NewFlowPage;
