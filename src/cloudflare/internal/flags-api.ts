// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

interface Fetcher {
  fetch: typeof fetch;
}

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
  #fetcher: Fetcher;
  #endpointUrl = 'https://workers-binding.flags';

  constructor(fetcher: Fetcher) {
    this.#fetcher = fetcher;
  }

  async get(flagKey: string, defaultValue?: unknown): Promise<unknown> {
    const details = await this.#evaluate(flagKey, defaultValue);
    return details.value;
  }

  async getBooleanValue(
    flagKey: string,
    defaultValue: boolean
  ): Promise<boolean> {
    const details = await this.getBooleanDetails(flagKey, defaultValue);
    return details.value;
  }

  async getStringValue(flagKey: string, defaultValue: string): Promise<string> {
    const details = await this.getStringDetails(flagKey, defaultValue);
    return details.value;
  }

  async getNumberValue(flagKey: string, defaultValue: number): Promise<number> {
    const details = await this.getNumberDetails(flagKey, defaultValue);
    return details.value;
  }

  async getObjectValue<T extends object>(
    flagKey: string,
    defaultValue: T
  ): Promise<T> {
    const details = await this.getObjectDetails(flagKey, defaultValue);
    return details.value;
  }

  async getBooleanDetails(
    flagKey: string,
    defaultValue: boolean
  ): Promise<EvaluationDetails<boolean>> {
    const details = await this.#evaluate(flagKey, defaultValue);
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
    defaultValue: string
  ): Promise<EvaluationDetails<string>> {
    const details = await this.#evaluate(flagKey, defaultValue);
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
    defaultValue: number
  ): Promise<EvaluationDetails<number>> {
    const details = await this.#evaluate(flagKey, defaultValue);
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
    defaultValue: T
  ): Promise<EvaluationDetails<T>> {
    const details = await this.#evaluate(flagKey, defaultValue);
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
    defaultValue: unknown
  ): Promise<EvaluationDetails<unknown>> {
    try {
      const res = await this.#fetcher.fetch(
        `${this.#endpointUrl}/flags/${encodeURIComponent(flagKey)}`,
        {
          method: 'GET',
          headers: {
            'content-type': 'application/json',
          },
        }
      );

      if (!res.ok) {
        const text = await res.text();
        return {
          flagKey,
          value: defaultValue,
          errorCode: 'GENERAL',
          errorMessage: text,
        };
      }

      const data = (await res.json()) as {
        value: unknown;
        variant?: string;
        reason?: string;
      };

      return {
        flagKey,
        value: data.value,
        variant: data.variant,
        reason: data.reason,
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

export default function makeBinding(env: { fetcher: Fetcher }): Flags {
  return new Flags(env.fetcher);
}
