# Compute Nodes Implementation Guide

## Overview

This guide explains how to implement compute nodes in the Flowbuilder application using React Flow's data flow capabilities. Compute nodes process input data from connected source nodes and produce output data for downstream nodes.

## Current Architecture

### Existing Compute Infrastructure

The codebase already has:
- **Compute Functions**: Each node type can define a `compute` function that processes input data
- **Compute Context**: Nodes have access to compute functions through `useCombinedContext`
- **Compute Types**: `ComputeFunction<T>` type for type-safe compute operations
- **Compute Results**: `ComputeResult` type with success/error handling

### React Flow Data Flow Capabilities

React Flow provides several hooks and utilities for implementing compute nodes:

1. **`useHandleConnections`** - Get connections for a specific handle (React Flow v12+)
2. **`useNodesData`** - Subscribe to data changes from specific nodes
3. **`getIncomers`** - Get all nodes that connect to this node (sources)
4. **`getOutgoers`** - Get all nodes that connect from this node (targets)
5. **`getConnectedEdges`** - Get all edges connected to a node

## Implementation Strategy

### 1. Data Flow Pattern

Compute nodes should follow this pattern:

```
Source Node → Compute Node → Target Node
   (data)      (process)      (result)
```

### 2. Key Components

#### A. Custom Handle Hook

Create a reusable hook to get data from connected source nodes:

```typescript
// src/flows/nodes/internal/useNodeDataFlow.ts
import { useHandleConnections, useNodesData } from '@xyflow/react';
import { useCallback, useMemo } from 'react';

export function useNodeDataFlow(nodeId: string, handleId?: string) {
  // Get connections for this handle (or all target connections)
  const connections = useHandleConnections({
    type: 'target',
    id: handleId, // Optional: specific handle ID
  });

  // Get data from all connected source nodes
  const sourceNodeIds = useMemo(
    () => connections?.map((conn) => conn.source) || [],
    [connections],
  );

  const sourceNodesData = useNodesData(sourceNodeIds);

  // Aggregate data from all sources
  const aggregatedInput = useMemo(() => {
    if (!sourceNodesData || sourceNodesData.length === 0) {
      return {};
    }

    return sourceNodesData.reduce((acc, nodeData) => {
      if (nodeData?.data) {
        // Merge data from all sources
        return { ...acc, ...nodeData.data };
      }
      return acc;
    }, {});
  }, [sourceNodesData]);

  return {
    connections,
    sourceNodesData,
    aggregatedInput,
    hasConnections: (connections?.length || 0) > 0,
  };
}
```

#### B. Compute Node Component Pattern

```typescript
// Example: SumNode.tsx
import { useEffect } from 'react';
import { useReactFlow, Position } from '@xyflow/react';
import { useNodeDataFlow } from '../internal/useNodeDataFlow';
import { useCombinedContext } from '../internal/contextHook';

export function SumNode({ id }: NodeProps) {
  const { updateNodeData } = useReactFlow();
  const { compute } = useCombinedContext();
  const { aggregatedInput } = useNodeDataFlow(id);

  // Execute compute function when input changes
  useEffect(() => {
    if (!compute || !aggregatedInput || Object.keys(aggregatedInput).length === 0) {
      return;
    }

    const executeCompute = async () => {
      try {
        const result = await compute(aggregatedInput, nodeData);

        // Update node data with result
        updateNodeData(id, {
          value: result.processedData,
          status: 'success',
        });
      } catch (error) {
        updateNodeData(id, {
          status: 'error',
          error: error.message,
        });
      }
    };

    executeCompute();
  }, [aggregatedInput, compute, id, updateNodeData]);

  return (
    <div className="compute-node">
      <Handle type="target" position={Position.Left} id="input" />
      <div>Sum: {nodeData.value || 0}</div>
      <Handle type="source" position={Position.Right} id="output" />
    </div>
  );
}
```

### 3. Enhanced Compute Context

Update the compute context to support React Flow's data flow:

