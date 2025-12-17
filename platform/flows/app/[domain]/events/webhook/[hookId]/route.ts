import { FlowExecutor } from '#/lib/execution/core';
import { createServerContext } from '#/lib/execution/adapters/serverAdapter';
import { NextRequest, NextResponse } from 'next/server';

export const GET = async (
  request: NextRequest,
  { params }: { params: Promise<{ hookId: string; domain: string }> },
) => {
  const { hookId } = await params;

  const url = new URL(request.url);
  const queryParams = Object.fromEntries(url.searchParams.entries());

  try {
    // Create execution context and executor
    const context = createServerContext();
    const executor = new FlowExecutor(context);

    // Execute the flow starting from the webhook node
    const result = await executor.execute(hookId, queryParams);

    console.log(`GET request processed for hookId: ${hookId}`, {
      chainId: result.chainId,
      status: result.status,
    });

    return NextResponse.json({
      message: `GET request received for hookId: ${hookId}`,
      queryParams,
      data: {
        chainId: result.chainId,
        status: result.status,
        payload: result.finalPayload,
      },
    });
  } catch (error) {
    console.error(`Error processing GET for hookId: ${hookId}`, error);
    return NextResponse.json(
      {
        message: `Error processing webhook`,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
};

export const POST = async (
  request: NextRequest,
  { params }: { params: Promise<{ hookId: string; domain: string }> },
) => {
  const { hookId } = await params;

  try {
    const body = await request.json();

    // Create execution context and executor
    const context = createServerContext();
    const executor = new FlowExecutor(context);

    // Execute the flow starting from the webhook node with body as input
    const result = await executor.execute(hookId, body);

    console.log(`POST request processed for hookId: ${hookId}`, {
      chainId: result.chainId,
      status: result.status,
    });

    return NextResponse.json({
      message: `POST request received for hookId: ${hookId}`,
      data: {
        chainId: result.chainId,
        status: result.status,
        payload: result.finalPayload,
        request: body,
      },
    });
  } catch (error) {
    console.error(`Error processing POST for hookId: ${hookId}`, error);
    return NextResponse.json(
      {
        message: `Error processing webhook`,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
};

// Ensure this route is not cached
export const dynamic = 'force-dynamic';
