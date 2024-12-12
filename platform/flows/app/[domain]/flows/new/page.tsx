import { Metadata } from 'next';
import { NewFlowForm } from './FlowForm';

interface NewFlowPageProps {
  params: Promise<{
    domain: string;
  }>;
}

export const metadata: Metadata = {
  title: 'Create a new Flow | Flowbuilder',
};

const NewFlowPage = async ({ params }: NewFlowPageProps) => {
  const resolvedParams = await params;

  return (
    <>
      <NewFlowForm params={resolvedParams} />
    </>
  );
};

export default NewFlowPage;
