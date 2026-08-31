import assert from 'node:assert/strict';
import test from 'node:test';

function withEnvironment(
  values: Record<string, string | undefined>,
  callback: () => Promise<void>,
): Promise<void> {
  const previous =
    new Map<string, string | undefined>();

  for (
    const [key, value]
    of Object.entries(values)
  ) {
    previous.set(
      key,
      process.env[key],
    );

    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] =
        value;
    }
  }

  return callback().finally(
    () => {
      for (
        const [key, value]
        of previous
      ) {
        if (value === undefined) {
          delete process.env[key];
        } else {
          process.env[key] =
            value;
        }
      }
    },
  );
}

test('Jellyfin provider reads system information', async () => {
  await withEnvironment(
    {
      JELLYFIN_URL:
        'http://127.0.0.1:8096',
      JELLYFIN_API_KEY:
        'test-token',
    },
    async () => {
      const originalFetch =
        globalThis.fetch;

      globalThis.fetch =
        async (
          input,
          init,
        ) => {
          assert.equal(
            String(input),
            'http://127.0.0.1:8096/System/Info',
          );

          assert.equal(
            init?.method,
            'GET',
          );

          assert.equal(
            new Headers(init?.headers)
              .get('X-Emby-Token'),
            'test-token',
          );

          return new Response(
            JSON.stringify({
              ServerName:
                'MediaOps Jellyfin',
              Version:
                '10.11.0',
            }),
            {
              status:
                200,

              headers: {
                'Content-Type':
                  'application/json',
              },
            },
          );
        };

      try {
        const {
          JellyfinMediaProvider,
        } =
          await import(
            `../src/providers/jellyfin/jellyfin-provider.js?system=${Date.now()}`
          );

        const provider =
          new JellyfinMediaProvider();

        const info =
          await provider.getSystemInfo();

        assert.deepEqual(
          info,
          {
            serverName:
              'MediaOps Jellyfin',
            version:
              '10.11.0',
          },
        );
      } finally {
        globalThis.fetch =
          originalFetch;
      }
    },
  );
});