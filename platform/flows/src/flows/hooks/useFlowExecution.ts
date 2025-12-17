'use client';

// ==================================================================================
// useFlowExecution - React Flow Execution Hook
// ==================================================================================

import { useCallback, useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import { FlowExecutor } from '#/lib/execution/core';
import { createClientContext } from '#/lib/execution/adapters/clientAdapter';
import type { ExecutionResult, ExecutionStatus } from '#/lib/execution/types';
import type { FbNode, FbEdge } from '../types';

/**
 * Execution state
 */
export interface FlowExecutionState {
  isExecuting: boolean;
  currentChainId: string | null;
  status: ExecutionStatus | null;
  result: ExecutionResult | null;
  error: string | null;
}

/**
 * Hook result type
 */
export interface FlowExecutionResult {
  /** Current execution state */
  state: FlowExecutionState;
  /** Execute the flow from a specific node or find source nodes */
  executeFlow: (startNodeId?: string, inputData?: Record<string, unknown>) => Promise<ExecutionResult | null>;
  /** Execute from all source nodes */
  executeFromSources: (inputData?: Record<string, unknown>) => Promise<ExecutionResult[]>;
  /** Stop current execution (if supported) */
  stopExecution: () => void;
  /** Reset execution state */
  resetState: () => void;
  /** Get chain status */
  getChainStatus: (chainId: string) => ReturnType<typeof FlowExecutor.getChainStatus>;
}

/**
 * Hook for executing flows in the browser
 *
 * Uses the FlowExecutor with client adapter to execute flows
 * using React Flow's in-memory state.
 *
 * @param options - Optional callbacks for execution events
 * @returns Execution controls and state
 *
 * @example
 * ```tsx
 * function FlowControls() {
 *   const { state, executeFlow, resetState } = useFlowExecution();
 *
 *   return (
 *     <div>
 *       <button
 *         onClick={() => executeFlow()}
 *         disabled={state.isExecuting}
 *       >
 *         {state.isExecuting ? 'Running...' : 'Run Flow'}
 *       </button>
 *       {state.error && <span className="error">{state.error}</span>}
 *       {state.status === 'completed' && <span>✓ Complete</span>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useFlowExecution(options?: {
  onExecutionStart?: (chainId: string) => void;
  onExecutionComplete?: (result: ExecutionResult) => void;
  onExecutionError?: (error: Error) => void;
  onNodeStart?: (nodeId: string, chainId: string) => void;
  onNodeComplete?: (nodeId: string, chainId: string, result: unknown) => void;
  onNodeError?: (nodeId: string, chainId: string, error: Error) => void;
}): FlowExecutionResult {
  const { getNodes, getEdges, updateNodeData } = useReactFlow<FbNode, FbEdge>();

  const [state, setState] = useState<FlowExecutionState>({
    isExecuting: false,
    currentChainId: null,
    status: null,
    result: null,
    error: null,
  });

  /**
   * Execute flow from a specific node
   */
  const executeFlow = useCallback(
    async (
      startNodeId?: string,
      inputData: Record<string, unknown> = {},
    ): Promise<ExecutionResult | null> => {
      const nodes = getNodes();
      const edges = getEdges();

      // If no start node specified, find source nodes
      let targetNodeId = startNodeId;
      if (!targetNodeId) {
        // Find nodes with no incoming edges (source nodes)
        const nodeIdsWithIncoming = new Set(edges.map((e) => e.target));
        const sourceNodes = nodes.filter((n) => !nodeIdsWithIncoming.has(n.id));

        if (sourceNodes.length === 0) {
          setState((prev) => ({
            ...prev,
            error: 'No source nodes found in flow',
          }));
          return null;
        }

        targetNodeId = sourceNodes[0].id;
      }

      setState({
        isExecuting: true,
        currentChainId: null,
        status: 'processing',
        result: null,
        error: null,
      });

      try {
        // Create client context with callbacks
        const context = createClientContext(nodes, edges, updateNodeData, {
          onNodeStart: options?.onNodeStart,
          onNodeComplete: options?.onNodeComplete,
          onNodeError: options?.onNodeError,
        });

        const executor = new FlowExecutor(context);
        const result = await executor.execute(targetNodeId, inputData);

        setState({
          isExecuting: false,
          currentChainId: result.chainId,
          status: result.status,
          result,
          error: result.error || null,
        });

        options?.onExecutionStart?.(result.chainId);

        if (result.status === 'completed') {
          options?.onExecutionComplete?.(result);
        } else if (result.status === 'error' && result.error) {
          options?.onExecutionError?.(new Error(result.error));
        }

        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';

        setState({
          isExecuting: false,
          currentChainId: null,
          status: 'error',
          result: null,
          error: errorMessage,
        });

        options?.onExecutionError?.(
          error instanceof Error ? error : new Error(errorMessage),
        );

        return null;
      }
    },
    [getNodes, getEdges, updateNodeData, options],
  );

  /**
   * Execute from all source nodes
   */
  const executeFromSources = useCallback(
    async (
      inputData: Record<string, unknown> = {},
    ): Promise<ExecutionResult[]> => {
      const nodes = getNodes();
      const edges = getEdges();

      // Find nodes with no incoming edges (source nodes)
      const nodeIdsWithIncoming = new Set(edges.map((e) => e.target));
      const sourceNodes = nodes.filter((n) => !nodeIdsWithIncoming.has(n.id));

      if (sourceNodes.length === 0) {
        setState((prev) => ({
          ...prev,
          error: 'No source nodes found in flow',
        }));
        return [];
      }

      const results: ExecutionResult[] = [];

      for (const sourceNode of sourceNodes) {
        const result = await executeFlow(sourceNode.id, inputData);
        if (result) {
          results.push(result);
        }
      }

      return results;
    },
    [getNodes, getEdges, executeFlow],
  );

  /**
   * Stop execution (placeholder - full implementation would need cancellation tokens)
   */
  const stopExecution = useCallback(() => {
    // Note: Full implementation would need cancellation support in FlowExecutor
    setState((prev) => ({
      ...prev,
      isExecuting: false,
      status: 'skipped',
      error: 'Execution stopped by user',
    }));
  }, []);

  /**
   * Reset execution state
   */
  const resetState = useCallback(() => {
    setState({
      isExecuting: false,
      currentChainId: null,
      status: null,
      result: null,
      error: null,
    });

    // Clear execution state from all nodes
    const nodes = getNodes();
    for (const node of nodes) {
      updateNodeData(node.id, {
        executionStatus: undefined,
        executionResult: undefined,
        executionError: undefined,
        executionChainId: undefined,
      });
    }
  }, [getNodes, updateNodeData]);

  /**
   * Get chain status
   */
  const getChainStatus = useCallback((chainId: string) => {
    return FlowExecutor.getChainStatus(chainId);
  }, []);

  return {
    state,
    executeFlow,
    executeFromSources,
    stopExecution,
    resetState,
    getChainStatus,
  };
}

/**
 * Hook to track execution status of a specific node
 */
export function useNodeExecutionStatus(nodeId: string): {
  status: ExecutionStatus | null;
  result: unknown;
  error: string | null;
} {
  const { getNode } = useReactFlow<FbNode, FbEdge>();

  const node = getNode(nodeId);
  const data = node?.data as Record<string, unknown> | undefined;

  return {
    status: (data?.executionStatus as ExecutionStatus) || null,
    result: data?.executionResult || null,
    error: (data?.executionError as string) || null,
  };
}

