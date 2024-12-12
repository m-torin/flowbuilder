'use server';

import {
  createFlow,
  getFlow,
  getFlows,
  getSecretsByFlowId,
  getFlowsBySubdomain,
} from '#/lib/prisma/ormApi';
import {
  FlowValues,
  prisma,
  Secret,
  Tag,
  Flow as PrismaFlow,
  Node as PrismaNode,
  Edge as PrismaEdge,
} from '#/lib/prisma';
import { Prisma } from '@prisma/client';
import { DbData } from '@/app/[domain]/flow/[cuid]/types';

/**
 * Gets a single flow by its unique identifier and instance ID along with secrets and tags.
 * @param {string} flowId - The unique identifier of the flow.
 * @param {string} instanceId - The instance identifier of the flow.
 * @returns {Promise<{ flow: PrismaFlow | null, secrets: Secret[], tags: Tag[] } | null>}
 */
export const getFlowAction = async (
  flowId: string,
  instanceId: string,
): Promise<DbData | null> => {
  try {
    console.log('🔍 Fetching flow with:', { flowId, instanceId });

    const flow = await getFlow(flowId, instanceId);
    // console.log('📥 Raw flow data:', JSON.stringify(flow, null, 2));

    if (!flow) return null;

    const dbData: DbData = {
      flow,
      tags: flow.tags ?? [],
      secrets: flow.secrets ?? [],
    };

    // console.log('📤 Transformed DbData:', JSON.stringify(dbData, null, 2));
    return dbData;
  } catch (error) {
    console.error('❌ getFlowAction error:', error);
    return null;
  }
};

/**
 * Gets all flows associated with a specific instance.
 * @param {string} instanceId - The instance identifier to fetch flows for.
 * @returns {Promise<Flow[]>} - A promise that resolves to an array of flows.
 */
export const getFlowsAction = async (
  instanceId: string,
): Promise<PrismaFlow[]> => {
  console.log('getFlowsAction', instanceId);
  return await getFlows(instanceId);
};

/**
 * Fetches all flows associated with a specific subdomain.
 * @param {string} subdomain - The subdomain to fetch flows for.
 * @returns {Promise<ReturnType<typeof getFlowsBySubdomain>>} - A promise that resolves to the flows of the subdomain.
 */
export const getFlowsBySubdomainAction = async (
  subdomain: string,
): Promise<ReturnType<typeof getFlowsBySubdomain>> => {
  console.log('getFlowsBySubdomainAction', subdomain);
  return await getFlowsBySubdomain(subdomain);
};

/**
 * Creates a new flow with the provided values.
 * @param {FlowValues} values - The values needed to create the flow.
 * @returns {Promise<ReturnType<typeof createFlow>>} - A promise that resolves to the newly created flow.
 */
export const createFlowAction = async (
  values: FlowValues,
): Promise<ReturnType<typeof createFlow>> => {
  console.log('createFlowAction', JSON.stringify(values));
  return await createFlow(
    values.instanceId,
    values.flowName,
    values.flowMethod,
    values.authorId,
    [],
  );
};
