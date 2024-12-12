'use server';

import { addDomainToVercel } from '#/lib/domainActions';
import { subdomainFromHostname } from '#/lib/domains';
import {
  createInstance,
  getInstanceById,
  getInstanceBySubdomain,
  getInstancesByUser,
} from '#/lib/prisma/ormApi';
import { Instance } from '@prisma/client';
import { unstable_cache } from 'next/cache';

/**
 * Fetches the instance ID associated with a specific subdomain.
 *
 * @param {string} encodedDomain - The encoded domain to fetch the instance ID for.
 * @returns {Promise<ReturnType<typeof getInstanceBySubdomain>>} - A promise that resolves to the instance ID.
 */
export const getInstanceIdBySubdomainAction = unstable_cache(
  async (
    encodedDomain: string,
  ): Promise<ReturnType<typeof getInstanceBySubdomain>> => {
    const subdomain = subdomainFromHostname(encodedDomain);
    console.log('getInstanceIdBySubdomainAction', subdomain);
    return await getInstanceBySubdomain(subdomain);
  },
);

/**
 * Fetches an instance by its ID and subdomain.
 * @param {string} instanceId - The ID of the instance.
 * @param {string} subdomain - The subdomain of the instance.
 * @returns {Promise<ReturnType<typeof getInstanceById>>} - A promise that resolves to the instance with its nodes and edges.
 */
export const getInstanceByIdAction = async (
  instanceId: string,
  subdomain: string,
): Promise<ReturnType<typeof getInstanceById>> => {
  console.log('getInstanceByIdAction', instanceId, subdomain);
  return await getInstanceById(instanceId, subdomain);
};

/**
 * Fetches all instances associated with a specific user.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<Instance[]>} - A promise that resolves to the user's instances.
 */
export const getInstancesByUserAction = async (
  userId: string,
): Promise<Instance[]> => {
  console.log('getInstancesByUserAction', userId);
  return await getInstancesByUser(userId);
};

/**
 * Creates a new instance with the provided details and optionally sets up a domain on Vercel.
 * @param {string} instanceName - The name of the instance.
 * @param {string} instanceSubdomain - The subdomain for the instance.
 * @param {string} userId - The ID of the user creating the instance.
 * @returns {Promise<ReturnType<typeof createInstance>>} - A promise that resolves to the newly created instance.
 */
export const createInstanceAction = async (
  instanceName: string,
  instanceSubdomain: string,
  userId: string,
): Promise<ReturnType<typeof createInstance>> => {
  console.log('createInstanceAction', instanceName, instanceSubdomain, userId);

  const newInstance = await createInstance(
    instanceName,
    userId,
    null,
    null,
    null,
    instanceSubdomain,
    null,
  );

  // Skip Vercel domain setup in local development
  if (process.env.NEXT_PUBLIC_ROOT_DOMAIN !== 'localhost:3000') {
    const vercelRes = await addDomainToVercel(instanceSubdomain);
    console.log('Vercel domain setup response:', vercelRes);
  } else {
    console.log('Skipping Vercel domain setup in local development');
  }

  return newInstance;
};

/**
 * Fetches all instances associated with a specific subdomain.
 * @param {string} subdomain - The subdomain to fetch instances for.
 * @returns {Promise<ReturnType<typeof getInstanceBySubdomain>>} - A promise that resolves to the instances of the subdomain.
 */
export const getInstanceBySubdomainAction = async (
  subdomain: string,
): Promise<ReturnType<typeof getInstanceBySubdomain>> => {
  console.log('getInstanceBySubdomainAction', subdomain);
  return await getInstanceBySubdomain(subdomain);
};
