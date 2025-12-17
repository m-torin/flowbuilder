'use client';

import React from 'react';
import { Text, Group, Badge } from '@mantine/core';
import { Position } from '@xyflow/react';
import { BaseComputeNode } from '../../BaseComputeNode';
import { evaluateExpression } from '../../computeUtils';
import type { FbNodeProps } from '#/flows/types';
import { metaConditionalNode } from './metadata';

export function ConditionalNode(props: FbNodeProps) {
  const metadata = (props.data as Record<string, unknown>)?.metadata as
    | Record<string, unknown>
    | undefined;
  const condition = (metadata?.condition as string) || 'value == true';

  const computeFn = async (input: Record<string, unknown>) => {
    let result: boolean;

    if (typeof input.condition === 'boolean') {
      result = input.condition;
    } else {
      const evaluated = evaluateExpression(condition, input);
      result = evaluated === true;
    }

    return {
      result,
      branch: result ? 'true' : 'false',
      input,
    };
  };

  return (
    <BaseComputeNode
      {...props}
      config={{
        displayName: metaConditionalNode.displayName,
        color: metaConditionalNode.color,
        inputs: [{ id: 'condition', label: 'Input' }],
        outputs: [
          { id: 'true', label: 'True', position: Position.Right },
          { id: 'false', label: 'False', position: Position.Right },
        ],
        autoCompute: true,
      }}
      compute={computeFn}
      renderBody={({ output }) => (
        <Group gap="xs" justify="center">
          <Text size="xs" c="dimmed" style={{ fontFamily: 'monospace' }}>
            {condition}
          </Text>
          {output !== undefined && (
            <Badge
              size="xs"
              color={(output as { result: boolean }).result ? 'green' : 'red'}
            >
              {(output as { branch: string }).branch}
            </Badge>
          )}
        </Group>
      )}
    />
  );
}

