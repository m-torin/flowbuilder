'use client';

// ==================================================================================
// BaseComputeNode - Base component for compute nodes
// ==================================================================================

import React, { useEffect, useCallback, ReactNode } from 'react';
import { Position, useReactFlow } from '@xyflow/react';
import { Paper, Text, Stack, Badge, Group, Loader } from '@mantine/core';
import { useNodeDataFlow } from '#/flows/hooks/useNodeDataFlow';
import { CustomHandle } from '../internal/CustomHandle';
import type { FbNodeProps } from '#/flows/types';
import type { ExecutionStatus } from '#/lib/execution/types';

// ==================================================================================
// Types
// ==================================================================================

export interface ComputeNodeConfig {
  /** Node display name */
  displayName: string;
  /** Node description */
  description?: string;
  /** Input handles configuration */
  inputs?: Array<{
    id: string;
    label: string;
    position?: Position;
  }>;
  /** Output handles configuration */
  outputs?: Array<{
    id: string;
    label: string;
    position?: Position;
  }>;
  /** Whether the node auto-computes when inputs change */
  autoCompute?: boolean;
  /** Color theme */
  color?: string;
}

export interface BaseComputeNodeProps extends FbNodeProps {
  /** Node configuration */
  config: ComputeNodeConfig;
  /** Compute function */
  compute: (input: Record<string, unknown>) => Promise<unknown> | unknown;
  /** Custom render function for the node body */
  renderBody?: (props: {
    input: Record<string, unknown>;
    output: unknown;
    status: ExecutionStatus | null;
    error: string | null;
  }) => ReactNode;
  /** Children to render inside the node */
  children?: ReactNode;
}

// ==================================================================================
// Status Badge Component
// ==================================================================================

function StatusBadge({ status }: { status: ExecutionStatus | null }) {
  if (!status) return null;

  const colorMap: Record<ExecutionStatus, string> = {
    pending: 'gray',
    processing: 'blue',
    completed: 'green',
    error: 'red',
    skipped: 'yellow',
  };

  return (
    <Badge size="xs" color={colorMap[status]} variant="light">
      {status}
    </Badge>
  );
}

// ==================================================================================
// BaseComputeNode Component
// ==================================================================================

/**
 * Base component for compute nodes
 *
 * Provides:
 * - Automatic data flow from connected nodes
 * - Visual status indication
 * - Input/output handles
 * - Auto-compute capability
 *
 * @example
 * ```tsx
 * function SumNode(props: FbNodeProps) {
 *   const compute = (input: Record<string, unknown>) => {
 *     const values = Object.values(input).filter(v => typeof v === 'number');
 *     return values.reduce((a, b) => a + b, 0);
 *   };
 *
 *   return (
 *     <BaseComputeNode
 *       {...props}
 *       config={{
 *         displayName: 'Sum',
 *         inputs: [{ id: 'input', label: 'Values' }],
 *         outputs: [{ id: 'output', label: 'Result' }],
 *         autoCompute: true,
 *       }}
 *       compute={compute}
 *     />
 *   );
 * }
 * ```
 */
export function BaseComputeNode({
  id,
  data,
  selected,
  config,
  compute,
  renderBody,
  children,
}: BaseComputeNodeProps) {
  const { updateNodeData } = useReactFlow();
  const { aggregatedInput, hasConnections } = useNodeDataFlow();

  // Get execution status from node data
  const executionStatus = (data as Record<string, unknown>)
    ?.executionStatus as ExecutionStatus | null;
  const executionError = (data as Record<string, unknown>)
    ?.executionError as string | null;
  const computeResult = (data as Record<string, unknown>)?.computeResult;

  // Execute compute function
  const executeCompute = useCallback(async () => {
    if (!hasConnections || Object.keys(aggregatedInput).length === 0) {
      return;
    }

    try {
      updateNodeData(id, {
        executionStatus: 'processing',
        executionError: null,
      });

      const result = await compute(aggregatedInput);

      updateNodeData(id, {
        executionStatus: 'completed',
        computeResult: result,
        executionError: null,
      });
    } catch (error) {
      updateNodeData(id, {
        executionStatus: 'error',
        executionError:
          error instanceof Error ? error.message : 'Compute failed',
      });
    }
  }, [id, aggregatedInput, hasConnections, compute, updateNodeData]);

  // Auto-compute when inputs change
  useEffect(() => {
    if (config.autoCompute && hasConnections) {
      executeCompute();
    }
  }, [config.autoCompute, hasConnections, executeCompute]);

  // Default inputs/outputs
  const inputs = config.inputs || [
    { id: 'input', label: 'Input', position: Position.Left },
  ];
  const outputs = config.outputs || [
    { id: 'output', label: 'Output', position: Position.Right },
  ];

  return (
    <Paper
      shadow={selected ? 'md' : 'sm'}
      p="sm"
      radius="md"
      withBorder
      style={{
        minWidth: 150,
        borderColor: selected
          ? `var(--mantine-color-${config.color || 'blue'}-5)`
          : undefined,
        borderWidth: selected ? 2 : 1,
      }}
    >
      {/* Input Handles */}
      {inputs.map((input, index) => (
        <CustomHandle
          key={input.id}
          type="target"
          position={input.position || Position.Left}
          id={input.id}
          style={{
            top: `${((index + 1) / (inputs.length + 1)) * 100}%`,
          }}
        />
      ))}

      {/* Node Content */}
      <Stack gap="xs">
        <Group justify="space-between" wrap="nowrap">
          <Text size="sm" fw={600} truncate>
            {config.displayName}
          </Text>
          {executionStatus === 'processing' ? (
            <Loader size="xs" />
          ) : (
            <StatusBadge status={executionStatus} />
          )}
        </Group>

        {config.description && (
          <Text size="xs" c="dimmed">
            {config.description}
          </Text>
        )}

        {/* Custom body or children */}
        {renderBody
          ? renderBody({
              input: aggregatedInput,
              output: computeResult,
              status: executionStatus,
              error: executionError,
            })
          : children}

        {/* Error display */}
        {executionError && (
          <Text size="xs" c="red">
            {executionError}
          </Text>
        )}
      </Stack>

      {/* Output Handles */}
      {outputs.map((output, index) => (
        <CustomHandle
          key={output.id}
          type="source"
          position={output.position || Position.Right}
          id={output.id}
          style={{
            top: `${((index + 1) / (outputs.length + 1)) * 100}%`,
          }}
        />
      ))}
    </Paper>
  );
}

// ==================================================================================
// Higher-order component for creating compute nodes
// ==================================================================================

/**
 * Create a compute node component with a compute function
 */
export function createComputeNode(
  config: ComputeNodeConfig,
  computeFn: (input: Record<string, unknown>) => Promise<unknown> | unknown,
) {
  return function ComputeNodeComponent(props: FbNodeProps) {
    return <BaseComputeNode {...props} config={config} compute={computeFn} />;
  };
}

