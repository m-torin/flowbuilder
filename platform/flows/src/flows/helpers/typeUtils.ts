// typeUtils.ts
import { NodeType, EdgeType } from '@prisma/client';
import { NodeTypesEnum, NodeTypes } from '../nodes';

/**
 * Type guard to check if a value is a valid NodeTypes
 */
export const isNodeTypes = (type: unknown): type is NodeTypes => {
  return (
    typeof type === 'string' &&
    Object.values(NodeTypesEnum).includes(type as NodeTypes)
  );
};

/**
 * Convert any node type to NodeTypesEnum (our source of truth)
 */
export const convertToNodeTypesEnum = (
  type: NodeTypes | NodeType | undefined,
): NodeTypes => {
  if (!type) return NodeTypesEnum.Default;

  if (isNodeTypes(type)) return type;

  // Map Prisma webhook types to React Flow types
  // Prisma has: webhook, webhookSource, webhookDestination
  // React Flow expects: webhookSource, webhookDestination, webhookEnrichment
  if (type === NodeType.webhook) {
    // Map Prisma 'webhook' to React Flow 'webhookEnrichment'
    return 'webhookEnrichment' as NodeTypes;
  }
  if (type === NodeType.webhookSource) {
    return 'webhookSource' as NodeTypes;
  }
  if (type === NodeType.webhookDestination) {
    return 'webhookDestination' as NodeTypes;
  }

  // Handle legacy javascriptEditorLogic (maps to javascriptEditorNode)
  if (type === NodeType.javascriptEditorLogic) {
    console.warn(`Legacy node type "javascriptEditorLogic" mapped to "javascriptEditorNode"`);
    return 'javascriptEditorNode' as NodeTypes;
  }

  const enumValue = Object.values(NodeTypesEnum).find((enumType) => {
    return (
      (enumType as string).toLowerCase() === (type as string).toLowerCase()
    );
  });

  if (enumValue) return enumValue;

  console.warn(
    `Unknown node type "${type}" defaulting to NodeTypesEnum.Default`,
  );

  return NodeTypesEnum.Default;
};

/**
 * Convert NodeTypesEnum to Prisma NodeType
 * Since NodeTypesEnum is the source of truth, we cast it as NodeType
 */
export const convertToPrismaNodeType = (
  type: NodeTypes | NodeType | undefined,
): NodeType => {
  if (!type) return NodeType.default;
  return type as NodeType;
};

/**
 * Type guard to check if a value is a valid Prisma EdgeType
 */
export const isPrismaEdgeType = (type: unknown): type is EdgeType => {
  return typeof type === 'string' && (type === 'custom' || type === 'default');
};

/**
 * Convert to Prisma EdgeType with validation
 */
export const convertToPrismaEdgeType = (
  type: string | undefined,
): EdgeType => {
  if (!type || !isPrismaEdgeType(type)) return EdgeType.default;
  return type as EdgeType;
};
