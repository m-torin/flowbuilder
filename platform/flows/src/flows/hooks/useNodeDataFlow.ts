'use client';

// ==================================================================================
// useNodeDataFlow - React Flow Data Flow Hook
// ==================================================================================

import { useHandleConnections, useNodesData } from '@xyflow/react';
import { useMemo } from 'react';

/**
 * Connection info from React Flow
 */
export interface ConnectionInfo {
  source: string;
  sourceHandle?: string | null;
  target: string;
  targetHandle?: string | null;
}

/**
 * Hook result type
 */
export interface NodeDataFlowResult {
  /** All connections to this node's target handles */
  connections: ConnectionInfo[];
  /** Data from all connected source nodes */
  sourceNodesData: Array<{ id: string; data: Record<string, unknown> }>;
  /** Aggregated input data from all sources */
  aggregatedInput: Record<string, unknown>;
  /** Whether this node has any incoming connections */
  hasConnections: boolean;
  /** Number of connected source nodes */
  connectionCount: number;
}

/**
 * Hook to get data from connected source nodes
 *
 * Uses React Flow v12's useHandleConnections and useNodesData hooks
 * to automatically subscribe to data changes from connected nodes.
 *
 * @param handleId - Optional handle ID to filter connections (for multi-handle nodes)
 * @returns Object containing connection info and aggregated data
 *
 * @example
 * ```tsx
 * function MyComputeNode({ id }: NodeProps) {
 *   const { aggregatedInput, hasConnections } = useNodeDataFlow();
 *
 *   useEffect(() => {
 *     if (hasConnections && Object.keys(aggregatedInput).length > 0) {
 *       // Process the aggregated input
 *       const result = compute(aggregatedInput);
 *       updateNodeData(id, { result });
 *     }
 *   }, [aggregatedInput, hasConnections, id]);
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function useNodeDataFlow(handleId?: string): NodeDataFlowResult {
  // Get connections for this node's target handles
  const connections = useHandleConnections({
    type: 'target',
    id: handleId,
  });

  // Extract source node IDs from connections
  const sourceNodeIds = useMemo(
    () => connections?.map((conn) => conn.source) || [],
    [connections],
  );

  // Subscribe to data changes from source nodes
  const sourceNodesData = useNodesData(sourceNodeIds);

  // Aggregate data from all source nodes
  const aggregatedInput = useMemo(() => {
    if (!sourceNodesData || sourceNodesData.length === 0) {
      return {};
    }

    return sourceNodesData.reduce<Record<string, unknown>>((acc, nodeData) => {
      if (nodeData?.data) {
        const data = nodeData.data as Record<string, unknown>;

        // If the node has execution result, use that
        if (data.executionResult) {
          const result = data.executionResult as Record<string, unknown>;
          if (result.success) {
            const success = result.success as {
              processedData?: Record<string, unknown>;
              eventIds?: string[];
            };
            if (success.processedData && success.eventIds?.[0]) {
              const processedItem = success.processedData[success.eventIds[0]];
              if (typeof processedItem === 'object' && processedItem !== null) {
                return { ...acc, ...(processedItem as Record<string, unknown>) };
              }
            }
          }
        }

        // Otherwise, merge all data (ensure it's an object)
        if (typeof data === 'object' && data !== null) {
          return { ...acc, ...data };
        }
      }
      return acc;
    }, {});
  }, [sourceNodesData]);

  // Transform sourceNodesData to the expected format
  const transformedSourceData = useMemo(() => {
    return (
      sourceNodesData?.map((node) => ({
        id: node.id,
        data: (node.data as Record<string, unknown>) || {},
      })) || []
    );
  }, [sourceNodesData]);

  return {
    connections: connections || [],
    sourceNodesData: transformedSourceData,
    aggregatedInput,
    hasConnections: (connections?.length || 0) > 0,
    connectionCount: connections?.length || 0,
  };
}

/**
 * Hook to get data from a specific source handle
 *
 * Useful for nodes with multiple input handles that need different data
 *
 * @param handleId - The specific handle ID to get data for
 * @returns Object containing connection info and data for that handle
 */
export function useHandleData(handleId: string): NodeDataFlowResult {
  return useNodeDataFlow(handleId);
}

/**
 * Combine data from multiple handles
 *
 * @param handleIds - Array of handle IDs to combine data from
 * @returns Combined data from all handles
 */
export function useMultiHandleData(
  handleIds: string[],
): Record<string, NodeDataFlowResult> {
  // Note: This is a simplified implementation
  // In practice, you'd call useNodeDataFlow for each handle
  const results: Record<string, NodeDataFlowResult> = {};

  for (const handleId of handleIds) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    results[handleId] = useNodeDataFlow(handleId);
  }

  return results;
}

