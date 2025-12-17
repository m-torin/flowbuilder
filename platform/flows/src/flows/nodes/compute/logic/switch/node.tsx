'use client';

import React from 'react';
import { Text, Stack } from '@mantine/core';
import { Position } from '@xyflow/react';
import { BaseComputeNode } from '../../BaseComputeNode';
import { evaluateExpression } from '../../computeUtils';
import type { FbNodeProps } from '#/flows/types';
import { metaSwitchNode } from './metadata';

interface SwitchCase {
  condition: string;
  output: string;
}

export function SwitchNode(props: FbNodeProps) {
  const metadata = (props.data as Record<string, unknown>)?.metadata as
    | Record<string, unknown>
    | undefined;
  const cases = (metadata?.cases as SwitchCase[]) || [
    { condition: 'value == 1', output: 'case1' },
    { condition: 'value == 2', output: 'case2' },
  ];

  const computeFn = async (input: Record<string, unknown>) => {
    for (const switchCase of cases) {
      const result = evaluateExpression(switchCase.condition, input);
      if (result === true) {
        return { matched: switchCase.output, input };
      }
    }
    return { matched: 'default', input };
  };

  // Create output handles for each case plus default
  const outputs = [
    ...cases.map((c, i) => ({
      id: c.output || `case${i + 1}`,
      label: c.output || `Case ${i + 1}`,
      position: Position.Right,
    })),
    { id: 'default', label: 'Default', position: Position.Right },
  ];

  return (
    <BaseComputeNode
      {...props}
      config={{
        displayName: metaSwitchNode.displayName,
        color: metaSwitchNode.color,
        inputs: [{ id: 'input', label: 'Value' }],
        outputs,
        autoCompute: true,
      }}
      compute={computeFn}
      renderBody={({ output }) => (
        <Stack gap={4}>
          {cases.map((c, i) => (
            <Text key={i} size="xs" c="dimmed">
              {c.condition} → {c.output}
            </Text>
          ))}
          {output !== undefined && output !== null && (
            <Text size="xs" fw={600}>
              Matched: {String((output as { matched: string }).matched)}
            </Text>
          )}
        </Stack>
      )}
    />
  );
}

