import { runFlowWebhookSource } from '#/lib/events/runWebhook';
import { NextRequest, NextResponse } from 'next/server';

export const GET = async (
  request: NextRequest,
  { params }: { params: Promise<{ hookId: string; domain: string }> },
) => {
  const { hookId } = await params;

  const response = await runFlowWebhookSource(hookId);

  const url = new URL(request.url);
  const queryParams = Object.fromEntries(url.searchParams.entries());

  console.log(`GET request processed for hookId: ${hookId}`);

  return NextResponse.json({
    message: `GET request received for hookId: ${hookId}`,
    queryParams,
    data: { response },
  });
};

export const POST = async (
  request: NextRequest,
  { params }: { params: Promise<{ hookId: string; domain: string }> },
) => {
  const { hookId } = await params;
  const response = await runFlowWebhookSource(hookId);

  const body = await request.json();

  console.log(`POST request processed for hookId: ${hookId}`);

  return NextResponse.json({
    message: `POST request received for hookId: ${hookId}`,
    data: { response, request: body },
  });
};

// Ensure this route is not cached
export const dynamic = 'force-dynamic';
