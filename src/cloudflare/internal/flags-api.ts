// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

/**
 * Stub for the FlagshipBinding JSRPC entrypoint.
 * Matches the contract in control-plane/src/binding.ts.
 */
interface FlagshipBindingStub {
  evaluate(
    flagKey: string,
    context?: EvaluationContext
  ): Promise<{
    value: unknown;
    variant?: string;
    reason?: string;
  }>;
}

export type EvaluationContext = Record<string, string | number | boolean>;

export interface EvaluationDetails<T> {
  flagKey: string;
  value: T;
  variant?: string | undefined;
  reason?: string | undefined;
  errorCode?: string | undefined;
  errorMessage?: string | undefined;
}

export class FlagEvaluationError extends Error {
  constructor(message: string, name = 'FlagEvaluationError') {
    super(message);
    this.name = name;
  }
}

export class Flags {
  #fetcher: FlagshipBindingStub;

  constructor(fetcher: FlagshipBindingStub) {
    this.#fetcher = fetcher;
  }

  async get(
    flagKey: string,
    defaultValue?: unknown,
    context?: EvaluationContext
  ): Promise<unknown> {
    const details = await this.#evaluate(flagKey, defaultValue, context);
    return details.value;
  }

  async getBooleanValue(
    flagKey: string,
    defaultValue: boolean,
    context?: EvaluationContext
  ): Promise<boolean> {
    const details = await this.getBooleanDetails(
      flagKey,
      defaultValue,
      context
    );
    return details.value;
  }

  async getStringValue(
    flagKey: string,
    defaultValue: string,
    context?: EvaluationContext
  ): Promise<string> {
    const details = await this.getStringDetails(flagKey, defaultValue, context);
    return details.value;
  }

  async getNumberValue(
    flagKey: string,
    defaultValue: number,
    context?: EvaluationContext
  ): Promise<number> {
    const details = await this.getNumberDetails(flagKey, defaultValue, context);
    return details.value;
  }

  async getObjectValue<T extends object>(
    flagKey: string,
    defaultValue: T,
    context?: EvaluationContext
  ): Promise<T> {
    const details = await this.getObjectDetails(flagKey, defaultValue, context);
    return details.value;
  }

  async getBooleanDetails(
    flagKey: string,
    defaultValue: boolean,
    context?: EvaluationContext
  ): Promise<EvaluationDetails<boolean>> {
    const details = await this.#evaluate(flagKey, defaultValue, context);
    if (typeof details.value !== 'boolean') {
      return {
        ...details,
        value: defaultValue,
        errorCode: 'TYPE_MISMATCH',
        errorMessage: `Expected boolean but got ${typeof details.value}`,
      };
    }
    return details as EvaluationDetails<boolean>;
  }

  async getStringDetails(
    flagKey: string,
    defaultValue: string,
    context?: EvaluationContext
  ): Promise<EvaluationDetails<string>> {
    const details = await this.#evaluate(flagKey, defaultValue, context);
    if (typeof details.value !== 'string') {
      return {
        ...details,
        value: defaultValue,
        errorCode: 'TYPE_MISMATCH',
        errorMessage: `Expected string but got ${typeof details.value}`,
      };
    }
    return details as EvaluationDetails<string>;
  }

  async getNumberDetails(
    flagKey: string,
    defaultValue: number,
    context?: EvaluationContext
  ): Promise<EvaluationDetails<number>> {
    const details = await this.#evaluate(flagKey, defaultValue, context);
    if (typeof details.value !== 'number') {
      return {
        ...details,
        value: defaultValue,
        errorCode: 'TYPE_MISMATCH',
        errorMessage: `Expected number but got ${typeof details.value}`,
      };
    }
    return details as EvaluationDetails<number>;
  }

  async getObjectDetails<T extends object>(
    flagKey: string,
    defaultValue: T,
    context?: EvaluationContext
  ): Promise<EvaluationDetails<T>> {
    const details = await this.#evaluate(flagKey, defaultValue, context);
    if (typeof details.value !== 'object' || details.value === null) {
      return {
        ...details,
        value: defaultValue,
        errorCode: 'TYPE_MISMATCH',
        errorMessage: `Expected object but got ${typeof details.value}`,
      };
    }
    return details as EvaluationDetails<T>;
  }

  async #evaluate(
    flagKey: string,
    defaultValue: unknown,
    context?: EvaluationContext
  ): Promise<EvaluationDetails<unknown>> {
    try {
      const result = await this.#fetcher.evaluate(flagKey, context);

      return {
        flagKey,
        value: result.value,
        variant: result.variant,
        reason: result.reason,
      };
    } catch (err) {
      return {
        flagKey,
        value: defaultValue,
        errorCode: 'GENERAL',
        errorMessage: err instanceof Error ? err.message : String(err),
      };
    }
  }
}

export default function makeBinding(env: {
  fetcher: FlagshipBindingStub;
}): Flags {
  return new Flags(env.fetcher);
}
