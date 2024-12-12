// utils.ts
import type {
  BaseType,
  ExtendedType,
  SchemaVersion,
  SchemaResult,
  TypeMetadata,
  ValidationRule,
  SchemaNode,
} from './types';
import { createHash } from 'crypto';

// --------------------------------------
// PATTERNS
// --------------------------------------

export const Patterns = {
  Python: {
    NUMPY: {
      SCALAR: /^numpy\.(int|uint|float|complex)\d*$/,
      DATETIME: /^numpy\.(datetime64|timedelta64)/,
      NDARRAY: /^numpy\.ndarray$/,
      MATRIX: /^numpy\.matrix$/,
    },
    PANDAS: {
      DATAFRAME: /^pandas\.DataFrame$/,
      SERIES: /^pandas\.Series$/,
      CATEGORICAL: /^pandas\.Categorical$/,
      INDEX: /^pandas\.(Index|MultiIndex)$/,
    },
    TYPES: {
      SET: /^(set|frozenset)$/,
      DICT: /^(dict|OrderedDict|defaultdict|Counter)$/,
      NUMERIC: /^(int|float|complex|decimal\.Decimal)$/,
      BYTES: /^(bytes|bytearray|memoryview)$/,
    },
  },
  R: {
    VECTOR: {
      ATOMIC: /^(character|numeric|integer|logical|complex)$/,
      FACTOR: /^factor$/,
      TIME: /^(POSIXct|POSIXlt|Date|difftime)$/,
    },
    FRAME: {
      DATA: /^(data\.frame|tibble|data\.table)$/,
      SPECIAL: /^(matrix|array)$/,
    },
    CLASS: {
      S3: /^.*\.__S3class__$/,
      S4: /^.*\.__S4class__$/,
    },
  },
  SQL: {
    NUMERIC: {
      INTEGER: /^(TINYINT|SMALLINT|MEDIUMINT|INT|BIGINT)$/i,
      DECIMAL: /^(DECIMAL|NUMERIC|FLOAT|DOUBLE|REAL)($$\d+,\d+$$)?$/i,
      MONEY: /^(MONEY|SMALLMONEY)$/i,
    },
    STRING: {
      CHAR: /^(CHAR|VARCHAR|TEXT|NCHAR|NVARCHAR|NTEXT)($$\d+$$)?$/i,
      BINARY: /^(BINARY|VARBINARY|BLOB|MEDIUMBLOB|LONGBLOB)$/i,
    },
    TIME: {
      DATE: /^DATE$/i,
      TIME: /^TIME($$\d+$$)?$/i,
      TIMESTAMP: /^TIMESTAMP($$\d+$$)?$/i,
      INTERVAL: /^INTERVAL$/i,
    },
    SPECIAL: {
      JSON: /^(JSON|JSONB)$/i,
      XML: /^XML$/i,
      GEOMETRIC: /^(POINT|LINE|POLYGON|CIRCLE)$/i,
      NETWORK: /^(INET|CIDR|MACADDR)$/i,
    },
  },
  TypeScript: {
    PRIMITIVE:
      /^(string|number|boolean|null|undefined|symbol|bigint|any|unknown|never)$/,
    INTERFACE: /^interface\s+(\w+)/,
    TYPE_ALIAS: /^type\s+(\w+)/,
    CLASS: /^class\s+(\w+)/,
    UNION: /\s*\|\s*/,
    INTERSECTION: /\s*&\s*/,
    GENERIC: /<([^>]+)>/,
    ARRAY: {
      BRACKET: /^(.*)$$$$$/,
      GENERIC: /^Array<(.*)>$/,
      TUPLE: /^$$(.*)$$$/,
    },
  },
} as const;

// --------------------------------------
// VALIDATORS
// --------------------------------------

export const validateSchema = (node: SchemaNode): boolean => {
  if (!node.type || !node.specificType) return false;

  if (node.rules) {
    if (!validateRules(node.rules)) return false;
  }

  if (node.items) {
    if (!validateSchema(node.items)) return false;
  }

  if (node.properties) {
    for (const prop of Object.values(node.properties)) {
      if (!validateSchema(prop)) return false;
    }
  }

  return true;
};

