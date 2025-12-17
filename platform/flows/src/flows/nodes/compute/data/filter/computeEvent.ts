import {
  createComputeSuccess,
  createComputeError,
  generateEventId,
} from '#/lib/execution/computeRegistry';
import {
  extractArray,
  evaluateExpression,
  isObject,
} from '../../computeUtils';
import type { ComputeResult } from '#/lib/execution/types';

/**
 * Filter compute function
 * Filters array elements based on a condition
 */
export const filterCompute = async (
  input: Record<string, unknown>,
  node: { id: string; type: string; metadata?: Record<string, unknown> },
): Promise<ComputeResult> => {
  try {
    const metadata = node.metadata || {};
    const condition = (metadata.condition as string) || 'value != null';
    const fieldPath = (metadata.fieldPath as string) || '';

    // Extract array from input
    const array = extractArray(input);

    if (!Array.isArray(array)) {
      throw new Error('Input must contain an array');
    }

    // Filter the array
    const filtered = array.filter((item) => {
      // Create context for evaluation
      const context: Record<string, unknown> = {
        value: item,
        item,
        index: array.indexOf(item),
      };

      // If item is an object, add its properties to context
      if (isObject(item)) {
        Object.assign(context, item);
      }

      // If fieldPath is specified, use that value
      if (fieldPath && isObject(item)) {
        const value = item[fieldPath];
        context.value = value;
      }

      // Evaluate condition
      const result = evaluateExpression(condition, context);
      return result === true;
    });

    const eventId = generateEventId('filter');

    return createComputeSuccess({
      eventIds: [eventId],
      processedData: {
        [eventId]: {
          array: filtered,
          originalLength: array.length,
          filteredLength: filtered.length,
          condition,
        },
      },
    });
  } catch (error) {
    return createComputeError(error);
  }
};