```typescript
// src/flows/nodes/internal/contextHook.tsx
import { useHandleConnections, useNodesData } from '@xyflow/react';

export const useFbNode = <T extends Record<string, any>>({
  node: { initialNodeData, nodeProps, nodeMeta },
  form,
  modalTabs,
  compute,
}: UseFbNodeProps<T>) => {
  const nodeId = nodeProps.id;

  // Get incoming node connections
  const connections = useHandleConnections({
    type: 'target',
  });

  // Get data from source nodes
  const sourceNodeIds = useMemo(
    () => connections?.map((conn) => conn.source) || [],
    [connections],
  );

  const sourceNodesData = useNodesData(sourceNodeIds);

  // Enhanced compute wrapper that uses React Flow data
  const wrappedCompute = useCallback<ComputeFunction<T>>(
    async (input: Record<string, any>, data: T) => {
      try {
        if (!compute) {
          throw new Error('Compute function not provided');
        }

        // Merge input with data from connected nodes
        const mergedInput = {
          ...input,
          ...(sourceNodesData?.reduce((acc, nodeData) => {
            if (nodeData?.data) {
              return { ...acc, ...nodeData.data };
            }
            return acc;
          }, {}) || {}),
        };

        return await compute(mergedInput, data);
      } catch (error) {
        console.error('Compute error:', error);
        throw error;
      }
    },
    [compute, sourceNodesData],
  );

  // ... rest of implementation
};
```

### 4. Flow Execution Engine

For executing entire flows, create a flow execution engine:

```typescript
// src/flows/execution/flowExecutor.ts
import { Node, Edge, getIncomers, getOutgoers } from '@xyflow/react';

export interface FlowExecutionResult {
  nodeId: string;
  result: any;
  status: 'success' | 'error' | 'pending';
  error?: string;
}

export class FlowExecutor {
  private nodes: Node[];
  private edges: Edge[];
  private results: Map<string, FlowExecutionResult> = new Map();

  constructor(nodes: Node[], edges: Edge[]) {
    this.nodes = nodes;
    this.edges = edges;
  }

  /**
   * Execute flow starting from source nodes
   */
  async executeFlow(): Promise<Map<string, FlowExecutionResult>> {
    // Find source nodes (nodes with no incoming edges)
    const sourceNodes = this.nodes.filter(
      (node) => getIncomers(node, this.nodes, this.edges).length === 0,
    );

    // Execute source nodes first
    for (const sourceNode of sourceNodes) {
      await this.executeNode(sourceNode.id);
    }

    return this.results;
  }

  /**
   * Execute a single node and its dependencies
   */
  async executeNode(nodeId: string): Promise<FlowExecutionResult> {
    const node = this.nodes.find((n) => n.id === nodeId);
    if (!node) {
      throw new Error(`Node ${nodeId} not found`);
    }

    // Check if already executed
    if (this.results.has(nodeId)) {
      return this.results.get(nodeId)!;
    }

    // Get incoming nodes (dependencies)
    const incomers = getIncomers(node, this.nodes, this.edges);

    // Execute dependencies first
    const dependencyResults = await Promise.all(
      incomers.map((incomer) => this.executeNode(incomer.id)),
    );

    // Aggregate input from dependencies
    const input = dependencyResults.reduce((acc, result) => {
      return { ...acc, ...result.result };
    }, {});

    // Execute this node's compute function
    try {
      const computeFn = node.data?.compute;
      if (!computeFn) {
        throw new Error(`No compute function for node ${nodeId}`);
      }

      const result = await computeFn(input, node.data);

      const executionResult: FlowExecutionResult = {
        nodeId,
        result: result.processedData || result,
        status: 'success',
      };

      this.results.set(nodeId, executionResult);
      return executionResult;
    } catch (error) {
      const executionResult: FlowExecutionResult = {
        nodeId,
        result: null,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      this.results.set(nodeId, executionResult);
      return executionResult;
    }
  }

  /**
   * Get execution results for a specific node
   */
  getResult(nodeId: string): FlowExecutionResult | undefined {
    return this.results.get(nodeId);
  }
}
```

### 5. Real-time Compute Updates

For real-time updates as users modify the flow:

