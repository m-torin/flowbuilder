// page.tsx
import {
  getInstanceIdBySubdomainAction,
  getTagsWithTagGroupsAction,
} from '#/lib/prisma';
import { Prisma } from '@prisma/client';
import { TagsUI } from './UI';

import { buildTagGroups } from './logic';

// Updated interface to use Promise-based params
interface TagsPageProps {
  params: Promise<{
    domain: string;
    cuid?: string;
  }>;
}

async function TagsPage({ params }: TagsPageProps) {
  // Await the params since they're now a Promise
  const { domain } = await params;

  // Rest of your code remains the same
  const instanceId = await getInstanceIdBySubdomainAction(domain);
  if (!instanceId) {
    throw new Error('Instance ID not found');
  }

  const tags = await getTagsWithTagGroupsAction(instanceId);
  if (!Array.isArray(tags)) {
    throw new Error('Fetched tags is not an array');
  }

  const transformedTags = tags.map((tag) => ({
    ...tag,
    tagGroup: tag.tagGroup
      ? {
          id: tag.tagGroup.id,
          name: tag.tagGroup.name,
          color: tag.tagGroup.color,
          deleted: tag.tagGroup.deleted,
          createdAt: tag.tagGroup.createdAt,
          updatedAt: tag.tagGroup.updatedAt,
          instanceId: tag.tagGroup.instanceId,
          metadata: (tag.tagGroup.metadata as Prisma.JsonValue) || null,
        }
      : null,
  }));

  const initialTagGroups = buildTagGroups(transformedTags);

  return (
    <TagsUI
      initialTagGroups={initialTagGroups}
      instanceId={instanceId}
      domain={domain}
    />
  );
}

export default TagsPage;