export const validateRules = (rules: Partial<ValidationRule>): boolean => {
  if (rules.numeric) {
    const { min, max, precision, scale } = rules.numeric;
    if (typeof min === 'number' && typeof max === 'number' && min > max)
      return false;
    if (typeof precision === 'number' && precision < 0) return false;
    if (typeof scale === 'number' && scale < 0) return false;
  }

  if (rules.string) {
    const { minLength, length, pattern, encoding } = rules.string;
    if (typeof minLength === 'number' && minLength < 0) return false;
    if (typeof length === 'number' && length < 0) return false; // Changed from maxLength to length
    if (
      typeof minLength === 'number' &&
      typeof length === 'number' &&
      minLength > length
    )
      return false; // Changed from maxLength to length
  }

  if (rules.array) {
    const { minItems, maxItems, uniqueItems, fixedSize, dimensions } =
      rules.array;
    if (typeof minItems === 'number' && minItems < 0) return false;
    if (typeof maxItems === 'number' && maxItems < 0) return false;
    if (
      typeof minItems === 'number' &&
      typeof maxItems === 'number' &&
      minItems > maxItems
    )
      return false;
  }

  return true;
};

// --------------------------------------
// TYPE GUARDS
// --------------------------------------

export const isBaseType = (type: unknown): type is BaseType =>
  typeof type === 'string' &&
  [
    'null',
    'undefined',
    'string',
    'number',
    'boolean',
    'object',
    'array',
    'date',
    'bigint',
    'integer',
    'float',
    'decimal',
    'dataframe',
  ].includes(type);

export const isExtendedType = (type: unknown): type is ExtendedType =>
  isBaseType(type) ||
  (typeof type === 'string' &&
    [
      'timestamp',
      'interval',
      'set',
      'ordered_map',
      'enum',
      'bytes',
      'json',
      'composite',
      'factor',
      'timeseries',
      'geometric',
      'network',
      'monetary',
      'range',
      'numpy',
      'pandas',
      'tuple',
      'union',
      'intersection',
      'interface',
      'type',
      'class',
      'dict',
      'complex',
      'atomic',
      'matrix',
      'xml',
      'sql',
      'r_object',
      'data.frame',
      'series',
    ].includes(type)) ||
  /\w+_class$/.test(type as string);

// --------------------------------------
// METADATA HELPERS
// --------------------------------------

export const createVersion = (
  major = 1,
  minor = 0,
  patch = 0,
): SchemaVersion => ({
  major,
  minor,
  patch,
  hash: generateHash(`${major}.${minor}.${patch}`),
});

export const mergeMetadata = (
  base: TypeMetadata,
  extension: Partial<TypeMetadata>,
): TypeMetadata => ({
  ...base,
  ...extension,
  constraints: {
    ...(base.constraints || {}),
    ...(extension.constraints || {}),
  },
});

// --------------------------------------
// UTILITY FUNCTIONS
// --------------------------------------

export const generateHash = (value: unknown): string => {
  const hash = createHash('sha256');
  hash.update(typeof value === 'string' ? value : JSON.stringify(value));
  return hash.digest('hex');
};

export const cleanCode = (code: string): string =>
  code.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '').trim();

