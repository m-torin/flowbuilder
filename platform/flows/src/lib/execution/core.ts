// ==================================================================================
// FlowExecutor - Unified Execution Core
// ==================================================================================

import {
  ExecutionContext,
  ExecutionNode,
  ExecutionOptions,
  ExecutionResult,
  ExecutionStatus,
  NodeConnection,
} from './types';

// ==================================================================================
// Execution Tracker
// ==================================================================================

/**
 * Tracks the state of execution chains
 * Singleton pattern to maintain state across the application
 */
class ExecutionTracker {
  private static instance: ExecutionTracker;
  private executions: Map<string, ExecutionNode>;

  private constructor() {
    this.executions = new Map();
  }

  static getInstance(): ExecutionTracker {
    if (!ExecutionTracker.instance) {
      ExecutionTracker.instance = new ExecutionTracker();
    }
    return ExecutionTracker.instance;
  }

  initializeChain(chainId: string, rootNodeId: string, nodeType?: string): void {
    this.executions.set(chainId, {
      nodeId: rootNodeId,
      type: nodeType,
      payload: null,
      status: 'pending',
      result: null,
      startTime: new Date().toISOString(),
      children: [],
    });
  }

  updateNodeStatus(
    chainId: string,
    nodeId: string,
    status: ExecutionStatus,
    result?: unknown,
    error?: string,
  ): void {
    const chain = this.executions.get(chainId);
    if (!chain) return;

    const updateNode = (node: ExecutionNode): boolean => {
      if (node.nodeId === nodeId) {
        node.status = status;
        if (result !== undefined) node.result = result;
        if (error) node.error = error;
        if (status === 'completed' || status === 'error') {
          node.endTime = new Date().toISOString();
        }
        return true;
      }
      return node.children.some(updateNode);
    };

    updateNode(chain);
  }

  addChildNode(
    chainId: string,
    parentId: string,
    childId: string,
    nodeType?: string,
  ): void {
    const chain = this.executions.get(chainId);
    if (!chain) return;

    const addChild = (node: ExecutionNode): boolean => {
      if (node.nodeId === parentId) {
        node.children.push({
          nodeId: childId,
          type: nodeType,
          payload: null,
          status: 'pending',
          result: null,
          startTime: new Date().toISOString(),
          children: [],
        });
        return true;
      }
      return node.children.some(addChild);
    };

    addChild(chain);
  }

  getChainStatus(chainId: string): ExecutionNode | null {
    return this.executions.get(chainId) || null;
  }

  cleanupOldChains(maxAgeMs: number = 3600000): void {
    const now = Date.now();
    for (const [chainId, execution] of this.executions.entries()) {
      const startTime = new Date(execution.startTime).getTime();
      if (now - startTime > maxAgeMs) {
        this.executions.delete(chainId);
      }
    }
  }

  clearChain(chainId: string): void {
    this.executions.delete(chainId);
  }
}

// ==================================================================================
// Process Context
// ==================================================================================

interface ProcessContext {
  processedNodes: Set<string>;
  maxDepth: number;
  currentDepth: number;
  chainId: string;
}

// ==================================================================================
// FlowExecutor Class
// ==================================================================================

/**
 * FlowExecutor - Context-agnostic flow execution engine
 *
 * Uses the adapter pattern to work with different connection sources:
 * - Server: Prisma database connections
 * - Client: React Flow in-memory connections
 */
export class FlowExecutor {
  private context: ExecutionContext;
  private tracker: ExecutionTracker;

  constructor(context: ExecutionContext) {
    this.context = context;
    this.tracker = ExecutionTracker.getInstance();
  }

