'use server';

import { prisma } from '#/lib/prisma/client';
import { Tag, TagGroup } from '#/lib/prisma';

export type TagWithGroup = Tag & { tagGroup: TagGroup | null };

/**
 * Fetches all tags for a specific instance, including their tag group details.
 *
 * @param instanceId - The identifier of the instance to filter tags.
 * @returns An array of tags with their associated tag groups.
 */
export const getTagsWithTagGroups = async (
  instanceId: string,
): Promise<TagWithGroup[]> => {
  console.log('Inside getTagsWithTagGroupsAction', instanceId);
  try {
    const tags = await prisma.tag.findMany({
      where: { instanceId, deleted: false },
      include: { tagGroup: true }, // Ensure tagGroup is included
    });
    console.log('Database retrieved tags:', tags);
    return tags;
  } catch (error) {
    console.error('Database error in getTagsWithTagGroups:', error);
    throw error; // Propagate the error to be handled by the caller
  }
};
