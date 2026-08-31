import assert from 'node:assert/strict';
import test from 'node:test';

test(
  'selects Seerr without requiring Ombi credentials',
  async () => {
    const previousRequestProvider =
      process.env.REQUEST_PROVIDER;

    const previousOmbiUrl =
      process.env.OMBI_URL;

    const previousOmbiApiKey =
      process.env.OMBI_API_KEY;

    try {
      process.env.REQUEST_PROVIDER =
        'seerr';

      delete process.env.OMBI_URL;
      delete process.env.OMBI_API_KEY;

      const module =
        await import(
          `../src/providers/request-provider-instance.js?seerr-test=${Date.now()}`
        );

      assert.equal(
        module.requestProviderName,
        'seerr',
      );

      assert.equal(
        module.requestProvider?.name,
        'Seerr',
      );
    } finally {
      if (
        previousRequestProvider === undefined
      ) {
        delete process.env.REQUEST_PROVIDER;
      } else {
        process.env.REQUEST_PROVIDER =
          previousRequestProvider;
      }

      if (
        previousOmbiUrl === undefined
      ) {
        delete process.env.OMBI_URL;
      } else {
        process.env.OMBI_URL =
          previousOmbiUrl;
      }

      if (
        previousOmbiApiKey === undefined
      ) {
        delete process.env.OMBI_API_KEY;
      } else {
        process.env.OMBI_API_KEY =
          previousOmbiApiKey;
      }
    }
  },
);