// ==================================================================================
// Server Adapter - Prisma-based Connection Resolution
// ==================================================================================

import type { ExecutionContext, NodeConnection, ComputeFunction } from '../types';
import { getComputeFunction } from '../computeRegistry';
import { prisma } from '#/lib/prisma/client';
import type { Edge, Node } from '@prisma/client';

// ==================================================================================
// Types
// ==================================================================================

type NodeWithEdges = Node & {
  sourceEdges: (Edge & {
    targetNode: Node;
  })[];
  targetEdges: (Edge & {
    sourceNode: Node;
  })[];
};

// ==================================================================================
// Connection Resolution
// ==================================================================================

/**
 * Get connections for a node from the database
 */
async function getNodeConnections(nodeId: string): Promise<NodeConnection[]> {
  try {
    const baseNode = (await prisma.node.findFirst({
      where: {
        id: nodeId,
        deleted: false,
      },
      include: {
        sourceEdges: {
          where: {
            deleted: false,
          },
          include: {
            targetNode: true,
          },
        },
        targetEdges: {
          where: {
            deleted: false,
          },
          include: {
            sourceNode: true,
          },
        },
      },
    })) as NodeWithEdges | null;

    if (!baseNode) {
      console.warn(`Node with ID ${nodeId} not found or is deleted`);
      return [];
    }

    const { sourceEdges, targetEdges, ...baseNodeWithoutEdges } = baseNode;

    const connections: NodeConnection[] = [
      // Map outgoing connections (from this node to others)
      ...sourceEdges.map(({ targetNode, ...edge }) => ({
        sourceNode: {
          id: baseNodeWithoutEdges.id,
          type: baseNodeWithoutEdges.type,
          metadata: parseMetadata(baseNodeWithoutEdges.metadata),
        },
        targetNode: {
          id: targetNode.id,
          type: targetNode.type,
          metadata: parseMetadata(targetNode.metadata),
        },
        edge: {
          id: edge.id,
          label: edge.label,
        },
        direction: 'outgoing' as const,
      })),
      // Map incoming connections (from others to this node)
      ...targetEdges.map(({ sourceNode, ...edge }) => ({
        sourceNode: {
          id: sourceNode.id,
          type: sourceNode.type,
          metadata: parseMetadata(sourceNode.metadata),
        },
        targetNode: {
          id: baseNodeWithoutEdges.id,
          type: baseNodeWithoutEdges.type,
          metadata: parseMetadata(baseNodeWithoutEdges.metadata),
        },
        edge: {
          id: edge.id,
          label: edge.label,
        },
        direction: 'incoming' as const,
      })),
    ].filter(
      (conn) =>
        // Final validation to ensure no deleted nodes/edges are included
        conn.sourceNode && conn.targetNode,
    );

    return connections;
  } catch (error) {
    console.error('Error in getNodeConnections:', error);
    throw error;
  }
}

/**
 * Parse metadata from Prisma JSON value
 */
function parseMetadata(metadata: unknown): Record<string, unknown> {
  if (typeof metadata === 'object' && metadata !== null) {
    return metadata as Record<string, unknown>;
  }
  return {};
}

/**
 * Get node data from database
 */
async function getNodeData(
  nodeId: string,
): Promise<{ id: string; type: string; metadata?: Record<string, unknown> } | null> {
  try {
    const node = await prisma.node.findFirst({
      where: {
        id: nodeId,
        deleted: false,
      },
    });

    if (!node) return null;

    return {
      id: node.id,
      type: node.type,
      metadata: parseMetadata(node.metadata),
    };
  } catch (error) {
    console.error('Error getting node data:', error);
    return null;
  }
}

// ==================================================================================
// Create Server Context
// ==================================================================================

/**
 * Create an execution context for server-side execution
 * Uses Prisma database for connection resolution
 */
export function createServerContext(options?: {
  onNodeStart?: (nodeId: string, chainId: string) => void;
  onNodeComplete?: (nodeId: string, chainId: string, result: unknown) => void;
  onNodeError?: (nodeId: string, chainId: string, error: Error) => void;
}): ExecutionContext {
  return {
    getConnections: getNodeConnections,
    getComputeFunction: (nodeType: string): ComputeFunction | undefined => {
      return getComputeFunction(nodeType);
    },
    getNodeData: (nodeId: string) => {
      // Note: This returns null synchronously for server context
      // The actual data is fetched in getConnections
      return null;
    },
    onNodeStart: options?.onNodeStart,
    onNodeComplete: options?.onNodeComplete,
    onNodeError: options?.onNodeError,
  };
}

// Re-export for convenience
export { getNodeConnections };

