// ==================================================================================
// Unified Compute Registry
// ==================================================================================

import type {
  ComputeFunction,
  ComputeCategory,
  ComputeRegistryEntry,
  ComputeResult,
} from './types';

// ==================================================================================
// Registry Types
// ==================================================================================

interface ComputeRegistry {
  [key: string]: ComputeRegistryEntry;
}

// ==================================================================================
// Registry Instance
// ==================================================================================

const computeRegistry: ComputeRegistry = {};

// ==================================================================================
// Registry Functions
// ==================================================================================

/**
 * Register a compute function for a node type
 */
export const registerComputeFunction = (
  nodeType: string,
  fn: ComputeFunction,
  category: ComputeCategory = 'transform',
): void => {
  computeRegistry[nodeType] = { fn, category };
};

/**
 * Get the compute function for a node type
 */
export const getComputeFunction = (
  nodeType: string,
): ComputeFunction | undefined => {
  const entry = computeRegistry[nodeType];
  if (!entry) {
    console.warn(`No compute function registered for node type: ${nodeType}`);
    return undefined;
  }
  return entry.fn;
};

/**
 * Get the category of a compute function
 */
export const getComputeCategory = (
  nodeType: string,
): ComputeCategory | undefined => {
  return computeRegistry[nodeType]?.category;
};

/**
 * Check if a compute function is registered for a node type
 */
export const hasComputeFunction = (nodeType: string): boolean => {
  return nodeType in computeRegistry;
};

/**
 * Get all registered node types
 */
export const getRegisteredNodeTypes = (): string[] => {
  return Object.keys(computeRegistry);
};

/**
 * Get all node types by category
 */
export const getNodeTypesByCategory = (
  category: ComputeCategory,
): string[] => {
  return Object.entries(computeRegistry)
    .filter(([, entry]) => entry.category === category)
    .map(([nodeType]) => nodeType);
};

// ==================================================================================
// Utility Functions
// ==================================================================================

/**
 * Creates a standardized compute success response
 */
export const createComputeSuccess = (
  data: {
    eventIds: string[];
    processedData: Record<string, unknown>;
  },
  errors?: Array<{ message: string; code?: string }>,
): ComputeResult => ({
  success: {
    eventIds: data.eventIds,
    timestamp: new Date().toISOString(),
    processedData: data.processedData,
    status: errors?.length ? 'partial' : 'success',
    errors,
  },
});

/**
 * Creates a standardized compute error response
 */
export const createComputeError = (
  error: unknown,
  partialSuccess?: {
    eventIds?: string[];
    processedData?: Record<string, unknown>;
  },
): ComputeResult => ({
  success: {
    eventIds: partialSuccess?.eventIds ?? [],
    timestamp: new Date().toISOString(),
    processedData: partialSuccess?.processedData ?? {},
    status: 'error',
    errors: [
      {
        message:
          error instanceof Error ? error.message : 'Unknown error occurred',
        code: 'COMPUTE_ERROR',
      },
    ],
  },
});

/**
 * Generate a unique event ID
 */
export const generateEventId = (prefix: string = 'evt'): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
};

// ==================================================================================
// Initialize Registry with Existing Compute Functions
// ==================================================================================

// Import compute functions from existing nodes
// These will be registered when the module is loaded

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

// Register AWS nodes
registerComputeFunction('awsLambda', awsLambdaCompute as ComputeFunction, 'transform');
registerComputeFunction('awsLambdaNode', awsLambdaCompute as ComputeFunction, 'transform');
registerComputeFunction('awsEventBridgeEvent', awsEventBridgeEventCompute as ComputeFunction, 'source');
registerComputeFunction('awsS3', awsS3Compute as ComputeFunction, 'destination');
registerComputeFunction('awsS3Node', awsS3Compute as ComputeFunction, 'destination');
registerComputeFunction('awsSns', awsSnsCompute as ComputeFunction, 'destination');
registerComputeFunction('awsSnsNode', awsSnsCompute as ComputeFunction, 'destination');
registerComputeFunction('awsSqs', awsSqsCompute as ComputeFunction, 'destination');
registerComputeFunction('awsSqsNode', awsSqsCompute as ComputeFunction, 'destination');

// Register general nodes
registerComputeFunction('cron', cronCompute as ComputeFunction, 'source');
registerComputeFunction('cronNode', cronCompute as ComputeFunction, 'source');
registerComputeFunction('webhookSource', webhookCompute as ComputeFunction, 'source');
registerComputeFunction('webhookDestination', webhookCompute as ComputeFunction, 'destination');
registerComputeFunction('webhookEnrichment', webhookCompute as ComputeFunction, 'transform');
registerComputeFunction('newSourceNode', newSourceNodeCompute as ComputeFunction, 'source');

// Register GPT nodes
registerComputeFunction('gptAnthropic', anthropicCompute as ComputeFunction, 'transform');
registerComputeFunction('anthropicGptNode', anthropicCompute as ComputeFunction, 'transform');
registerComputeFunction('gptOpenai', openaiCompute as ComputeFunction, 'transform');
registerComputeFunction('openaiGptNode', openaiCompute as ComputeFunction, 'transform');

// Register logic nodes
registerComputeFunction('editorJs', editorJsCompute as ComputeFunction, 'transform');
registerComputeFunction('javascriptEditorNode', editorJsCompute as ComputeFunction, 'transform');
registerComputeFunction('editorPython', editorPythonCompute as ComputeFunction, 'transform');
registerComputeFunction('pythonEditorNode', editorPythonCompute as ComputeFunction, 'transform');
registerComputeFunction('ifThenElse', ifThenElseCompute as ComputeFunction, 'transform');
registerComputeFunction('ifElseThenNode', ifThenElseCompute as ComputeFunction, 'transform');

// Register provider nodes
registerComputeFunction('githubEventReceiver', githubEventReceiverCompute as unknown as ComputeFunction, 'source');
registerComputeFunction('githubEventReceiverSource', githubEventReceiverCompute as unknown as ComputeFunction, 'source');

// Export the registry for debugging
export { computeRegistry };

