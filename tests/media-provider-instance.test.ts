import assert from 'node:assert/strict';
import test from 'node:test';

function withEnvironment(
  values: Record<string, string | undefined>,
  callback: () => Promise<void>,
): Promise<void> {
  const previous = new Map<string, string | undefined>();

  for (const [key, value] of Object.entries(values)) {
    previous.set(key, process.env[key]);

    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  return callback().finally(() => {
    for (const [key, value] of previous) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  });
}

test('selects Jellyfin without requiring Emby credentials', async () => {
  await withEnvironment(
    {
      MEDIA_PROVIDER: 'jellyfin',
      EMBY_URL: undefined,
      EMBY_API_KEY: undefined,
    },
    async () => {
      const module = await import(
        `../src/providers/media-provider-instance.js?jellyfin=${Date.now()}`
      );

      assert.equal(
        module.mediaProvider.name,
        'jellyfin',
      );
    },
  );
});