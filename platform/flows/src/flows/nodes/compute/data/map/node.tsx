'use client';

import React from 'react';
import { Text, Stack, Badge } from '@mantine/core';
import { BaseComputeNode } from '../../BaseComputeNode';
import { extractArray, evaluateExpression, isObject } from '../../computeUtils';
import type { FbNodeProps } from '#/flows/types';
import { metaMapNode } from './metadata';

export function MapNode(props: FbNodeProps) {
  const metadata = (props.data as Record<string, unknown>)?.metadata as
    | Record<string, unknown>
    | undefined;
  const expression = (metadata?.expression as string) || 'value';

  const computeFn = async (input: Record<string, unknown>) => {
    const array = extractArray(input);

    const mapped = array.map((item, index) => {
      const context: Record<string, unknown> = {
        value: item,
        item,
        index,
      };

      if (isObject(item)) {
        Object.assign(context, item);
      }

      const result = evaluateExpression(expression, context);
      return result !== undefined ? result : item;
    });

    return {
      array: mapped,
      length: mapped.length,
    };
  };

  return (
    <BaseComputeNode
      {...props}
      config={{
        displayName: metaMapNode.displayName,
        color: metaMapNode.color,
        inputs: [{ id: 'array', label: 'Array' }],
        outputs: [{ id: 'mapped', label: 'Mapped' }],
        autoCompute: true,
      }}
      compute={computeFn}
      renderBody={({ output }) => (
        <Stack gap={4}>
          <Text size="xs" c="dimmed" style={{ fontFamily: 'monospace' }}>
            → {expression}
          </Text>
          {output !== undefined && output !== null && (
            <Badge size="xs" variant="light">
              {String((output as { length: number }).length)} items
            </Badge>
          )}
        </Stack>
      )}
    />
  );
}

