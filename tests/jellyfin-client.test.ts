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

test('Jellyfin client can load without Jellyfin credentials', async () => {
  await withEnvironment(
    {
      JELLYFIN_URL:
        undefined,
      JELLYFIN_API_KEY:
        undefined,
    },
    async () => {
      const module =
        await import(
          `../src/providers/jellyfin/jellyfin-client.js?lazy=${Date.now()}`
        );

      assert.equal(
        typeof module.jellyfinFetch,
        'function',
      );
    },
  );
});

test('Jellyfin access fails closed when credentials are missing', async () => {
  await withEnvironment(
    {
      JELLYFIN_URL:
        undefined,
      JELLYFIN_API_KEY:
        undefined,
    },
    async () => {
      const module =
        await import(
          `../src/providers/jellyfin/jellyfin-client.js?missing=${Date.now()}`
        );

      await assert.rejects(
        module.jellyfinFetch(
          '/System/Info',
        ),
        /JELLYFIN_URL and JELLYFIN_API_KEY are required when MEDIA_PROVIDER=jellyfin/,
      );
    },
  );
});