// ==================================================================================
// Compute Node Utilities
// ==================================================================================

import {
  createComputeSuccess,
  createComputeError,
  generateEventId,
} from '#/lib/execution/computeRegistry';

// Re-export from execution module
export { createComputeSuccess, createComputeError, generateEventId };

// ==================================================================================
// Type Guards
// ==================================================================================

/**
 * Check if value is a number
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Check if value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Check if value is an array
 */
export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/**
 * Check if value is an object
 */
export function isObject(
  value: unknown,
): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// ==================================================================================
// Value Extraction
// ==================================================================================

/**
 * Extract numeric values from input
 */
export function extractNumbers(input: Record<string, unknown>): number[] {
  const numbers: number[] = [];

  for (const value of Object.values(input)) {
    if (isNumber(value)) {
      numbers.push(value);
    } else if (isString(value)) {
      const parsed = parseFloat(value);
      if (!isNaN(parsed)) {
        numbers.push(parsed);
      }
    } else if (isArray(value)) {
      for (const item of value) {
        if (isNumber(item)) {
          numbers.push(item);
        }
      }
    }
  }

  return numbers;
}

/**
 * Extract string values from input
 */
export function extractStrings(input: Record<string, unknown>): string[] {
  const strings: string[] = [];

  for (const value of Object.values(input)) {
    if (isString(value)) {
      strings.push(value);
    } else if (isArray(value)) {
      for (const item of value) {
        if (isString(item)) {
          strings.push(item);
        }
      }
    }
  }

  return strings;
}

/**
 * Extract array from input (first array found or merge all arrays)
 */
export function extractArray(
  input: Record<string, unknown>,
  merge = false,
): unknown[] {
  if (merge) {
    const arrays: unknown[] = [];
    for (const value of Object.values(input)) {
      if (isArray(value)) {
        arrays.push(...value);
      }
    }
    return arrays;
  }

  // Return first array found
  for (const value of Object.values(input)) {
    if (isArray(value)) {
      return value;
    }
  }

  return [];
}

// ==================================================================================
// Comparison Utilities
// ==================================================================================

export type ComparisonOperator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'contains'
  | 'startsWith'
  | 'endsWith'
  | 'matches';

/**
 * Compare two values using the specified operator
 */
export function compare(
  a: unknown,
  b: unknown,
  operator: ComparisonOperator,
): boolean {
  switch (operator) {
    case 'eq':
      return a === b;
    case 'neq':
      return a !== b;
    case 'gt':
      return isNumber(a) && isNumber(b) && a > b;
    case 'gte':
      return isNumber(a) && isNumber(b) && a >= b;
    case 'lt':
      return isNumber(a) && isNumber(b) && a < b;
    case 'lte':
      return isNumber(a) && isNumber(b) && a <= b;
    case 'contains':
      return isString(a) && isString(b) && a.includes(b);
    case 'startsWith':
      return isString(a) && isString(b) && a.startsWith(b);
    case 'endsWith':
      return isString(a) && isString(b) && a.endsWith(b);
    case 'matches':
      if (isString(a) && isString(b)) {
        try {
          return new RegExp(b).test(a);
        } catch {
          return false;
        }
      }
      return false;
    default:
      return false;
  }
}

// ==================================================================================
// Aggregation Utilities
// ==================================================================================

export type AggregationType =
  | 'sum'
  | 'avg'
  | 'min'
  | 'max'
  | 'count'
  | 'first'
  | 'last'
  | 'concat';

/**
 * Aggregate array values
 */
export function aggregate(
  values: unknown[],
  type: AggregationType,
): unknown {
  switch (type) {
    case 'sum': {
      const nums = values.filter(isNumber);
      return nums.reduce((a, b) => a + b, 0);
    }
    case 'avg': {
      const nums = values.filter(isNumber);
      return nums.length > 0
        ? nums.reduce((a, b) => a + b, 0) / nums.length
        : 0;
    }
    case 'min': {
      const nums = values.filter(isNumber);
      return nums.length > 0 ? Math.min(...nums) : null;
    }
    case 'max': {
      const nums = values.filter(isNumber);
      return nums.length > 0 ? Math.max(...nums) : null;
    }
    case 'count':
      return values.length;
    case 'first':
      return values[0] ?? null;
    case 'last':
      return values[values.length - 1] ?? null;
    case 'concat': {
      const strs = values.filter(isString);
      return strs.join('');
    }
    default:
      return null;
  }
}

// ==================================================================================
// Safe Expression Evaluation
// ==================================================================================

/**
 * Safely evaluate a simple expression
 * Only supports basic property access and comparisons
 * Does NOT use eval() for security
 */
export function evaluateExpression(
  expression: string,
  context: Record<string, unknown>,
): unknown {
  // Simple property access: "property" or "property.nested"
  const propertyMatch = expression.match(/^([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*)$/);
  if (propertyMatch) {
    const path = propertyMatch[1].split('.');
    let value: unknown = context;
    for (const key of path) {
      if (isObject(value) && key in value) {
        value = value[key];
      } else {
        return undefined;
      }
    }
    return value;
  }

  // Simple comparison: "property == value" or "property > 5"
  const comparisonMatch = expression.match(
    /^([a-zA-Z_][a-zA-Z0-9_]*)\s*(==|!=|>|>=|<|<=)\s*(.+)$/,
  );
  if (comparisonMatch) {
    const [, prop, op, valueStr] = comparisonMatch;
    const propValue = context[prop];

    // Parse the value
    let compareValue: unknown;
    if (valueStr === 'true') compareValue = true;
    else if (valueStr === 'false') compareValue = false;
    else if (valueStr === 'null') compareValue = null;
    else if (/^-?\d+\.?\d*$/.test(valueStr)) compareValue = parseFloat(valueStr);
    else if (valueStr.startsWith('"') && valueStr.endsWith('"'))
      compareValue = valueStr.slice(1, -1);
    else if (valueStr.startsWith("'") && valueStr.endsWith("'"))
      compareValue = valueStr.slice(1, -1);
    else compareValue = valueStr;

    const opMap: Record<string, ComparisonOperator> = {
      '==': 'eq',
      '!=': 'neq',
      '>': 'gt',
      '>=': 'gte',
      '<': 'lt',
      '<=': 'lte',
    };

    return compare(propValue, compareValue, opMap[op]);
  }

  // Return undefined for unsupported expressions
  return undefined;
}