  /**
   * Execute a flow starting from the given node
   */
  async execute(
    sourceNodeId: string,
    inputData: Record<string, unknown>,
    options: ExecutionOptions = {},
  ): Promise<ExecutionResult> {
    const chainId = `chain_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    const { maxDepth = 10 } = options;

    // Get source node info if available
    const sourceNode = this.context.getNodeData?.(sourceNodeId);

    this.tracker.initializeChain(chainId, sourceNodeId, sourceNode?.type);

    const processContext: ProcessContext = {
      processedNodes: new Set(),
      maxDepth,
      currentDepth: 0,
      chainId,
    };

    try {
      await this.processNode(sourceNodeId, inputData, processContext);

      const rootNode = this.tracker.getChainStatus(chainId);
      const finalPayload = this.getFinalPayload(rootNode);

      return {
        chainId,
        status: this.getOverallStatus(rootNode),
        rootNode: rootNode!,
        finalPayload,
      };
    } catch (error) {
      const rootNode = this.tracker.getChainStatus(chainId);
      return {
        chainId,
        status: 'error',
        rootNode: rootNode!,
        finalPayload: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Process a single node and its downstream connections
   */
  private async processNode(
    nodeId: string,
    inputData: unknown,
    context: ProcessContext,
  ): Promise<void> {
    const { chainId, maxDepth, currentDepth, processedNodes } = context;

    // Check max depth
    if (currentDepth >= maxDepth) {
      this.tracker.updateNodeStatus(
        chainId,
        nodeId,
        'skipped',
        null,
        'Max depth exceeded',
      );
      return;
    }

    // Check for cycles
    if (processedNodes.has(nodeId)) {
      this.tracker.updateNodeStatus(
        chainId,
        nodeId,
        'skipped',
        null,
        'Cycle detected',
      );
      return;
    }

    // Mark node as being processed
    processedNodes.add(nodeId);
    this.tracker.updateNodeStatus(chainId, nodeId, 'processing');
    this.context.onNodeStart?.(nodeId, chainId);

    try {
      // Get node connections
      const connections = await this.context.getConnections(nodeId);

      // Find current node info
      const currentNodeConn = connections.find(
        (conn) =>
          conn.sourceNode.id === nodeId || conn.targetNode.id === nodeId,
      );

      if (!currentNodeConn) {
        // No connections - this is a terminal node
        this.tracker.updateNodeStatus(chainId, nodeId, 'completed', inputData);
        this.context.onNodeComplete?.(nodeId, chainId, inputData);
        return;
      }

      // Get current node reference
      const currentNode =
        nodeId === currentNodeConn.sourceNode.id
          ? currentNodeConn.sourceNode
          : currentNodeConn.targetNode;

      // Get compute function
      const computeFn = this.context.getComputeFunction(currentNode.type);

      if (!computeFn) {
        this.tracker.updateNodeStatus(
          chainId,
          nodeId,
          'error',
          null,
          `No compute function for type: ${currentNode.type}`,
        );
        this.context.onNodeError?.(
          nodeId,
          chainId,
          new Error(`No compute function for type: ${currentNode.type}`),
        );
        return;
      }

      // Execute computation
      const result = await computeFn(
        inputData as Record<string, unknown>,
        currentNode,
      );

      // Update tracker with result
      this.tracker.updateNodeStatus(chainId, nodeId, 'completed', result);
      this.context.onNodeComplete?.(nodeId, chainId, result);

      // Find downstream nodes
      const downstream = connections.filter(
        (conn): conn is NodeConnection =>
          conn.direction === 'outgoing' && conn.sourceNode.id === nodeId,
      );

      // Process downstream nodes
      for (const connection of downstream) {
        const targetNodeId = connection.targetNode.id;
        const targetType = connection.targetNode.type;

        // Add child to execution tracker
        this.tracker.addChildNode(chainId, nodeId, targetNodeId, targetType);

        // Recursive processing
        await this.processNode(targetNodeId, result, {
          ...context,
          currentDepth: currentDepth + 1,
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';

      this.tracker.updateNodeStatus(chainId, nodeId, 'error', null, errorMessage);
      this.context.onNodeError?.(
        nodeId,
        chainId,
        error instanceof Error ? error : new Error(errorMessage),
      );

      throw error;
    }
  }

  /**
   * Get the final payload from the execution tree
   */
  private getFinalPayload(node: ExecutionNode | null): unknown {
    if (!node) return null;

    const getNodePayload = (n: ExecutionNode): unknown => {
      const result = n.result as Record<string, unknown> | null;
      if (result?.success) {
        const success = result.success as {
          processedData?: Record<string, unknown>;
          eventIds?: string[];
        };
        if (success.processedData && success.eventIds?.[0]) {
          const data = success.processedData[success.eventIds[0]];
          // Skip webhook destination format responses
          if (
            data &&
            typeof data === 'object' &&
            !('format' in data && 'contentType' in data)
          ) {
            return data;
          }
        }
      }
      return null;
    };

    // Get last meaningful transformation
    const payload = getNodePayload(node);
    if (node.children.length > 0) {
      const childPayload = this.getFinalPayload(
        node.children[node.children.length - 1],
      );
      return childPayload || payload;
    }
    return payload;
  }

  /**
   * Get overall status of the execution
   */
  private getOverallStatus(node: ExecutionNode | null): ExecutionStatus {
    if (!node) return 'error';

    const checkNode = (n: ExecutionNode): ExecutionStatus => {
      if (n.status === 'error') return 'error';
      if (n.status === 'processing' || n.status === 'pending') return 'processing';

      for (const child of n.children) {
        const childStatus = checkNode(child);
        if (childStatus === 'error') return 'error';
        if (childStatus === 'processing') return 'processing';
      }

      return n.status;
    };

    return checkNode(node);
  }

  /**
   * Get the current status of a chain
   */
  static getChainStatus(chainId: string): ExecutionNode | null {
    return ExecutionTracker.getInstance().getChainStatus(chainId);
  }

  /**
   * Check if a chain has completed
   */
  static isChainComplete(chainId: string): boolean {
    const status = FlowExecutor.getChainStatus(chainId);
    if (!status) return true;

    const checkNode = (node: ExecutionNode): boolean => {
      return (
        (node.status === 'completed' ||
          node.status === 'error' ||
          node.status === 'skipped') &&
        node.children.every(checkNode)
      );
    };

    return checkNode(status);
  }

  /**
   * Format execution tree for debugging
   */
  static formatExecutionTree(node: ExecutionNode, depth = 0): string {
    const indent = '  '.repeat(depth);
    let output = `${indent}Node: ${node.nodeId} (${node.type || 'unknown'})\n`;
    output += `${indent}Status: ${node.status}\n`;
    output += `${indent}Start: ${node.startTime}\n`;
    if (node.endTime) output += `${indent}End: ${node.endTime}\n`;
    if (node.error) output += `${indent}Error: ${node.error}\n`;
    if (node.result) {
      output += `${indent}Result: ${JSON.stringify(node.result, null, 2)}\n`;
    }

    node.children.forEach((child) => {
      output += FlowExecutor.formatExecutionTree(child, depth + 1);
    });

    return output;
  }
}

// ==================================================================================
// Cleanup interval for old chains (server-side only)
// ==================================================================================

if (typeof window === 'undefined') {
  setInterval(() => {
    ExecutionTracker.getInstance().cleanupOldChains();
  }, 3600000);
}