export const timeout = <T>(promise: Promise<T>, ms: number): Promise<T> =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Operation timed out after ${ms}ms`));
    }, ms);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });

// --------------------------------------
// TYPE INFERENCE HELPERS
// --------------------------------------

export const inferPrecisionScale = (
  value: number,
): { precision: number; scale: number } => {
  const str = value.toString();
  const [integer, decimal = ''] = str.split('.');
  return {
    precision: integer.length + decimal.length,
    scale: decimal.length,
  };
};

export const inferArrayType = (
  arr: unknown[],
): {
  elementType: BaseType;
  isHomogeneous: boolean;
  dimensions: number[];
} => {
  if (arr.length === 0) {
    return { elementType: 'undefined', isHomogeneous: true, dimensions: [0] };
  }

  const types = new Set(arr.map((item) => typeof item));
  return {
    elementType:
      types.size === 1 ? (Array.from(types)[0] as BaseType) : 'object',
    isHomogeneous: types.size === 1,
    dimensions: [arr.length],
  };
};

export const inferDateType = (
  value: Date,
): {
  hasTime: boolean;
  hasTimezone: boolean;
  timestamp: number;
} => ({
  hasTime:
    value.getHours() !== 0 ||
    value.getMinutes() !== 0 ||
    value.getSeconds() !== 0,
  hasTimezone: value.toString().includes('GMT'),
  timestamp: value.getTime(),
});

// --------------------------------------
// SCHEMA COMPARISON AND MERGING
// --------------------------------------

export const compareSchemas = (a: SchemaNode, b: SchemaNode): boolean => {
  if (a.type !== b.type || a.specificType !== b.specificType) return false;
  if (a.nullable !== b.nullable) return false;

  if (a.items && b.items) {
    if (!compareSchemas(a.items, b.items)) return false;
  } else if (a.items || b.items) {
    return false;
  }

  if (a.properties && b.properties) {
    const aKeys = Object.keys(a.properties);
    const bKeys = Object.keys(b.properties);
    if (aKeys.length !== bKeys.length) return false;

    for (const key of aKeys) {
      if (!b.properties[key]) return false;
      if (!compareSchemas(a.properties[key], b.properties[key])) return false;
    }
  } else if (a.properties || b.properties) {
    return false;
  }

  return true;
};

export const mergeSchemas = (a: SchemaNode, b: SchemaNode): SchemaNode => {
  if (!compareSchemas(a, b)) {
    throw new Error('Cannot merge incompatible schemas');
  }

  return {
    type: a.type,
    specificType: a.specificType,
    nullable: a.nullable || b.nullable,
    rules: mergeRules(a.rules, b.rules),
    items:
      a.items && b.items ? mergeSchemas(a.items, b.items) : a.items || b.items,
    properties:
      a.properties && b.properties
        ? Object.fromEntries(
            Object.entries(a.properties).map(([key, value]) => [
              key,
              mergeSchemas(value, b.properties![key]),
            ]),
          )
        : a.properties || b.properties,
    metadata: mergeMetadata(a.metadata || {}, b.metadata || {}),
    version: a.version || b.version,
    checksum: generateHash({ ...a, ...b }),
  };
};

export const mergeRules = (
  a?: Partial<ValidationRule>,
  b?: Partial<ValidationRule>,
): Partial<ValidationRule> | undefined => {
  if (!a && !b) return undefined;
  if (!a) return b;
  if (!b) return a;

  return {
    numeric:
      a.numeric || b.numeric
        ? {
            min: Math.min(
              a.numeric?.min ?? -Infinity,
              b.numeric?.min ?? -Infinity,
            ),
            max: Math.max(
              a.numeric?.max ?? Infinity,
              b.numeric?.max ?? Infinity,
            ),
            precision: Math.max(
              a.numeric?.precision ?? 0,
              b.numeric?.precision ?? 0,
            ),
            scale: Math.max(a.numeric?.scale ?? 0, b.numeric?.scale ?? 0),
            allowNegative: a.numeric?.allowNegative || b.numeric?.allowNegative,
            isInteger: a.numeric?.isInteger && b.numeric?.isInteger,
          }
        : undefined,
    string:
      a.string || b.string
        ? {
            minLength: Math.min(
              a.string?.minLength ?? 0,
              b.string?.minLength ?? 0,
            ),
            length: Math.max(
              a.string?.length ?? Infinity,
              b.string?.length ?? Infinity,
            ), // Changed from maxLength to length
            pattern: a.string?.pattern || b.string?.pattern,
            encoding: a.string?.encoding || b.string?.encoding,
          }
        : undefined,
    array:
      a.array || b.array
        ? {
            minItems: Math.min(a.array?.minItems ?? 0, b.array?.minItems ?? 0),
            maxItems: Math.max(
              a.array?.maxItems ?? Infinity,
              b.array?.maxItems ?? Infinity,
            ),
            uniqueItems: a.array?.uniqueItems || b.array?.uniqueItems,
            fixedSize: a.array?.fixedSize && b.array?.fixedSize,
            dimensions: a.array?.dimensions || b.array?.dimensions,
          }
        : undefined,
    common:
      a.common || b.common
        ? {
            required: a.common?.required || b.common?.required,
            nullable: a.common?.nullable || b.common?.nullable,
            immutable: a.common?.immutable && b.common?.immutable,
            enumValues: [
              ...new Set([
                ...(a.common?.enumValues || []),
                ...(b.common?.enumValues || []),
              ]),
            ],
          }
        : undefined,
  };
};
