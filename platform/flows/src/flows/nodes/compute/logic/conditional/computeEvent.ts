import {
  createComputeSuccess,
  createComputeError,
  generateEventId,
} from '#/lib/execution/computeRegistry';
import { evaluateExpression } from '../../computeUtils';
import type { ComputeResult } from '#/lib/execution/types';

/**
 * Conditional compute function
 * Evaluates a condition and routes to true or false branch
 */
export const conditionalCompute = async (
  input: Record<string, unknown>,
  node: { id: string; type: string; metadata?: Record<string, unknown> },
): Promise<ComputeResult> => {
  try {
    const metadata = node.metadata || {};
    const condition = (metadata.condition as string) || 'value == true';

    // Evaluate condition
    let result: boolean;

    // If input has a direct boolean 'condition' field, use it
    if (typeof input.condition === 'boolean') {
      result = input.condition;
    } else {
      // Otherwise evaluate the expression
      const evaluated = evaluateExpression(condition, input);
      result = evaluated === true;
    }

    const eventId = generateEventId('conditional');

    return createComputeSuccess({
      eventIds: [eventId],
      processedData: {
        [eventId]: {
          result,
          branch: result ? 'true' : 'false',
          input,
          condition,
        },
      },
    });
  } catch (error) {
    return createComputeError(error);
  }
};

