import assert from 'node:assert/strict';
import test from 'node:test';

import {
  JellyfinMediaProvider,
} from '../src/providers/jellyfin/jellyfin-provider.js';

async function withJellyfinEnvironment(
  callback: () => Promise<void>,
): Promise<void> {
  const oldUrl = process.env.JELLYFIN_URL;
  const oldKey = process.env.JELLYFIN_API_KEY;

  process.env.JELLYFIN_URL = 'http://jellyfin.test:8096';
  process.env.JELLYFIN_API_KEY = 'test-api-key';

  try {
    await callback();
  } finally {
    if (oldUrl === undefined) delete process.env.JELLYFIN_URL;
    else process.env.JELLYFIN_URL = oldUrl;

    if (oldKey === undefined) delete process.env.JELLYFIN_API_KEY;
    else process.env.JELLYFIN_API_KEY = oldKey;
  }
}

test('Jellyfin provider retrieves primary poster bytes securely', async () => {
  await withJellyfinEnvironment(async () => {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = async (input, init) => {
      assert.equal(
        String(input),
        'http://jellyfin.test:8096/Items/movie-1/Images/Primary?maxWidth=342&quality=90',
      );
      assert.equal(
        new Headers(init?.headers).get('X-Emby-Token'),
        'test-api-key',
      );
      assert.equal(String(input).includes('test-api-key'), false);
      assert.equal(init?.redirect, 'error');

      return new Response(new Uint8Array([1, 2, 3]), {
        status: 200,
        headers: {
          'Content-Type': 'image/jpeg',
          'Content-Length': '3',
        },
      });
    };

    try {
      const provider = new JellyfinMediaProvider();
      const poster = await provider.getPoster('movie-1');

      assert.equal(poster?.contentType, 'image/jpeg');
      assert.deepEqual(Array.from(poster?.data ?? []), [1, 2, 3]);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

test('Jellyfin event artwork falls back from Banner to Backdrop', async () => {
  await withJellyfinEnvironment(async () => {
    const originalFetch = globalThis.fetch;
    const paths: string[] = [];

    globalThis.fetch = async input => {
      const url = new URL(String(input));
      paths.push(url.pathname);

      if (url.pathname.endsWith('/Images/Banner')) {
        return new Response('', { status: 404 });
      }

      return new Response(new Uint8Array([9, 8, 7]), {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Content-Length': '3',
        },
      });
    };

    try {
      const provider = new JellyfinMediaProvider();
      const artwork = await provider.getEventArtwork('movie-1');

      assert.deepEqual(paths, [
        '/Items/movie-1/Images/Banner',
        '/Items/movie-1/Images/Backdrop',
      ]);
      assert.equal(artwork?.contentType, 'image/png');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

test('Jellyfin image lookup rejects invalid IDs before network access', async () => {
  await withJellyfinEnvironment(async () => {
    const originalFetch = globalThis.fetch;
    let fetchCalled = false;

    globalThis.fetch = async () => {
      fetchCalled = true;
      throw new Error('fetch should not run');
    };

    try {
      const provider = new JellyfinMediaProvider();

      await assert.rejects(
        provider.getPoster('../invalid'),
        /Invalid Jellyfin item ID/,
      );
      assert.equal(fetchCalled, false);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

test('Jellyfin images enforce the five MiB response limit', async () => {
  await withJellyfinEnvironment(async () => {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = async () =>
      new Response(new Uint8Array([1]), {
        status: 200,
        headers: {
          'Content-Type': 'image/jpeg',
          'Content-Length': String((5 * 1024 * 1024) + 1),
        },
      });

    try {
      const provider = new JellyfinMediaProvider();
      assert.equal(await provider.getPoster('movie-1'), undefined);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
