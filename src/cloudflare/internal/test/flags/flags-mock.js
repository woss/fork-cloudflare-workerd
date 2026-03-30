// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

// Mock flag store for testing. Simulates a backend flags service.
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
};

export default {
  async fetch(request, _env, _ctx) {
    const url = new URL(request.url);

    // Expected path: /flags/<flagKey>
    const match = url.pathname.match(/^\/flags\/(.+)$/);
    if (!match) {
      return new Response('Not found', { status: 404 });
    }

    const flagKey = decodeURIComponent(match[1]);
    const flag = FLAGS[flagKey];

    if (!flag) {
      return Response.json(
        { error: 'FLAG_NOT_FOUND', message: `Flag "${flagKey}" not found` },
        { status: 404 }
      );
    }

    return Response.json(flag);
  },
};
