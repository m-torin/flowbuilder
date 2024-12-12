'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  MiniMap,
  BackgroundVariant,
  Panel,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useRouter } from 'next/navigation';
import { Button, Portal, TextInput, Group } from '@mantine/core';
import { useField } from '@mantine/form';
import { useReactFlowSetup } from './propHandlers';
import { useAppContext } from '#/appDomain/flow/[cuid]/FlowProvider';
import { FlowAside } from './ui/rightSidebar';
import { rfNodeTypes } from './nodes';
import { CustomControls, MiniMapNode } from './ui';
import { FbEdge, FbNode } from './types';
import { FlowMethod } from '@prisma/client';
import { useDocumentTitle } from '@mantine/hooks';
import { saveFlowAction } from './saveFlowAction';

const DEBUG = process.env.NODE_ENV === 'development';
const debug = DEBUG ? console.log : () => {};

export const ReactFlow12: React.FC = () => {
  const { prismaData, dndType } = useAppContext();
  // console.log('ℹ️ Prisma Data:', JSON.stringify(prismaData, null, 2));

  const { flowProps } = useReactFlowSetup(prismaData, dndType, rfNodeTypes);
  const router = useRouter();
  const reactFlowInstance = useReactFlow<FbNode, FbEdge>();

  const [isSaving, setIsSaving] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const flowNameField = useField({
    initialValue: prismaData?.flow?.name || '',
    validateOnChange: true,
    validateOnBlur: true,
    validate: (value) => {
      const trimmed = value.trim();
      if (!trimmed) return 'Flow name is required';
      if (trimmed.length < 3) return 'Flow name must be at least 3 characters';
      return null;
    },
    onValueChange: (value) => {
      // Additional side effects when value changes
      debug('Flow name changed:', value);
    },
  });

  // Set document title based on flow name
  useDocumentTitle(
    flowNameField.getValue() ? `${flowNameField.getValue()} Flow` : 'New Flow',
  );

  // Initialize flow name from prismaData
  useEffect(() => {
    if (
      prismaData?.flow?.name &&
      prismaData.flow.name !== flowNameField.getValue()
    ) {
      debug('📝 Initializing flow name:', {
        newName: prismaData.flow.name,
        currentName: flowNameField.getValue(),
      });
      flowNameField.setValue(prismaData.flow.name);
    }
  }, [prismaData?.flow?.name]);

  useEffect(() => {
    // console.log('🔍 Flow Debug:', {
    //   prismaData,
    //   flowProps,
    //   currentNodes: reactFlowInstance.getNodes(),
    //   currentEdges: reactFlowInstance.getEdges(),
    // });
  }, [prismaData, flowProps, reactFlowInstance]);

  /////
  const handleSave = useCallback(async () => {
    if (!prismaData) {
      return;
    }

    setIsSaving(true);

    try {
      const flowId = prismaData.flow.id;
      const instanceId = prismaData.flow.instanceId;

      // Get the current flow state
      const currentFlow = reactFlowInstance.toObject();

      // Transform nodes to ensure required properties
      const validatedNodes = currentFlow.nodes.map((node) => ({
        ...node,
        // Ensure type is always defined
        type: node.type || 'default',
        data: {
          ...node.data,
          // Ensure required data properties
          type: node.data.type || 'default',
          nodeMeta: {
            ...node.data.nodeMeta,
            type: node.data.nodeMeta?.type || 'default',
          },
          // Ensure other required properties
          name: node.data.name || null,
          metadata: node.data.metadata || {},
          isEnabled: node.data.isEnabled ?? true,
        },
        // Ensure position is defined
        position: node.position || { x: 0, y: 0 },
      }));

      const payload = {
        flowId,
        instanceId,
        flowData: {
          ...currentFlow,
          nodes: validatedNodes,
        },
        updatedFlow: {
          name: flowNameField.getValue(),
          method: prismaData.flow.method ?? FlowMethod.observable,
          isEnabled: prismaData.flow.isEnabled ?? false,
          metadata: prismaData.flow.metadata,
        },
      };

      // Validate payload structure before sending
      console.log('📤 Sending payload:', JSON.stringify(payload, null, 2));

      const result = await saveFlowAction(payload);

      if (result.success) {
        console.log(
          '✅ Flow saved successfully:',
          JSON.stringify(result.data, null, 2),
        );
      } else {
        console.error('❌ Error saving flow:', result.error);
      }
    } catch (error) {
      console.error('💥 Error in handleSave:', error);
    } finally {
      setIsSaving(false);
    }
  }, [reactFlowInstance, flowNameField, prismaData?.flow]);
  /////

  const nodeColor = useCallback((node: FbNode) => {
    switch (node.type) {
      default:
        return '#ff0072';
    }
  }, []);

  const snapGrid: [number, number] = [20, 20];

  return (
    <ReactFlow<FbNode, FbEdge>
      {...flowProps}
      snapToGrid
      snapGrid={snapGrid}
      fitView
    >
      <Background
        id="1"
        gap={20}
        color="#f1f1f1"
        variant={BackgroundVariant.Lines}
      />
      <Background
        id="2"
        gap={100}
        offset={0}
        color="#ccc"
        variant={BackgroundVariant.Lines}
      />

      <Panel position="top-right" className="bg-white p-4 rounded-lg shadow-lg">
        <Group>
          <TextInput
            {...flowNameField.getInputProps()}
            placeholder="Enter flow name"
            label="Flow Name"
            className="min-w-[200px]"
            error={flowNameField.error}
            required
          />
          <Group mt={24}>
            <Button
              onClick={handleSave}
              loading={isSaving}
              disabled={
                isSaving ||
                isRestoring ||
                !flowNameField.getValue().trim() ||
                !!flowNameField.error
              }
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </Group>
        </Group>
      </Panel>

      <CustomControls />

      <MiniMap
        nodeColor={nodeColor}
        nodeStrokeWidth={3}
        nodeComponent={MiniMapNode}
        zoomable
        pannable
      />

      <Portal target="#applayout-aside">
        <FlowAside />
      </Portal>
    </ReactFlow>
  );
};
