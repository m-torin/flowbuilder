'use client';

import React from 'react';
import { Select, Text, Group } from '@mantine/core';
import { BaseComputeNode } from '../../BaseComputeNode';
import { compare, ComparisonOperator } from '../../computeUtils';
import type { FbNodeProps } from '#/flows/types';
import { metaCompareNode } from './metadata';

const OPERATORS: Array<{ value: ComparisonOperator; label: string }> = [
  { value: 'eq', label: '==' },
  { value: 'neq', label: '!=' },
  { value: 'gt', label: '>' },
  { value: 'gte', label: '>=' },
  { value: 'lt', label: '<' },
  { value: 'lte', label: '<=' },
  { value: 'contains', label: 'contains' },
  { value: 'startsWith', label: 'starts with' },
  { value: 'endsWith', label: 'ends with' },
  { value: 'matches', label: 'matches regex' },
];

export function CompareNode(props: FbNodeProps) {
  const metadata = (props.data as Record<string, unknown>)?.metadata as
    | Record<string, unknown>
    | undefined;
  const operator = (metadata?.operator as ComparisonOperator) || 'eq';

  const computeFn = async (input: Record<string, unknown>) => {
    const values = Object.values(input);
    const valueA = values[0];
    const valueB = values[1];
    return compare(valueA, valueB, operator);
  };

  return (
    <BaseComputeNode
      {...props}
      config={{
        displayName: metaCompareNode.displayName,
        color: metaCompareNode.color,
        inputs: [
          { id: 'a', label: 'A' },
          { id: 'b', label: 'B' },
        ],
        outputs: [{ id: 'result', label: 'Result' }],
        autoCompute: true,
      }}
      compute={computeFn}
      renderBody={({ output }) => (
        <Group gap="xs" justify="center">
          <Text size="xs" c="dimmed">
            A
          </Text>
          <Select
            size="xs"
            data={OPERATORS}
            value={operator}
            w={80}
            styles={{ input: { textAlign: 'center' } }}
            readOnly
          />
          <Text size="xs" c="dimmed">
            B
          </Text>
          {output !== undefined && (
            <Text size="xs" fw={600} c={output ? 'green' : 'red'}>
              = {String(output)}
            </Text>
          )}
        </Group>
      )}
    />
  );
}

