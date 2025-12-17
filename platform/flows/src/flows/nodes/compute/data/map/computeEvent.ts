import {
  createComputeSuccess,
  createComputeError,
  generateEventId,
} from '#/lib/execution/computeRegistry';
import { extractArray, evaluateExpression, isObject } from '../../computeUtils';
import type { ComputeResult } from '#/lib/execution/types';

/**
 * Map compute function
 * Transforms each element in an array
 */
export const mapCompute = async (
  input: Record<string, unknown>,
  node: { id: string; type: string; metadata?: Record<string, unknown> },
): Promise<ComputeResult> => {
  try {
    const metadata = node.metadata || {};
    const expression = (metadata.expression as string) || 'value';
    const outputField = (metadata.outputField as string) || '';

    // Extract array from input
    const array = extractArray(input);

    if (!Array.isArray(array)) {
      throw new Error('Input must contain an array');
    }

    // Map the array
    const mapped = array.map((item, index) => {
      // Create context for evaluation
      const context: Record<string, unknown> = {
        value: item,
        item,
        index,
      };

      // If item is an object, add its properties to context
      if (isObject(item)) {
        Object.assign(context, item);
      }

      // Evaluate expression
      const result = evaluateExpression(expression, context);

      // If outputField is specified, wrap in object
      if (outputField && result !== undefined) {
        return { [outputField]: result };
      }

      return result !== undefined ? result : item;
    });

    const eventId = generateEventId('map');

    return createComputeSuccess({
      eventIds: [eventId],
      processedData: {
        [eventId]: {
          array: mapped,
          length: mapped.length,
          expression,
        },
      },
    });
  } catch (error) {
    return createComputeError(error);
  }
};

