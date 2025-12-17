# Node Type Mapping Reference

## Prisma NodeType Enum → React Flow NodeTypesEnum

### Direct Mappings (1:1)
- `anthropicGptNode` → `anthropicGptNode`
- `awsLambdaNode` → `awsLambdaNode`
- `awsS3Node` → `awsS3Node`
- `awsSnsNode` → `awsSnsNode`
- `awsSqsNode` → `awsSqsNode`
- `cronNode` → `cronNode`
- `default` → `default`
- `githubEventReceiverSource` → `githubEventReceiverSource`
- `ifElseThenNode` → `ifElseThenNode`
- `javascriptEditorNode` → `javascriptEditorNode`
- `openaiGptNode` → `openaiGptNode`
- `pythonEditorNode` → `pythonEditorNode`
- `webhookSource` → `webhookSource`
- `webhookDestination` → `webhookDestination`

### Special Mappings (Many:1 or 1:Many)

#### AWS EventBridge (Many:1)
- `awsEventBridgeEvent` (Prisma) → Maps to one of:
  - `awsEventBridgeSource` (React Flow)
  - `awsEventBridgeDestination` (React Flow)
  - `awsEventBridgeEnrichment` (React Flow)
- **Direction**: Determined by metadata `nodeMeta.type` or `nodeMeta.group`

#### Webhook (1:Many)
- `webhook` (Prisma) → `webhookEnrichment` (React Flow)
- **Reverse**: `webhookEnrichment` (React Flow) → `webhook` (Prisma)

#### Legacy Types
- `javascriptEditorLogic` (Prisma) → `javascriptEditorNode` (React Flow)
- **Note**: Legacy type, not actively used but handled for backward compatibility

## React Flow NodeTypesEnum → Prisma NodeType Enum

### Direct Mappings (1:1)
- All direct mappings above work in reverse

### Special Reverse Mappings

#### AWS EventBridge (Many:1)
- `awsEventBridgeSource` → `awsEventBridgeEvent`
- `awsEventBridgeDestination` → `awsEventBridgeEvent`
- `awsEventBridgeEnrichment` → `awsEventBridgeEvent`

#### Webhook (1:Many)
- `webhookEnrichment` → `webhook`
- `webhookSource` → `webhookSource`
- `webhookDestination` → `webhookDestination`

## Implementation Files

1. **`src/flows/helpers/typeUtils.ts`**
   - `convertToNodeTypesEnum()`: Prisma → React Flow
   - Handles webhook and legacy type mappings

2. **`src/flows/saveFlowAction.ts`**
   - `mapToPrismaNodeType()`: React Flow → Prisma
   - Handles AWS EventBridge, webhook, and legacy type mappings

3. **`src/flows/propHandlers/index.tsx`**
   - Node loading logic with metadata-based type resolution
   - Special handling for `awsEventBridgeEvent` and `webhook` types

## Verification Checklist

- ✅ All Prisma types have a mapping to React Flow
- ✅ All React Flow types have a mapping to Prisma
- ✅ Webhook enrichment mapping is bidirectional
- ✅ AWS EventBridge mapping is bidirectional
- ✅ Legacy `javascriptEditorLogic` is handled
- ✅ Metadata-based type resolution preserves specific types

