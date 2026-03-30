// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import assert from 'node:assert';

export const getBooleanValueTest = {
  async test(_, env) {
    const value = await env.FLAGS.getBooleanValue('bool-flag', false);
    assert.strictEqual(value, true);
  },
};

export const getStringValueTest = {
  async test(_, env) {
    const value = await env.FLAGS.getStringValue('string-flag', 'default');
    assert.strictEqual(value, 'variant-a');
  },
};

export const getNumberValueTest = {
  async test(_, env) {
    const value = await env.FLAGS.getNumberValue('number-flag', 0);
    assert.strictEqual(value, 42);
  },
};

export const getObjectValueTest = {
  async test(_, env) {
    const value = await env.FLAGS.getObjectValue('object-flag', {});
    assert.deepStrictEqual(value, { color: 'blue', size: 10 });
  },
};

export const getGenericTest = {
  async test(_, env) {
    const value = await env.FLAGS.get('bool-flag');
    assert.strictEqual(value, true);
  },
};

export const getBooleanDetailsTest = {
  async test(_, env) {
    const details = await env.FLAGS.getBooleanDetails('bool-flag', false);
    assert.strictEqual(details.flagKey, 'bool-flag');
    assert.strictEqual(details.value, true);
    assert.strictEqual(details.variant, 'on');
    assert.strictEqual(details.reason, 'TARGETING_MATCH');
    assert.strictEqual(details.errorCode, undefined);
  },
};

export const typeMismatchReturnsDefaultTest = {
  async test(_, env) {
    // type-mismatch-flag returns a string, but we ask for boolean
    const details = await env.FLAGS.getBooleanDetails(
      'type-mismatch-flag',
      false
    );
    assert.strictEqual(details.value, false); // default value
    assert.strictEqual(details.errorCode, 'TYPE_MISMATCH');
  },
};

export const missingFlagReturnsDefaultTest = {
  async test(_, env) {
    const value = await env.FLAGS.getBooleanValue('nonexistent-flag', false);
    assert.strictEqual(value, false);
  },
};

export const getDefaultValueOnErrorTest = {
  async test(_, env) {
    const details = await env.FLAGS.getStringDetails(
      'nonexistent-flag',
      'fallback'
    );
    assert.strictEqual(details.value, 'fallback');
    assert.strictEqual(details.errorCode, 'GENERAL');
  },
};
