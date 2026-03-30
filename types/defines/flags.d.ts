export interface EvaluationDetails<T> {
  flagKey: string;
  value: T;
  variant?: string | undefined;
  reason?: string | undefined;
  errorCode?: string | undefined;
  errorMessage?: string | undefined;
}

export interface FlagEvaluationError extends Error {}

/**
 * Feature flags binding for evaluating feature flags from a Cloudflare Workers script.
 *
 * @example
 * ```typescript
 * // Get a boolean flag value with a default
 * const enabled = await env.FLAGS.getBooleanValue('my-feature', false);
 *
 * // Get full evaluation details including variant and reason
 * const details = await env.FLAGS.getBooleanDetails('my-feature', false);
 * console.log(details.variant, details.reason);
 * ```
 */
export declare abstract class Flags {
  /**
   * Get a flag value without type checking.
   * @param flagKey The key of the flag to evaluate.
   * @param defaultValue Optional default value returned when evaluation fails.
   */
  get(flagKey: string, defaultValue?: unknown): Promise<unknown>;

  /**
   * Get a boolean flag value.
   * @param flagKey The key of the flag to evaluate.
   * @param defaultValue Default value returned when evaluation fails or the flag type does not match.
   */
  getBooleanValue(flagKey: string, defaultValue: boolean): Promise<boolean>;

  /**
   * Get a string flag value.
   * @param flagKey The key of the flag to evaluate.
   * @param defaultValue Default value returned when evaluation fails or the flag type does not match.
   */
  getStringValue(flagKey: string, defaultValue: string): Promise<string>;

  /**
   * Get a number flag value.
   * @param flagKey The key of the flag to evaluate.
   * @param defaultValue Default value returned when evaluation fails or the flag type does not match.
   */
  getNumberValue(flagKey: string, defaultValue: number): Promise<number>;

  /**
   * Get an object flag value.
   * @param flagKey The key of the flag to evaluate.
   * @param defaultValue Default value returned when evaluation fails or the flag type does not match.
   */
  getObjectValue<T extends object>(
    flagKey: string,
    defaultValue: T
  ): Promise<T>;

  /**
   * Get a boolean flag value with full evaluation details.
   * @param flagKey The key of the flag to evaluate.
   * @param defaultValue Default value returned when evaluation fails or the flag type does not match.
   */
  getBooleanDetails(
    flagKey: string,
    defaultValue: boolean
  ): Promise<EvaluationDetails<boolean>>;

  /**
   * Get a string flag value with full evaluation details.
   * @param flagKey The key of the flag to evaluate.
   * @param defaultValue Default value returned when evaluation fails or the flag type does not match.
   */
  getStringDetails(
    flagKey: string,
    defaultValue: string
  ): Promise<EvaluationDetails<string>>;

  /**
   * Get a number flag value with full evaluation details.
   * @param flagKey The key of the flag to evaluate.
   * @param defaultValue Default value returned when evaluation fails or the flag type does not match.
   */
  getNumberDetails(
    flagKey: string,
    defaultValue: number
  ): Promise<EvaluationDetails<number>>;

  /**
   * Get an object flag value with full evaluation details.
   * @param flagKey The key of the flag to evaluate.
   * @param defaultValue Default value returned when evaluation fails or the flag type does not match.
   */
  getObjectDetails<T extends object>(
    flagKey: string,
    defaultValue: T
  ): Promise<EvaluationDetails<T>>;
}
