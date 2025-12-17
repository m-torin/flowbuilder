'use client';

// ==================================================================================
// Client Adapter - React Flow-based Connection Resolution
// ==================================================================================

import type { Node, Edge } from '@xyflow/react';
import type { ExecutionContext, NodeConnection, ComputeFunction } from '../types';
import { getComputeFunction } from '../computeRegistry';

// ==================================================================================
// Types
// ==================================================================================

type UpdateNodeDataFn = (
  nodeId: string,
  data: Record<string, unknown>,
) => void;

// ==================================================================================
// Connection Resolution
// ==================================================================================

/**
 * Get connections for a node from React Flow state
 */
function getNodeConnectionsFromReactFlow(
  nodeId: string,
  nodes: Node[],
  edges: Edge[],
): NodeConnection[] {
  const connections: NodeConnection[] = [];

  // Find the current node
  const currentNode = nodes.find((n) => n.id === nodeId);
  if (!currentNode) {
    console.warn(`Node ${nodeId} not found in React Flow state`);
    return [];
  }

  // Find outgoing edges (this node is source)
  const outgoingEdges = edges.filter((e) => e.source === nodeId);
  for (const edge of outgoingEdges) {
    const targetNode = nodes.find((n) => n.id === edge.target);
    if (targetNode) {
      connections.push({
        sourceNode: {
          id: currentNode.id,
          type: currentNode.type || 'default',
          metadata: (currentNode.data as Record<string, unknown>) || {},
        },
        targetNode: {
          id: targetNode.id,
          type: targetNode.type || 'default',
          metadata: (targetNode.data as Record<string, unknown>) || {},
        },
        edge: {
          id: edge.id,
          label: typeof edge.label === 'string' ? edge.label : undefined,
        },
        direction: 'outgoing',
      });
    }
  }

  // Find incoming edges (this node is target)
  const incomingEdges = edges.filter((e) => e.target === nodeId);
  for (const edge of incomingEdges) {
    const sourceNode = nodes.find((n) => n.id === edge.source);
    if (sourceNode) {
      connections.push({
        sourceNode: {
          id: sourceNode.id,
          type: sourceNode.type || 'default',
          metadata: (sourceNode.data as Record<string, unknown>) || {},
        },
        targetNode: {
          id: currentNode.id,
          type: currentNode.type || 'default',
          metadata: (currentNode.data as Record<string, unknown>) || {},
        },
        edge: {
          id: edge.id,
          label: typeof edge.label === 'string' ? edge.label : undefined,
        },
        direction: 'incoming',
      });
    }
  }

  return connections;
}

/**
 * Get node data from React Flow state
 */
function getNodeDataFromReactFlow(
  nodeId: string,
  nodes: Node[],
): { id: string; type: string; metadata?: Record<string, unknown> } | null {
  const node = nodes.find((n) => n.id === nodeId);
  if (!node) return null;

  return {
    id: node.id,
    type: node.type || 'default',
    metadata: (node.data as Record<string, unknown>) || {},
  };
}

// ==================================================================================
// Create Client Context
// ==================================================================================

/**
 * Create an execution context for client-side execution
 * Uses React Flow state for connection resolution
 */
export function createClientContext(
  nodes: Node[],
  edges: Edge[],
  updateNodeData?: UpdateNodeDataFn,
  options?: {
    onNodeStart?: (nodeId: string, chainId: string) => void;
    onNodeComplete?: (nodeId: string, chainId: string, result: unknown) => void;
    onNodeError?: (nodeId: string, chainId: string, error: Error) => void;
  },
): ExecutionContext {
  return {
    getConnections: async (nodeId: string): Promise<NodeConnection[]> => {
      return getNodeConnectionsFromReactFlow(nodeId, nodes, edges);
    },
    getComputeFunction: (nodeType: string): ComputeFunction | undefined => {
      return getComputeFunction(nodeType);
    },
    getNodeData: (nodeId: string) => {
      return getNodeDataFromReactFlow(nodeId, nodes);
    },
    onNodeStart: (nodeId: string, chainId: string) => {
      // Update node visual state
      updateNodeData?.(nodeId, {
        executionStatus: 'processing',
        executionChainId: chainId,
      });
      options?.onNodeStart?.(nodeId, chainId);
    },
    onNodeComplete: (nodeId: string, chainId: string, result: unknown) => {
      // Update node with result
      updateNodeData?.(nodeId, {
        executionStatus: 'completed',
        executionResult: result,
        executionChainId: chainId,
      });
      options?.onNodeComplete?.(nodeId, chainId, result);
    },
    onNodeError: (nodeId: string, chainId: string, error: Error) => {
      // Update node with error
      updateNodeData?.(nodeId, {
        executionStatus: 'error',
        executionError: error.message,
        executionChainId: chainId,
      });
      options?.onNodeError?.(nodeId, chainId, error);
    },
  };
}

// Re-export for convenience
export { getNodeConnectionsFromReactFlow, getNodeDataFromReactFlow };

