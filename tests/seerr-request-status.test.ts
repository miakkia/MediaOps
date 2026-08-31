import assert from 'node:assert/strict';
import test from 'node:test';

import {
  SeerrRequestProvider,
} from '../src/providers/seerr/seerr-request-provider.js';

async function withSeerrEnvironment(
  callback: () => Promise<void>,
): Promise<void> {
  const oldUrl = process.env.SEERR_URL;
  const oldKey = process.env.SEERR_API_KEY;

  process.env.SEERR_URL = 'http://seerr.test:5055';
  process.env.SEERR_API_KEY = 'test-api-key';

  try {
    await callback();
  } finally {
    if (oldUrl === undefined) delete process.env.SEERR_URL;
    else process.env.SEERR_URL = oldUrl;

    if (oldKey === undefined) delete process.env.SEERR_API_KEY;
    else process.env.SEERR_API_KEY = oldKey;
  }
}

test('Seerr request status uses the provider request ID', async () => {
  await withSeerrEnvironment(async () => {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = async input => {
      assert.equal(
        String(input),
        'http://seerr.test:5055/api/v1/request/42',
      );

      return new Response(
        JSON.stringify({
          id: 42,
          status: 2,
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
    };

    try {
      const provider = new SeerrRequestProvider();
      const status = await provider.getRequestStatus('42', 'movie');

      assert.equal(status, 'approved');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

test('Seerr request status maps completed requests as available', async () => {
  await withSeerrEnvironment(async () => {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          id: 43,
          status: 5,
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

    try {
      const provider = new SeerrRequestProvider();
      const status = await provider.getRequestStatus('43', 'series');

      assert.equal(status, 'available');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

test('Seerr rejects an invalid request ID before network access', async () => {
  await withSeerrEnvironment(async () => {
    const originalFetch = globalThis.fetch;
    let fetchCalled = false;

    globalThis.fetch = async () => {
      fetchCalled = true;
      throw new Error('fetch should not be called');
    };

    try {
      const provider = new SeerrRequestProvider();

      await assert.rejects(
        () => provider.getRequestStatus('../42', 'movie'),
        /Invalid Seerr request identifier/,
      );

      assert.equal(fetchCalled, false);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
