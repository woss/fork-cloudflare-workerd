// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { WorkerEntrypoint } from 'cloudflare:workers';

// Mock flag store for testing. Simulates the FlagshipBinding JSRPC entrypoint.
const FLAGS = {
  'bool-flag': { value: true, variant: 'on', reason: 'TARGETING_MATCH' },
  'string-flag': {
    value: 'variant-a',
    variant: 'a',
    reason: 'TARGETING_MATCH',
  },
  'number-flag': { value: 42, variant: 'fourty-two', reason: 'DEFAULT' },
  'object-flag': {
    value: { color: 'blue', size: 10 },
    variant: 'blue-10',
    reason: 'SPLIT',
  },
  'type-mismatch-flag': {
    value: 'not-a-boolean',
    variant: 'default',
    reason: 'DEFAULT',
  },
  'context-flag': {
    value: 'context-default',
    variant: 'default',
    reason: 'DEFAULT',
  },
};

export class FlagshipBinding extends WorkerEntrypoint {
  /**
   * Evaluate a feature flag, optionally using evaluation context for targeting.
   * Matches the contract of the real FlagshipBinding entrypoint.
   * @param {string} flagKey
   * @param {Record<string, string | number | boolean>} [context]
   * @returns {Promise<{value: unknown, variant?: string, reason?: string}>}
   */
  async evaluate(flagKey, context) {
    const flag = FLAGS[flagKey];
    if (!flag) {
      throw new Error(`Flag "${flagKey}" not found`);
    }

    // Simulate context-based targeting for the context-flag
    if (flagKey === 'context-flag' && context?.region === 'eu') {
      return { value: 'eu-variant', variant: 'eu', reason: 'TARGETING_MATCH' };
    }

    return flag;
  }
}
