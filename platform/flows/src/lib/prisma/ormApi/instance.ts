import { prisma } from '#/lib/prisma/client';
import { Instance, Node, Edge, Flow } from '@prisma/client';

/**
 * Fetches an instance by its ID and subdomain.
 * @param {string} instanceId - The ID of the instance.
 * @param {string} subdomain - The subdomain of the instance.
 * @returns {Promise<{ instance: Instance, nodes: Node[], edges: Edge[] } | null>}
 */
export const getInstanceById = async (
  instanceId: string,
  subdomain: string,
): Promise<{ instance: Instance; nodes: Node[]; edges: Edge[] } | null> => {
  try {
    const instance = await prisma.instance.findFirst({
      where: {
        id: instanceId,
        subdomain,
      },
      include: {
        flows: {
          include: {
            nodes: true,
            edges: true,
          },
        },
      },
    });

    if (instance) {
      // Aggregate nodes and edges from flows
      const nodes = instance.flows.flatMap((flow) => flow.nodes);
      const edges = instance.flows.flatMap((flow) => flow.edges);

      return { instance, nodes, edges };
    } else {
      console.log(
        `No instance found with ID ${instanceId} and subdomain ${subdomain}`,
      );
      return null;
    }
  } catch (error) {
    console.error(
      `Failed to fetch instance with ID ${instanceId} and subdomain ${subdomain}:`,
      error,
    );
    throw error;
  }
};

interface InstanceWithUser extends Instance {
  user: {
    name: string | null;
  } | null;
}

/**
 * Fetches instances by user ID along with the user's name.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<InstanceWithUser[]>} An array of instance objects with user names.
 */
export const getInstancesByUser = async (
  userId: string,
): Promise<InstanceWithUser[]> => {
  try {
    const instances = await prisma.instance.findMany({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return instances;
  } catch (error) {
    console.error(`Failed to fetch instances for user ID ${userId}:`, error);
    throw error;
  }
};

/**
 * Fetches an instance by user ID and instance ID.
 * @param {string} userId - The ID of the user.
 * @param {string} instanceId - The ID of the instance.
 * @returns {Promise<Instance | null>} The instance object, or null if not found.
 */
export const getInstanceByUser = async (
  userId: string,
  instanceId: string,
): Promise<Instance | null> => {
  try {
    return await prisma.instance.findFirst({
      where: {
        id: instanceId,
        userId,
      },
    });
  } catch (error) {
    console.error(
      `Failed to fetch instance with ID ${instanceId} for user ID ${userId}:`,
      error,
    );
    throw error;
  }
};

/**
 * Creates a new instance.
 * @param {string} name - The name of the instance.
 * @param {string} userId - The ID of the user.
 * @param {string | null} [description=null] - The description of the instance.
 * @param {string | null} [logo=null] - The logo of the instance.
 * @param {string | null} [image=null] - The image of the instance.
 * @param {string | null} [subdomain=null] - The subdomain of the instance.
 * @param {string | null} [customDomain=null] - The custom domain of the instance.
 * @returns {Promise<Instance | null>} The newly created instance, or null if creation fails.
 */
export const createInstance = async (
  name: string,
  userId: string,
  description: string | null = null,
  logo: string | null = null,
  image: string | null = null,
  subdomain: string | null = null,
  customDomain: string | null = null,
): Promise<Instance | null> => {
  try {
    return await prisma.instance.create({
      data: {
        name,
        description,
        userId,
        logo,
        image,
        subdomain,
        customDomain,
      },
    });
  } catch (error) {
    console.error('Failed to create a new instance:', error);
    throw error;
  }
};

/**
 * Fetches an instance by its subdomain.
 * @param {string} subdomain - The subdomain of the instance.
 * @returns {Promise<string | null>} The ID of the instance, or null if not found.
 */
export const getInstanceBySubdomain = async (
  subdomain: string,
): Promise<string | null> => {
  try {
    const instance = await prisma.instance.findFirst({
      where: { subdomain },
      select: { id: true },
    });
    // console.log('instance:', { subdomain, instance });
    // console.log('prismaRes instance', JSON.stringify(instance));
    return instance?.id ?? null;
  } catch (error) {
    console.error(
      `Failed to fetch instance for subdomain ${subdomain}:`,
      error,
    );
    throw error;
  }
};

/**
 * Upserts an instance in the database.
 * @param {string} id - The ID of the instance.
 * @param {string} userId - The ID of the user.
 * @param {string} name - The name of the instance.
 * @param {string | null} [description=null] - The description of the instance.
 * @param {string | null} [logo=null] - The logo of the instance.
 * @param {string | null} [image=null] - The image of the instance.
 * @param {string | null} [subdomain=null] - The subdomain of the instance.
 * @param {string | null} [customDomain=null] - The custom domain of the instance.
 * @returns {Promise<Instance | null>} The upserted instance object, or null if operation fails.
 */
export const upsertInstance = async (
  id: string,
  userId: string,
  name: string,
  description: string | null = null,
  logo: string | null = null,
  image: string | null = null,
  subdomain: string | null = null,
  customDomain: string | null = null,
): Promise<Instance | null> => {
  try {
    return await prisma.instance.upsert({
      where: { id },
      update: {
        userId,
        name,
        description,
        logo,
        image,
        subdomain,
        customDomain,
      },
      create: {
        id,
        userId,
        name,
        description,
        logo,
        image,
        subdomain,
        customDomain,
      },
    });
  } catch (error) {
    console.error('Failed to upsert instance:', error);
    throw error;
  }
};
