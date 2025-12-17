import {
  createComputeSuccess,
  createComputeError,
  generateEventId,
} from '#/lib/execution/computeRegistry';
import { compare, ComparisonOperator } from '../../computeUtils';
import type { ComputeResult } from '#/lib/execution/types';

/**
 * Compare compute function
 * Compares two values using the specified operator
 */
export const compareCompute = async (
  input: Record<string, unknown>,
  node: { id: string; type: string; metadata?: Record<string, unknown> },
): Promise<ComputeResult> => {
  try {
    const metadata = node.metadata || {};
    const operator = (metadata.operator as ComparisonOperator) || 'eq';

    // Get values to compare
    // Either from explicit 'a' and 'b' inputs or first two values in input
    let valueA: unknown;
    let valueB: unknown;

    if ('a' in input && 'b' in input) {
      valueA = input.a;
      valueB = input.b;
    } else {
      const values = Object.values(input);
      valueA = values[0];
      valueB = values[1];
    }

    // Perform comparison
    const result = compare(valueA, valueB, operator);

    const eventId = generateEventId('compare');

    return createComputeSuccess({
      eventIds: [eventId],
      processedData: {
        [eventId]: {
          result,
          valueA,
          valueB,
          operator,
        },
      },
    });
  } catch (error) {
    return createComputeError(error);
  }
};

