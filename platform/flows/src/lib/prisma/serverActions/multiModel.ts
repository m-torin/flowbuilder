import { TagWithGroup, getTagsWithTagGroups } from '#/lib/prisma/ormApi';

/**
 * Fetches all tags with their associated tag groups for a specific instance.
 *
 * @param instanceId - The identifier of the instance to filter tags.
 * @returns An array of tags with their associated tag groups.
 */
export const getTagsWithTagGroupsAction = async (
  instanceId: string,
): Promise<TagWithGroup[]> => {
  console.log('Inside getTagsWithTagGroupsAction', instanceId);
  try {
    const bob = await getTagsWithTagGroups(instanceId);
    console.log('getTagsWithTagGroups', bob);
    return bob;
  } catch (error) {
    console.error('Error in getTagsWithTagGroupsAction:', error);
    throw new Error('Failed to fetch tags with tag groups.');
  }
};
