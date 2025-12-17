// ==================================================================================
// Register Compute Nodes
// ==================================================================================
// This file registers the new compute node functions.
// Separated to avoid circular dependencies with the main registry.

import { registerComputeFunction } from './computeRegistry';
import type { ComputeFunction } from './types';

// Import compute functions
import {
  compareCompute,
  switchCompute,
  conditionalCompute,
} from '#/flows/nodes/compute/logic';
import {
  filterCompute,
  mapCompute,
  reduceCompute,
} from '#/flows/nodes/compute/data';

// Register compute nodes - Logic
registerComputeFunction('compareNode', compareCompute as ComputeFunction, 'transform');
registerComputeFunction('switchNode', switchCompute as ComputeFunction, 'transform');
registerComputeFunction('conditionalNode', conditionalCompute as ComputeFunction, 'transform');

// Register compute nodes - Data
registerComputeFunction('filterNode', filterCompute as ComputeFunction, 'transform');
registerComputeFunction('mapNode', mapCompute as ComputeFunction, 'transform');
registerComputeFunction('reduceNode', reduceCompute as ComputeFunction, 'transform');

