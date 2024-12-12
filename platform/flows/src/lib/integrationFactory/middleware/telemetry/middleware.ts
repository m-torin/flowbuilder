// telemetry/middleware.ts
import {
  Middleware,
  MiddlewareContext,
  MiddlewareResult,
  NextFunction,
} from '../base';
import {
  TelemetryOptions,
  TelemetryProvider,
  SpanAttributes,
  Span,
} from './types';

export class TelemetryMiddleware {
  constructor(
    private readonly provider: TelemetryProvider,
    private readonly options: TelemetryOptions = {},
  ) {}

  handle: Middleware = async (
    context: MiddlewareContext,
    next: NextFunction,
  ): Promise<MiddlewareResult> => {
    // Check if telemetry is disabled or shouldn't sample this operation
    if (
      this.options.enabled === false ||
      (this.options.shouldSample &&
        !this.options.shouldSample(context.operation))
    ) {
      return next();
    }

    // Create base attributes
    const attributes: SpanAttributes = {
      operation: context.operation,
      ...this.options.defaultAttributes,
      ...Object.entries(context.metadata)
        .filter(([_, v]) => this.isValidAttributeValue(v))
        .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {}),
    };

    // Create span
    const span = this.provider.createSpan(context.operation, attributes);

    try {
      const result = await next();

      if (result.duration) {
        span.addAttribute('duration_ms', result.duration);
      }

      if (result.error) {
        span.setStatus('error', result.error.message);
        span.addAttribute('error.type', result.error.name);
        span.addAttribute('error.message', result.error.message);
      } else {
        span.setStatus('success');
      }

      return result;
    } catch (error) {
      const err = error as Error;
      span.setStatus('error', err.message);
      span.addAttribute('error.type', err.name);
      span.addAttribute('error.message', err.message);

      if (this.options.errorHandler) {
        this.options.errorHandler(err);
      }

      throw error;
    } finally {
      span.end();
    }
  };

  private isValidAttributeValue(
    value: unknown,
  ): value is string | number | boolean | Array<string | number | boolean> {
    if (Array.isArray(value)) {
      return value.every(
        (v) =>
          typeof v === 'string' ||
          typeof v === 'number' ||
          typeof v === 'boolean',
      );
    }
    return (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    );
  }
}

// Add this class before or after TelemetryMiddleware
export class DefaultTelemetryProvider implements TelemetryProvider {
  createSpan(operation: string, attributes?: SpanAttributes): Span {
    // Basic console-based implementation for development
    const startTime = Date.now();
    console.log(`[Telemetry] Starting span: ${operation}`, attributes);

    return {
      addAttribute: (key, value) => {
        console.log(`[Telemetry] Attribute added: ${key}=${value}`);
      },
      addEvent: (name, attrs) => {
        console.log(`[Telemetry] Event recorded: ${name}`, attrs);
      },
      setStatus: (status, description) => {
        console.log(`[Telemetry] Status set: ${status}`, description);
      },
      end: () => {
        const duration = Date.now() - startTime;
        console.log(`[Telemetry] Span ended: ${operation} (${duration}ms)`);
      },
    };
  }

  async shutdown(): Promise<void> {
    console.log('[Telemetry] Provider shutdown');
  }
}
