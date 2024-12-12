// sql.ts
import type { SchemaResult, AnalyzerOptions, ExtendedType } from '../types';
import { Patterns, inferPrecisionScale } from '../utils';

export const analyzeSQL = (
  code: string,
  options?: AnalyzerOptions,
): SchemaResult => {
  const { strict = true } = options ?? {};

  try {
    if (!code?.trim()) {
      throw new Error('Empty SQL code');
    }

    const cleanCode = code.replace(/\/\*[\s\S]*?\*\/|--.*$/gm, '').trim();

    // Numeric patterns
    for (const [key, pattern] of Object.entries(Patterns.SQL.NUMERIC)) {
      if (pattern.test(cleanCode)) {
        const precisionMatch = cleanCode.match(/$$(\d+)(?:,(\d+))?$$/);
        const metadata = precisionMatch
          ? {
              precision: parseInt(precisionMatch[1]),
              scale: precisionMatch[2] ? parseInt(precisionMatch[2]) : 0,
            }
          : {};

        return {
          baseType: key === 'INTEGER' ? 'integer' : 'number',
          specificType:
            (cleanCode.match(pattern)?.[1]?.toLowerCase() as ExtendedType) ??
            'number', // Cast to ExtendedType
          metadata: {
            ...metadata,
            sqlType: key.toLowerCase(),
            isExact: key === 'INTEGER' || key === 'DECIMAL',
            isMoney: key === 'MONEY',
            allowNegative: !cleanCode.toLowerCase().includes('unsigned'),
          },
          confidence: 1,
          language: 'sql',
        };
      }
    }

    // String patterns
    for (const [key, pattern] of Object.entries(Patterns.SQL.STRING)) {
      if (pattern.test(cleanCode)) {
        const lengthMatch = cleanCode.match(/$$(\d+)$$/);
        return {
          baseType: 'string',
          specificType:
            (cleanCode.match(pattern)?.[1]?.toLowerCase() as ExtendedType) ??
            'string', // Cast to ExtendedType
          metadata: {
            sqlType: key.toLowerCase(),
            isFixedLength: key === 'CHAR',
            isBinary: key === 'BINARY',
            length: lengthMatch ? parseInt(lengthMatch[1]) : undefined, // Changed from maxLength to length
            encoding: cleanCode.toLowerCase().includes('n')
              ? 'unicode'
              : 'ascii',
          },
          confidence: 1,
          language: 'sql',
        };
      }
    }

    // Time patterns
    for (const [key, pattern] of Object.entries(Patterns.SQL.TIME)) {
      if (pattern.test(cleanCode)) {
        const precisionMatch = cleanCode.match(/$$(\d+)$$/);
        return {
          baseType: 'date',
          specificType:
            (cleanCode.match(pattern)?.[1]?.toLowerCase() as ExtendedType) ??
            'date', // Cast to ExtendedType
          metadata: {
            sqlType: key.toLowerCase(),
            hasTimezone:
              key === 'TIMESTAMP' ||
              cleanCode.toLowerCase().includes('with time zone'),
            precision: precisionMatch ? parseInt(precisionMatch[1]) : undefined,
            isInterval: key === 'INTERVAL',
          },
          confidence: 1,
          language: 'sql',
        };
      }
    }

    // Special types
    for (const [key, pattern] of Object.entries(Patterns.SQL.SPECIAL)) {
      if (pattern.test(cleanCode)) {
        switch (key) {
          case 'JSON':
            return {
              baseType: 'object',
              specificType: 'json',
              metadata: {
                sqlType: 'json',
                isBinary: cleanCode.toLowerCase().includes('jsonb'),
              },
              confidence: 1,
              language: 'sql',
            };
          case 'XML':
            return {
              baseType: 'string',
              specificType: 'xml',
              metadata: {
                sqlType: 'xml',
                isStructured: true,
              },
              confidence: 1,
              language: 'sql',
            };
          case 'GEOMETRIC':
            return {
              baseType: 'object',
              specificType: 'geometric',
              metadata: {
                sqlType: cleanCode.match(pattern)?.[1]?.toLowerCase(),
                isGeometric: true,
                dimensions: [2],
              },
              confidence: 1,
              language: 'sql',
            };
          case 'NETWORK':
            return {
              baseType: 'string',
              specificType: 'network',
              metadata: {
                sqlType: cleanCode.match(pattern)?.[1]?.toLowerCase(),
                isNetwork: true,
                isIPv6: cleanCode.toLowerCase().includes('inet6'),
              },
              confidence: 1,
              language: 'sql',
            };
        }
      }
    }

    // Default SQL type
    return {
      baseType: 'object',
      specificType: 'sql',
      metadata: {},
      confidence: 0.5,
      language: 'sql',
    };
  } catch (error) {
    if (strict) throw error;
    return {
      baseType: 'null',
      specificType: 'null',
      metadata: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      confidence: 0,
      language: 'sql',
    };
  }
};
