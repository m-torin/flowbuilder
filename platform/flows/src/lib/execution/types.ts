// ==================================================================================
// Execution Types
// ==================================================================================

/**
 * Represents a connection between two nodes
 */
export interface NodeConnection {
  sourceNode: {
    id: string;
    type: string;
    metadata?: Record<string, unknown>;
  };
  targetNode: {
    id: string;
    type: string;
    metadata?: Record<string, unknown>;
  };
  edge: {
    id: string;
    label?: string | null;
  };
  direction: 'incoming' | 'outgoing';
}

/**
 * Execution status for a node
 */
export type ExecutionStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'error'
  | 'skipped';

/**
 * Represents a node in the execution tree
 */
export interface ExecutionNode {
  nodeId: string;
  type?: string;
  payload: unknown;
  status: ExecutionStatus;
  result: unknown;
  error?: string;
  startTime: string;
  endTime?: string;
  children: ExecutionNode[];
}

/**
 * Result of a flow execution
 */
export interface ExecutionResult {
  chainId: string;
  status: ExecutionStatus;
  rootNode: ExecutionNode;
  finalPayload: unknown;
  error?: string;
}

/**
 * Compute function type - processes input data and returns result
 */
export type ComputeFunction = (
  input: Record<string, unknown>,
  node: { id: string; type: string; metadata?: Record<string, unknown> },
  context?: Record<string, unknown>,
) => Promise<ComputeResult>;

/**
 * Result from a compute function
 */
export interface ComputeResult {
  success: {
    eventIds: string[];
    timestamp: string;
    processedData: Record<string, unknown>;
    status: 'success' | 'error' | 'partial';
    errors?: Array<{ message: string; code?: string }>;
  };
}

/**
 * Category of compute function
 */
export type ComputeCategory = 'source' | 'transform' | 'destination';

/**
 * Registry entry for a compute function
 */
export interface ComputeRegistryEntry {
  fn: ComputeFunction;
  category: ComputeCategory;
}

/**
 * Context for execution - adapter pattern
 * Allows different implementations for server (Prisma) and client (React Flow)
 */
export interface ExecutionContext {
  /**
   * Get connections for a node
   */
  getConnections: (nodeId: string) => Promise<NodeConnection[]>;

  /**
   * Get compute function for a node type
   */
  getComputeFunction: (nodeType: string) => ComputeFunction | undefined;

  /**
   * Get node data by ID (for client-side execution)
   */
  getNodeData?: (nodeId: string) => {
    id: string;
    type: string;
    metadata?: Record<string, unknown>;
  } | null;

  /**
   * Callback when node starts processing
   */
  onNodeStart?: (nodeId: string, chainId: string) => void;

  /**
   * Callback when node completes
   */
  onNodeComplete?: (
    nodeId: string,
    chainId: string,
    result: unknown,
  ) => void;

  /**
   * Callback when node errors
   */
  onNodeError?: (nodeId: string, chainId: string, error: Error) => void;
}

/**
 * Options for flow execution
 */
export interface ExecutionOptions {
  maxDepth?: number;
  timeout?: number;
  parallel?: boolean;
}

