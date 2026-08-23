import assert from 'node:assert/strict';
import test from 'node:test';

function withEnvironment(
  values: Record<string, string | undefined>,
  callback: () => Promise<void>,
): Promise<void> {
  const previous = new Map<string, string | undefined>();

  for (const [key, value] of Object.entries(values)) {
    previous.set(key, process.env[key]);
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }

  return callback().finally(() => {
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
}

test('starts with no request provider when REQUEST_PROVIDER is omitted', async () => {
  await withEnvironment(
    {
      REQUEST_PROVIDER: undefined,
      OMBI_URL: undefined,
      OMBI_API_KEY: undefined,
    },
    async () => {
      const module = await import(
        `../src/providers/request-provider-instance.js?none=${Date.now()}`
      );

      assert.equal(module.requestProviderName, 'none');
      assert.equal(module.requestProvider, undefined);
    },
  );
});