```typescript
// src/flows/hooks/useFlowExecution.ts
import { useEffect, useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import { FlowExecutor } from '../execution/flowExecutor';

export function useFlowExecution(autoExecute = false) {
  const { getNodes, getEdges, updateNodeData } = useReactFlow();

  const executeFlow = useCallback(async () => {
    const nodes = getNodes();
    const edges = getEdges();

    const executor = new FlowExecutor(nodes, edges);
    const results = await executor.executeFlow();

    // Update node data with results
    results.forEach((result, nodeId) => {
      updateNodeData(nodeId, {
        executionResult: result.result,
        executionStatus: result.status,
        executionError: result.error,
      });
    });

    return results;
  }, [getNodes, getEdges, updateNodeData]);

  useEffect(() => {
    if (autoExecute) {
      executeFlow();
    }
  }, [autoExecute, executeFlow]);

  return { executeFlow };
}
```

## Best Practices

### 1. Handle Circular Dependencies

```typescript
function detectCycles(nodes: Node[], edges: Edge[]): boolean {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function hasCycle(nodeId: string): boolean {
    if (recursionStack.has(nodeId)) return true;
    if (visited.has(nodeId)) return false;

    visited.add(nodeId);
    recursionStack.add(nodeId);

    const outgoers = getOutgoers(
      nodes.find((n) => n.id === nodeId)!,
      nodes,
      edges,
    );

    for (const outgoer of outgoers) {
      if (hasCycle(outgoer.id)) return true;
    }

    recursionStack.delete(nodeId);
    return false;
  }

  for (const node of nodes) {
    if (!visited.has(node.id) && hasCycle(node.id)) {
      return true;
    }
  }

  return false;
}
```

### 2. Error Handling

- Always wrap compute functions in try-catch
- Provide meaningful error messages
- Update node status to show errors visually
- Allow users to retry failed computations

### 3. Performance Optimization

- Use `useMemo` for expensive computations
- Debounce compute execution for rapid changes
- Cache results when inputs haven't changed
- Use `useCallback` for compute functions

### 4. Data Validation

- Validate input data before passing to compute functions
- Ensure output data is serializable
- Type-check data at runtime using Zod schemas

## Example: Complete Compute Node

```typescript
// src/flows/nodes/logic/sum/SumNode.tsx
import { useEffect, useMemo } from 'react';
import { NodeProps, Position, useReactFlow } from '@xyflow/react';
import { useNodeDataFlow } from '../../internal/useNodeDataFlow';
import { BaseNode } from '../../internal/BaseNode';

export function SumNode({ id, data }: NodeProps) {
  const { updateNodeData } = useReactFlow();
  const { aggregatedInput } = useNodeDataFlow(id, 'input');

  const sum = useMemo(() => {
    if (!aggregatedInput || Object.keys(aggregatedInput).length === 0) {
      return 0;
    }

    return Object.values(aggregatedInput).reduce((acc: number, val: any) => {
      const num = typeof val === 'number' ? val : parseFloat(val) || 0;
      return acc + num;
    }, 0);
  }, [aggregatedInput]);

  useEffect(() => {
    updateNodeData(id, { value: sum });
  }, [id, sum, updateNodeData]);

  return (
    <BaseNode>
      <Handle type="target" position={Position.Left} id="input" />
      <div className="sum-display">
        <h3>Sum</h3>
        <div className="value">{sum}</div>
      </div>
      <Handle type="source" position={Position.Right} id="output" />
    </BaseNode>
  );
}
```

## Next Steps

1. **Implement `useNodeDataFlow` hook** - Create the reusable hook for data flow
2. **Update existing compute nodes** - Enhance current nodes to use React Flow data flow
3. **Create FlowExecutor** - Build the execution engine for running entire flows
4. **Add execution UI** - Create UI components to show execution status and results
5. **Add cycle detection** - Prevent circular dependencies
6. **Performance optimization** - Add caching and debouncing

## References

- [React Flow Computing Flows Guide](https://reactflow.dev/learn/advanced-use/computing-flows)
- [React Flow API - useHandleConnections](https://reactflow.dev/api-reference/hooks/use-handle-connections) (v12+)
- [React Flow API - useNodesData](https://reactflow.dev/api-reference/hooks/use-nodes-data)
- [React Flow API - Graph Utilities](https://reactflow.dev/api-reference/utils/get-incomers)

## Important Notes

- **React Flow v12 API**: The codebase uses `@xyflow/react` v12, which uses `useHandleConnections` instead of `useNodeConnections`
- **Handle-based connections**: Connections are tracked per handle, allowing multiple inputs/outputs per node
- **Data flow**: Data flows from source nodes through compute nodes to target nodes via edges

