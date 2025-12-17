'use client';

import React from 'react';
import { Text, Stack, Badge, Group } from '@mantine/core';
import { BaseComputeNode } from '../../BaseComputeNode';
import { extractArray, evaluateExpression, isObject } from '../../computeUtils';
import type { FbNodeProps } from '#/flows/types';
import { metaFilterNode } from './metadata';

export function FilterNode(props: FbNodeProps) {
  const metadata = (props.data as Record<string, unknown>)?.metadata as
    | Record<string, unknown>
    | undefined;
  const condition = (metadata?.condition as string) || 'value != null';

  const computeFn = async (input: Record<string, unknown>) => {
    const array = extractArray(input);

    const filtered = array.filter((item) => {
      const context: Record<string, unknown> = {
        value: item,
        item,
      };

      if (isObject(item)) {
        Object.assign(context, item);
      }

      const result = evaluateExpression(condition, context);
      return result === true;
    });

    return {
      array: filtered,
      originalLength: array.length,
      filteredLength: filtered.length,
    };
  };

  return (
    <BaseComputeNode
      {...props}
      config={{
        displayName: metaFilterNode.displayName,
        color: metaFilterNode.color,
        inputs: [{ id: 'array', label: 'Array' }],
        outputs: [{ id: 'filtered', label: 'Filtered' }],
        autoCompute: true,
      }}
      compute={computeFn}
      renderBody={({ output }) => (
        <Stack gap={4}>
          <Text size="xs" c="dimmed" style={{ fontFamily: 'monospace' }}>
            {condition}
          </Text>
          {output !== undefined && output !== null && (
            <Group gap="xs">
              <Badge size="xs" variant="light">
                {String((output as { originalLength: number }).originalLength)} →{' '}
                {String((output as { filteredLength: number }).filteredLength)}
              </Badge>
            </Group>
          )}
        </Stack>
      )}
    />
  );
}

