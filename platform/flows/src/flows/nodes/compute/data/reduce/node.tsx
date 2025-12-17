'use client';

import React from 'react';
import { Text, Stack, Badge, Select, Group } from '@mantine/core';
import { BaseComputeNode } from '../../BaseComputeNode';
import { extractArray, aggregate, AggregationType } from '../../computeUtils';
import type { FbNodeProps } from '#/flows/types';
import { metaReduceNode } from './metadata';

const AGGREGATION_TYPES: Array<{ value: AggregationType; label: string }> = [
  { value: 'sum', label: 'Sum' },
  { value: 'avg', label: 'Average' },
  { value: 'min', label: 'Minimum' },
  { value: 'max', label: 'Maximum' },
  { value: 'count', label: 'Count' },
  { value: 'first', label: 'First' },
  { value: 'last', label: 'Last' },
  { value: 'concat', label: 'Concatenate' },
];

export function ReduceNode(props: FbNodeProps) {
  const metadata = (props.data as Record<string, unknown>)?.metadata as
    | Record<string, unknown>
    | undefined;
  const aggregationType =
    (metadata?.aggregationType as AggregationType) || 'sum';

  const computeFn = async (input: Record<string, unknown>) => {
    const array = extractArray(input);
    const result = aggregate(array, aggregationType);

    return {
      result,
      inputLength: array.length,
      aggregationType,
    };
  };

  return (
    <BaseComputeNode
      {...props}
      config={{
        displayName: metaReduceNode.displayName,
        color: metaReduceNode.color,
        inputs: [{ id: 'array', label: 'Array' }],
        outputs: [{ id: 'result', label: 'Result' }],
        autoCompute: true,
      }}
      compute={computeFn}
      renderBody={({ output }) => (
        <Stack gap={4}>
          <Select
            size="xs"
            data={AGGREGATION_TYPES}
            value={aggregationType}
            readOnly
          />
          {output !== undefined && output !== null && (
            <Group gap="xs" justify="center">
              <Text size="xs" c="dimmed">
                {String((output as { inputLength: number }).inputLength)} items →
              </Text>
              <Badge size="sm" variant="filled">
                {String((output as { result: unknown }).result)}
              </Badge>
            </Group>
          )}
        </Stack>
      )}
    />
  );
}

