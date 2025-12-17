'use client';

import React, { useState } from 'react';
import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Paper,
  Stack,
  Text,
  Tooltip,
  ScrollArea,
  Collapse,
  Box,
} from '@mantine/core';
import {
  IconPlayerPlay,
  IconPlayerStop,
  IconRefresh,
  IconChevronDown,
  IconChevronUp,
  IconCheck,
  IconX,
  IconClock,
  IconLoader,
} from '@tabler/icons-react';
import {
  useFlowExecution,
  type FlowExecutionState,
} from '#/flows/hooks/useFlowExecution';
import type { ExecutionNode, ExecutionStatus } from '#/lib/execution/types';

function StatusIcon({ status }: { status: ExecutionStatus | null }) {
  if (!status) return <IconClock size={14} />;

  switch (status) {
    case 'completed':
      return <IconCheck size={14} color="green" />;
    case 'error':
      return <IconX size={14} color="red" />;
    case 'processing':
      return <IconLoader size={14} className="animate-spin" />;
    case 'pending':
      return <IconClock size={14} />;
    case 'skipped':
      return <IconX size={14} color="yellow" />;
    default:
      return <IconClock size={14} />;
  }
}

function StatusBadge({ status }: { status: ExecutionStatus | null }) {
  if (!status) {
    return <Badge color="gray" variant="light" size="sm">Idle</Badge>;
  }

  const colorMap: Record<ExecutionStatus, string> = {
    pending: 'gray',
    processing: 'blue',
    completed: 'green',
    error: 'red',
    skipped: 'yellow',
  };

  return (
    <Badge color={colorMap[status]} variant="light" size="sm">
      {status}
    </Badge>
  );
}

function NodeTreeItem({ node, depth = 0 }: { node: ExecutionNode; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 2); // Auto-expand first 2 levels

  return (
    <Box>
      <Group gap="xs" style={{ paddingLeft: `${depth * 16}px` }}>
        {node.children.length > 0 && (
          <ActionIcon
            size="xs"
            variant="subtle"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <IconChevronDown size={12} /> : <IconChevronUp size={12} />}
          </ActionIcon>
        )}
        <StatusIcon status={node.status} />
        <Text size="xs" style={{ flex: 1 }}>
          {node.nodeId}
        </Text>
        <StatusBadge status={node.status} />
      </Group>

      {node.error && (
        <Text size="xs" c="red" style={{ paddingLeft: `${(depth + 1) * 16}px` }}>
          {node.error}
        </Text>
      )}

      {node.children.length > 0 && (
        <Collapse in={expanded}>
          <Stack gap={2} mt={4}>
            {node.children.map((child, idx) => (
              <NodeTreeItem key={idx} node={child} depth={depth + 1} />
            ))}
          </Stack>
        </Collapse>
      )}
    </Box>
  );
}

interface ExecutionPanelProps {
  compact?: boolean;
  className?: string;
}

export function ExecutionPanel({ compact = false, className }: ExecutionPanelProps) {
  const {
    state,
    executeFlow,
    executeFromSources,
    stopExecution,
    resetState,
    getChainStatus,
  } = useFlowExecution();

  const [showDetails, setShowDetails] = useState(!compact);

  const chainStatus = state.currentChainId
    ? getChainStatus(state.currentChainId)
    : state.result?.rootNode || null;

  const handleRun = async () => {
    await executeFlow();
  };

  const handleRunFromSources = async () => {
    await executeFromSources();
  };

  if (compact) {
    return (
      <Group gap="xs" className={className}>
        <Button
          size="xs"
          color="green"
          leftSection={<IconPlayerPlay size={14} />}
          onClick={handleRun}
          disabled={state.isExecuting}
        >
          Run
        </Button>
      </Group>
    );
  }

  return (
    <Paper
      shadow="sm"
      p="sm"
      radius="md"
      withBorder
      className={className}
      style={{ minWidth: 280 }}
    >
      <Stack gap="sm">
        <Group justify="space-between">
          <Text size="sm" fw={600}>
            Execution
          </Text>
          <StatusBadge status={state.status} />
        </Group>

        <Group gap="xs">
          <Button
            size="xs"
            color="green"
            leftSection={<IconPlayerPlay size={14} />}
            onClick={handleRun}
            disabled={state.isExecuting}
          >
            Run
          </Button>
          <Button
            size="xs"
            variant="light"
            leftSection={<IconPlayerPlay size={14} />}
            onClick={handleRunFromSources}
            disabled={state.isExecuting}
          >
            Run All
          </Button>
          {state.isExecuting && (
            <Button
              size="xs"
              color="red"
              variant="light"
              leftSection={<IconPlayerStop size={14} />}
              onClick={stopExecution}
            >
              Stop
            </Button>
          )}
          <Tooltip label="Reset">
            <ActionIcon
              variant="subtle"
              onClick={resetState}
              disabled={state.isExecuting}
            >
              <IconRefresh size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>

        {state.error && (
          <Text size="xs" c="red">
            {String(state.error)}
          </Text>
        )}

        {chainStatus && (
          <>
            <Group
              justify="space-between"
              style={{ cursor: 'pointer' }}
              onClick={() => setShowDetails(!showDetails)}
            >
              <Text size="xs" c="dimmed">
                Execution Details
              </Text>
              <ActionIcon size="xs" variant="subtle">
                {showDetails ? (
                  <IconChevronUp size={12} />
                ) : (
                  <IconChevronDown size={12} />
                )}
              </ActionIcon>
            </Group>

            <Collapse in={showDetails}>
              <ScrollArea h={200} type="auto">
                <Stack gap={4}>
                  {chainStatus && <NodeTreeItem node={chainStatus} />}
                </Stack>
              </ScrollArea>
            </Collapse>
          </>
        )}

        {state.result && state.result.finalPayload !== null && state.result.finalPayload !== undefined && (
          <Box>
            <Text size="xs" c="dimmed" mb={4}>
              Result Preview
            </Text>
            <Paper p="xs" withBorder radius="sm" bg="gray.0">
              <ScrollArea h={80} type="auto">
                <Text
                  size="xs"
                  style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}
                >
                  {JSON.stringify(state.result.finalPayload, null, 2)}
                </Text>
              </ScrollArea>
            </Paper>
          </Box>
        )}
      </Stack>
    </Paper>
  );
}

interface FloatingExecutionButtonProps {
  position?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
}

export function FloatingExecutionButton({
  position = 'bottom-right',
}: FloatingExecutionButtonProps) {
  const { state, executeFlow, stopExecution } = useFlowExecution();

  const positionStyles: Record<string, React.CSSProperties> = {
    'top-right': { top: 16, right: 16 },
    'bottom-right': { bottom: 16, right: 16 },
    'top-left': { top: 16, left: 16 },
    'bottom-left': { bottom: 16, left: 16 },
  };

  return (
    <Button
      size="lg"
      radius="xl"
      color={state.isExecuting ? 'red' : 'green'}
      onClick={state.isExecuting ? stopExecution : () => executeFlow()}
      loading={state.isExecuting}
      style={{
        position: 'absolute',
        ...positionStyles[position],
        zIndex: 10,
      }}
    >
      <IconPlayerPlay size={20} />
    </Button>
  );
}
