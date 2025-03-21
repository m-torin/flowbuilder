// 'use server';

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
