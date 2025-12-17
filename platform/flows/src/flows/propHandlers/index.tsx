// index.tsx

import { useMemo, useCallback } from 'react';
import {
  useNodesState,
  useEdgesState,
  NodeTypes,
  ReactFlowProps,
  useReactFlow,
  Connection,
  addEdge,
} from '@xyflow/react';
import { FbNode, FbEdge, FbNodeData, NodeMetadata } from '../types';
import { NodeTypesEnum, nodeMetaMap } from '../nodes';
import { NodeType, Prisma } from '@prisma/client';
import { edgeTypes } from '../edges';
import type { DbData } from '#/appDomain/flow/[cuid]/types';
import { XYPosition } from '@xyflow/react';
import { validatePosition } from '../helpers/prisma';
import { convertToNodeTypesEnum, isNodeTypes } from '../helpers/typeUtils';

const getId = (): string => `node_${Math.random().toString(36).slice(2, 11)}`;
const getEdgeId = (): string =>
  `edge_${Math.random().toString(36).slice(2, 11)}`;

export const useReactFlowSetup = (
  flowData: DbData | null | undefined,
  dndType: string | null,
  nodeTypes: NodeTypes,
) => {
  const { screenToFlowPosition } = useReactFlow();

  // Transform Prisma nodes to ReactFlow format
  const initialNodes = useMemo(() => {
    if (!flowData?.flow?.nodes) return [];

    return flowData.flow.nodes.map((prismaNode): FbNode => {
      const {
        flowId,
        metadata: rawMetadata,
        type,
        ...baseNodeData
      } = prismaNode;

      // Parse metadata safely first to check for original React Flow type
      const metadataObj = typeof rawMetadata === 'object' && rawMetadata !== null
        ? rawMetadata as Record<string, unknown>
        : {};

      // Try to get the original React Flow node type from metadata first
      // This preserves the specific type (e.g., awsEventBridgeSource vs awsEventBridgeEvent)
      const metadataNodeMeta = metadataObj.nodeMeta && typeof metadataObj.nodeMeta === 'object'
        ? metadataObj.nodeMeta as Record<string, unknown>
        : null;
      const metadataNodeType = metadataNodeMeta?.type as string | undefined;

      // Use metadata type if available and valid, otherwise convert Prisma type
      // For awsEventBridgeEvent, we need to check metadata to determine the specific variant
      // For webhook, we need to check metadata to determine the specific variant (source/destination/enrichment)
      let finalNodeType: keyof typeof NodeTypesEnum;
      if (metadataNodeType && isNodeTypes(metadataNodeType)) {
        finalNodeType = metadataNodeType;
      } else if (type === 'awsEventBridgeEvent' && metadataNodeMeta) {
        // Try to extract the specific variant from nodeMeta
        const nodeMetaType = metadataNodeMeta.type as string | undefined;
        if (nodeMetaType && isNodeTypes(nodeMetaType)) {
          finalNodeType = nodeMetaType;
        } else {
          // Fallback: try to infer from group or other metadata
          const group = metadataNodeMeta.group as string | undefined;
          if (group === 'source') finalNodeType = 'awsEventBridgeSource';
          else if (group === 'destination') finalNodeType = 'awsEventBridgeDestination';
          else if (group === 'general' || group === 'enrichment') finalNodeType = 'awsEventBridgeEnrichment';
          else finalNodeType = convertToNodeTypesEnum(type as NodeType);
        }
      } else if (type === 'webhook' && metadataNodeMeta) {
        // Map Prisma 'webhook' type to React Flow webhook types based on metadata
        const nodeMetaType = metadataNodeMeta.type as string | undefined;
        if (nodeMetaType && isNodeTypes(nodeMetaType)) {
          finalNodeType = nodeMetaType;
        } else {
          // Fallback: try to infer from group or other metadata
          const group = metadataNodeMeta.group as string | undefined;
          if (group === 'source') finalNodeType = 'webhookSource';
          else if (group === 'destination') finalNodeType = 'webhookDestination';
          else if (group === 'general' || group === 'enrichment') finalNodeType = 'webhookEnrichment';
          else finalNodeType = convertToNodeTypesEnum(type as NodeType);
        }
      } else {
        finalNodeType = convertToNodeTypesEnum(type as NodeType);
      }

      // Parse position from JsonValue
      const position = validatePosition(prismaNode.position);

      // Parse uxMeta safely
      const uxMetaObj = metadataObj.uxMeta && typeof metadataObj.uxMeta === 'object'
        ? metadataObj.uxMeta as Record<string, unknown>
        : {};

      const nodeMeta = nodeMetaMap[finalNodeType];

      // Keep original data structure including the original rfId
      const prismaData = {
        ...prismaNode,
        type: finalNodeType as NodeType,
      };

      const uxMeta = {
        heading: String(uxMetaObj.heading || prismaNode.name || ''),
        isExpanded: Boolean(uxMetaObj.isExpanded ?? false),
        layer: Number(uxMetaObj.layer ?? 0),
        isLocked: Boolean(uxMetaObj.isLocked ?? false),
        rotation: Number(uxMetaObj.rotation ?? 0),
      };

      return {
        id: prismaNode.id,
        type: finalNodeType,
        position,
        data: {
          ...baseNodeData,
          type: finalNodeType,
          position, // XYPosition for React Flow
          metadata: (metadataObj || null) as Prisma.JsonValue | null,
          uxMeta,
          nodeMeta,
          formFields: ((metadataObj.formFields as Record<string, unknown>) || {}) as Prisma.JsonValue,
          isEnabled: Boolean(metadataObj.isEnabled ?? true),
          prismaData,
        },
        uxMeta,
        nodeMeta,
        nodeType: finalNodeType,
      };
    });
  }, [flowData?.flow?.nodes]);

  const initialEdges = useMemo(() => {
    if (!flowData?.flow?.edges) return [];

    return flowData.flow.edges.map((prismaEdge): FbEdge => {
      const {
        flowId,
        metadata: rawMetadata,
        ...baseEdgeData
      } = prismaEdge;

      return {
        id: prismaEdge.id,
        label: prismaEdge.label,
        source: prismaEdge.sourceNodeId,
        target: prismaEdge.targetNodeId,
        type: prismaEdge.type,
        data: {
          ...baseEdgeData,
          metadata: (rawMetadata || {}) as Prisma.JsonValue,
          label: prismaEdge.label ?? '',
          prismaData: prismaEdge,
        },
      };
    });
  }, [flowData?.flow?.edges]);

  const [nodes, setNodes, onNodesChange] = useNodesState<FbNode>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<FbEdge>(initialEdges);

  const onConnect = useCallback(
    (connection: Connection) => {
      const edgeId = getEdgeId(); // New edges get edge_xxx id
      setEdges((eds) => {
        const newEdge = addEdge({ ...connection, id: edgeId }, eds);
        return newEdge;
      });
    },
    [setEdges],
  );

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      try {
        event.preventDefault();

        if (!dndType) {
          return;
        }

        const position = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });

        if (!dndType) return;

        const nodeType = convertToNodeTypesEnum(dndType as NodeType);

        const nodeMeta = nodeMetaMap[nodeType];
        if (!nodeMeta) {
          console.error(`No meta information found for node type: ${nodeType}`);
          return;
        }

        const nodeId = getId();
        const uxMeta = {
          heading: nodeMeta.displayName,
          isExpanded: false,
          layer: 0,
          isLocked: false,
          rotation: 0,
        };

        const nodeData: FbNodeData = {
          id: nodeId,
          type: nodeType,
          name: nodeMeta.displayName,
          arn: null,
          infrastructureId: null,
          position: { x: 0, y: 0 }, // Default position for new nodes
          metadata: {},
          rfId: nodeId, // Set rfId to the original node_xxx ID
          deleted: false,
          uxMeta,
          nodeMeta,
          isEnabled: true,
          formFields: {},
        };

        const newNode: FbNode = {
          id: nodeId,
          type: nodeType,
          position,
          data: {
            ...nodeData,
            rfId: nodeId, // Ensure rfId matches the original node_xxx ID
          },
          uxMeta,
          nodeMeta,
          nodeType,
        };

        setNodes((nds) => {
          return [...nds, newNode];
        });
      } catch (error) {
        console.error('Error in onDrop:', error);
        throw error;
      }
    },
    [dndType, screenToFlowPosition, setNodes],
  );

  const flowProps: ReactFlowProps<FbNode, FbEdge> = {
    nodes,
    edges,
    edgeTypes,
    defaultEdgeOptions: {
      type: 'custom',
      markerEnd: 'edge-marker',
    },
    nodeTypes,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onDragOver,
    onDrop,
    nodeDragThreshold: 1,
    edgesReconnectable: true,
    defaultViewport: (typeof flowData?.flow?.viewport === 'object' &&
      flowData?.flow?.viewport !== null &&
      'x' in flowData.flow.viewport &&
      'y' in flowData.flow.viewport &&
      'zoom' in flowData.flow.viewport
        ? (flowData.flow.viewport as { x: number; y: number; zoom: number })
        : { x: 0, y: 0, zoom: 1 }),
  };

  return {
    edges,
    flowProps,
    nodes,
    setEdges,
    setNodes,
  };
};
