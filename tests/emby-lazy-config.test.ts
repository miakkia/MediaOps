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

test('Emby module can load without Emby credentials', async () => {
  await withEnvironment(
    {
      EMBY_URL: undefined,
      EMBY_API_KEY: undefined,
    },
    async () => {
      const module = await import(
        `../src/services/emby.js?lazy=${Date.now()}`
      );

      assert.equal(
        typeof module.getEmbySystemInfo,
        'function',
      );
    },
  );
});

test('Emby access fails closed when credentials are missing', async () => {
  await withEnvironment(
    {
      EMBY_URL: undefined,
      EMBY_API_KEY: undefined,
    },
    async () => {
      const module = await import(
        `../src/services/emby.js?missing=${Date.now()}`
      );

      await assert.rejects(
        module.getEmbySystemInfo(),
        /EMBY_URL and EMBY_API_KEY are required when MEDIA_PROVIDER=emby/,
      );
    },
  );
});