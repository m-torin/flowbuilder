// computeRegistry.ts

import { Node } from '@prisma/client';
import {
  awsLambdaCompute,
  awsEventBridgeEventCompute,
  awsS3Compute,
  awsSnsCompute,
  awsSqsCompute,
} from '#/flows/nodes/aws';
import {
  cronCompute,
  webhookCompute,
  newSourceNodeCompute,
} from '#/flows/nodes/general';
import { anthropicCompute, openaiCompute } from '#/flows/nodes/gpt';
import {
  editorJsCompute,
  editorPythonCompute,
  ifThenElseCompute,
} from '#/flows/nodes/logic';
import { githubEventReceiverCompute } from '#/flows/nodes/providers/github';

/**
 * Type definition for compute functions.
 * Uses rest parameters for flexible argument passing.
 * Each compute function takes:
 * @param args Variable arguments passed to compute function
 * @returns Promise resolving to the computation result
 */
export type ComputeFunction = (...args: any[]) => Promise<any>;

/**
 * Registry mapping node types to their respective compute functions
 * Key: Node type identifier
 * Value: Compute function implementation
 */
interface ComputeRegistry {
  [key: string]: ComputeFunction;
}

/**
 * Registry of compute functions for each supported node type
 * Add new node types and their compute functions here
 */
export const computeRegistry: ComputeRegistry = {
  awsLambda: awsLambdaCompute,
  awsEventBridgeEvent: awsEventBridgeEventCompute,
  awsS3: awsS3Compute,
  awsSns: awsSnsCompute,
  awsSqs: awsSqsCompute,
  cron: cronCompute,
  githubEventReceiver: githubEventReceiverCompute,
  webhookSource: webhookCompute,
  webhookDestination: webhookCompute,
  webhookEnrichment: webhookCompute,
  newSourceNode: newSourceNodeCompute,
  gptAnthropic: anthropicCompute,
  gptOpenai: openaiCompute,
  editorJs: editorJsCompute,
  javascriptEditorNode: editorJsCompute,
  editorPython: editorPythonCompute,
  ifThenElse: ifThenElseCompute,
};

/**
 * Retrieves the compute function for a specific node type
 * @param nodeType The type identifier of the node
 * @returns The compute function for the node type or undefined if not found
 */
export const getComputeFunction = (
  nodeType: string,
): ComputeFunction | undefined => {
  const computeFn = computeRegistry[nodeType];
  if (!computeFn) {
    console.warn(`No compute function registered for node type: ${nodeType}`);
  }
  return computeFn;
};

/**
 * Gets compute functions for an array of nodes
 * Useful for preparing batch processing of multiple nodes
 *
 * @param nodes Array of nodes to get compute functions for
 * @returns Map of node IDs to their compute functions
 */
export const getDownstreamComputeFunctions = (
  nodes: Node[],
): Map<string, ComputeFunction> => {
  const computeFunctions = new Map<string, ComputeFunction>();

  for (const node of nodes) {
    const computeFunction = getComputeFunction(node.type);
    if (computeFunction) {
      computeFunctions.set(node.id, computeFunction);
    } else {
      console.warn(
        `Skipping node ${node.id}: No compute function found for type ${node.type}`,
      );
    }
  }

  return computeFunctions;
};

/**
 * Processes data through a sequence of compute functions
 * Executes each node's computation in the order provided
 *
 * @param initialData The initial data to process
 * @param nodes Array of nodes to process through
 * @param context Optional context data to pass to compute functions
 * @returns Object mapping node IDs to their computation results
 */
export const processComputeChain = async (
  initialData: Record<string, any>,
  nodes: Node[],
  context?: Record<string, any>,
): Promise<Record<string, any>> => {
  console.log('Starting compute chain processing:', {
    nodeCount: nodes.length,
    nodeTypes: nodes.map((n) => n.type),
    hasContext: !!context,
  });

  const results: Record<string, any> = {};

  for (const node of nodes) {
    const computeFunction = getComputeFunction(node.type);
    if (computeFunction) {
      try {
        console.log(`Processing node ${node.id} of type ${node.type}`);
        results[node.id] = await computeFunction(initialData, node, context);
        console.log(`Completed processing node ${node.id}`);
      } catch (error) {
        console.error(`Compute failed for node ${node.id}:`, error);
        results[node.id] = {
          error:
            error instanceof Error ? error.message : 'Unknown error occurred',
          nodeId: node.id,
          nodeType: node.type,
        };
      }
    }
  }

  console.log('Compute chain processing complete:', {
    processedNodes: Object.keys(results).length,
    successfulNodes: Object.keys(results).filter((k) => !results[k].error)
      .length,
    failedNodes: Object.keys(results).filter((k) => results[k].error).length,
  });

  return results;
};
