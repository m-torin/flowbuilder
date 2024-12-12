// src/lib/prisma/ormApi/flow.ts

import { prisma } from '#/lib/prisma/client';
import {
  Node,
  Edge,
  FlowMethod,
  Prisma,
  Tag,
  Secret,
  Flow,
} from '@prisma/client';
import { upsertFlowWithNodesAndEdges } from './upsertFlow';
import { FullFlow } from './flowUtils';

/**
 * Represents a Flow along with its related entities.
 */
export type FlowWithRelations = {
  id: string;
  instanceId: string | null;
  name: string;
  method: FlowMethod;
  isEnabled: boolean;
  viewport?: Prisma.JsonValue;
  metadata?: Prisma.JsonValue; // Ensure metadata is included
  nodes?: Node[];
  edges?: Edge[];
  tags?: Tag[];
  secrets?: Secret[];
};

/**
 * Retrieves all flows associated with a specific instance ID.
 * @param instanceId - The ID of the instance.
 * @returns {Promise<Flow[]>} - An array of Flow objects.
 */
export const getFlows = async (instanceId: string): Promise<Flow[]> => {
  try {
    const flows = await prisma.flow.findMany({
      where: { instanceId: instanceId },
      include: { edges: true, nodes: true, tags: true, secrets: true },
    });
    return flows;
  } catch (error) {
    console.error('Failed to fetch flows:', error);
    return [];
  }
};

/**
 * Retrieves a specific flow by its ID and associated instance ID.
 * @param flowId - The ID of the flow.
 * @param instanceId - The ID of the instance.
 * @returns {Promise<FullFlow | null>} - The Flow object with relations or null if not found.
 */
export const getFlow = async (
  flowId: string,
  instanceId: string,
): Promise<FullFlow | null> => {
  try {
    const flow = await prisma.flow.findUnique({
      where: {
        id_instanceId: {
          id: flowId,
          instanceId: instanceId,
        },
      },
      include: { edges: true, nodes: true, tags: true, secrets: true },
    });
    // console.log('🔍 Flow db direct:', flow);
    return flow as FullFlow | null;
  } catch (error) {
    console.error(
      `Failed to fetch flow with ID ${flowId} and instance ID ${instanceId}:`,
      error,
    );
    return null;
  }
};

/**
 * Retrieves the instance ID associated with a specific flow ID.
 * @param flowId - The ID of the flow.
 * @returns {Promise<string | null>} - The instance ID or null if not found.
 */
export const getInstanceIdByFlow = async (
  flowId: string,
): Promise<string | null> => {
  try {
    const flow = await prisma.flow.findUnique({
      where: { id: flowId },
      select: { instanceId: true },
    });
    return flow?.instanceId || null;
  } catch (error) {
    console.error(`Failed to fetch flow with ID ${flowId}:`, error);
    throw error;
  }
};

/**
 * Retrieves all flows associated with a specific subdomain.
 * @param subdomain - The subdomain to search for.
 * @returns {Promise<Flow[]>} - An array of Flow objects.
 */
export const getFlowsBySubdomain = async (
  subdomain: string,
): Promise<
  (Flow & {
    statistics: {
      totalRuns: number;
      successfulRuns: number;
      failedRuns: number;
    };
  })[]
> => {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Find the instance by subdomain
      const instance = await tx.instance.findUnique({
        where: { subdomain: subdomain },
        select: { id: true },
      });

      if (!instance) {
        throw new Error(`Instance not found for subdomain: ${subdomain}`);
      }

      // Get flows with their statistics
      const flows = await tx.flow.findMany({
        where: {
          instanceId: instance.id,
          deleted: false,
        },
        include: {
          // Include existing flow runs statistics
          flowRuns: {
            select: {
              runStatus: true,
            },
          },
          // Add other includes you need
          tags: true,
          // owner: {
          //   select: {
          //     name: true
          //   }
          // }
        },
      });

      // Transform the data to include computed statistics
      return flows.map((flow) => {
        const stats = flow.flowRuns.reduce(
          (acc, run) => {
            acc.totalRuns++;
            if (run.runStatus === 'successful') acc.successfulRuns++;
            if (run.runStatus === 'failed') acc.failedRuns++;
            return acc;
          },
          { totalRuns: 0, successfulRuns: 0, failedRuns: 0 },
        );

        return {
          ...flow,
          statistics: stats,
          flowRuns: undefined, // Remove the raw flowRuns data
        };
      });
    });

    return result;
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error('Prisma error:', error.message);
    } else {
      console.error('Failed to fetch flows:', (error as Error).message);
    }
    return [];
  } finally {
    await prisma.$disconnect();
  }
};

/**
 * Creates a new flow with the specified details.
 * @param instanceId - The ID of the instance.
 * @param name - The name of the flow.
 * @param method - The method used for the flow.
 * @param authorId - The ID of the author creating the flow.
 * @param tagsIds - An array of tag IDs to associate with the flow.
 * @returns {Promise<Flow | null>} - The created Flow object or null if creation fails.
 */
export const createFlow = async (
  instanceId: string,
  name: string,
  method: FlowMethod,
  authorId: string,
  tagsIds: number[] = [],
): Promise<Flow | null> => {
  try {
    const flowData: Prisma.FlowCreateInput = {
      name,
      method,
      isEnabled: false,
      metadata: Prisma.JsonNull,
      instance: {
        connect: { id: instanceId },
      },
    };

    if (tagsIds.length > 0) {
      flowData.tags = {
        connect: tagsIds.map((id) => ({ id, instanceId })),
      };
    }

    const newFlow = await prisma.flow.create({
      data: flowData,
    });

    return newFlow;
  } catch (error) {
    console.error('Failed to create a new flow:', error);
    return null;
  }
};

/**
 * Saves or updates a flow along with its nodes, edges, tags, and secrets.
 * @param data - The flow data including nodes, edges, tags, and secrets.
 * @returns {Promise<FullFlow | null>} - The upserted flow object or null if the operation fails.
 */
export const saveFlow = async (data: any): Promise<FullFlow | null> => {
  try {
    // Extract necessary properties from 'data'
    const {
      flowId,
      instanceId,
      name,
      method,
      isEnabled,
      viewport,
      metadata,
      nodes,
      edges,
      tags,
      secrets,
      changedBy,
    } = data;

    // Ensure 'changedBy' is defined
    if (!changedBy) {
      throw new Error('changedBy is required to save the flow.');
    }

    // Prepare the flow object
    const flowData: FlowWithRelations = {
      id: flowId,
      instanceId,
      name,
      method,
      isEnabled,
      viewport,
      metadata, // Ensure metadata is included
      nodes,
      edges,
      tags,
      secrets,
    };

    // Call the upsert function with both arguments
    const updatedFlow = await upsertFlowWithNodesAndEdges(flowData, changedBy);
    return updatedFlow;
  } catch (error) {
    console.error('Error saving flow:', error);
    return null;
  }
};
