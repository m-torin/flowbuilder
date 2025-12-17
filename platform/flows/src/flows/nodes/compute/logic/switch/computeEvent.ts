import {
  createComputeSuccess,
  createComputeError,
  generateEventId,
} from '#/lib/execution/computeRegistry';
import { evaluateExpression } from '../../computeUtils';
import type { ComputeResult } from '#/lib/execution/types';

interface SwitchCase {
  condition: string;
  output: string;
}

/**
 * Switch compute function
 * Routes data based on multiple conditions
 */
export const switchCompute = async (
  input: Record<string, unknown>,
  node: { id: string; type: string; metadata?: Record<string, unknown> },
): Promise<ComputeResult> => {
  try {
    const metadata = node.metadata || {};
    const cases = (metadata.cases as SwitchCase[]) || [];
    const defaultOutput = (metadata.defaultOutput as string) || 'default';

    // Evaluate each case in order
    let matchedCase: string | null = null;

    for (const switchCase of cases) {
      const result = evaluateExpression(switchCase.condition, input);
      if (result === true) {
        matchedCase = switchCase.output;
        break;
      }
    }

    const eventId = generateEventId('switch');

    return createComputeSuccess({
      eventIds: [eventId],
      processedData: {
        [eventId]: {
          matchedCase: matchedCase || defaultOutput,
          input,
          isDefault: matchedCase === null,
        },
      },
    });
  } catch (error) {
    return createComputeError(error);
  }
};

