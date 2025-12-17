import {
  createComputeSuccess,
  createComputeError,
  generateEventId,
} from '#/lib/execution/computeRegistry';
import { extractArray, aggregate, AggregationType } from '../../computeUtils';
import type { ComputeResult } from '#/lib/execution/types';

/**
 * Reduce compute function
 * Aggregates array elements into a single value
 */
export const reduceCompute = async (
  input: Record<string, unknown>,
  node: { id: string; type: string; metadata?: Record<string, unknown> },
): Promise<ComputeResult> => {
  try {
    const metadata = node.metadata || {};
    const aggregationType =
      (metadata.aggregationType as AggregationType) || 'sum';
    const fieldPath = (metadata.fieldPath as string) || '';

    // Extract array from input
    let array = extractArray(input);

    if (!Array.isArray(array)) {
      throw new Error('Input must contain an array');
    }

    // If fieldPath is specified, extract that field from each item
    if (fieldPath) {
      array = array.map((item) => {
        if (typeof item === 'object' && item !== null && fieldPath in item) {
          return (item as Record<string, unknown>)[fieldPath];
        }
        return item;
      });
    }

    // Aggregate the array
    const result = aggregate(array, aggregationType);

    const eventId = generateEventId('reduce');

    return createComputeSuccess({
      eventIds: [eventId],
      processedData: {
        [eventId]: {
          result,
          inputLength: array.length,
          aggregationType,
        },
      },
    });
  } catch (error) {
    return createComputeError(error);
  }
};

