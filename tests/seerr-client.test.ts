import assert from 'node:assert/strict';
import test from 'node:test';

async function withEnvironment(
  values: Record<string, string | undefined>,
  callback: () => Promise<void>,
): Promise<void> {
  const previous =
    new Map<string, string | undefined>();

  for (const [key, value] of Object.entries(values)) {
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

  try {
    await callback();
  } finally {
    for (const [key, value] of previous) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] =
          value;
      }
    }
  }
}

test(
  'Seerr client can load without Seerr credentials',
  async () => {
    await withEnvironment(
      {
        SEERR_URL:
          undefined,

        SEERR_API_KEY:
          undefined,
      },
      async () => {
        await import(
          '../src/providers/seerr/seerr-client.js'
        );
      },
    );
  },
);

test(
  'Seerr access fails closed when credentials are missing',
  async () => {
    await withEnvironment(
      {
        SEERR_URL:
          undefined,

        SEERR_API_KEY:
          undefined,
      },
      async () => {
        const {
          seerrFetch,
        } =
          await import(
            '../src/providers/seerr/seerr-client.js'
          );

        await assert.rejects(
          () =>
            seerrFetch(
              '/status',
            ),
          /SEERR_URL and SEERR_API_KEY are required/,
        );
      },
    );
  },
);

test(
  'Seerr API key is sent only in the request header',
  async () => {
    await withEnvironment(
      {
        SEERR_URL:
          'http://seerr.test:5055',

        SEERR_API_KEY:
          'test-seerr-secret',
      },
      async () => {
        const originalFetch =
          globalThis.fetch;

        globalThis.fetch =
          async (
            input,
            init,
          ) => {
            const url =
              String(input);

            assert.equal(
              url,
              'http://seerr.test:5055/api/v1/status',
            );

            assert.equal(
              url.includes(
                'test-seerr-secret',
              ),
              false,
            );

            const headers =
              new Headers(
                init?.headers,
              );

            assert.equal(
              headers.get(
                'X-Api-Key',
              ),
              'test-seerr-secret',
            );

            assert.equal(
              init?.redirect,
              'error',
            );

            return new Response(
              '{}',
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
            seerrFetch,
          } =
            await import(
              '../src/providers/seerr/seerr-client.js'
            );

          await seerrFetch(
            '/status',
          );
        } finally {
          globalThis.fetch =
            originalFetch;
        }
      },
    );
  },
);