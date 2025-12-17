// 'use server';

/**
 * @deprecated This module is deprecated. Use `#/lib/execution` instead.
 * Webhook routes now use FlowExecutor directly.
 *
 * @see platform/flows/app/[domain]/events/webhook/[hookId]/route.ts
 * @see platform/flows/src/lib/execution/core.ts
 */

import { fetchNextNodes } from './logic';
import { runEvent } from './airTrafficControl';

// Deletes specified properties from an object if they exist.
export const deleteProperties = (obj: any, properties: string[]) => {
  properties.forEach((property) => {
    if (property in obj) {
      delete obj[property];
    }
  });
};

export const runFlowWebhookSource = async (hookId: string) => {
  console.log('INSIDE runFlowWebhookSource');
  const fetchedNextNodes = await fetchNextNodes(hookId);
  const { nextNodes } = fetchedNextNodes;

  // Take next actions
  // Placeholder for additional logic
  nextNodes.forEach((node) => {
    runEvent(node);
  });

  return fetchedNextNodes;
};
