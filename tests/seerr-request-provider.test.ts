import assert from 'node:assert/strict';
import test from 'node:test';

import {
  SeerrRequestProvider,
} from '../src/providers/seerr/seerr-request-provider.js';

async function withSeerrEnvironment(
  callback:
    () => Promise<void>,
): Promise<void> {
  const oldUrl =
    process.env.SEERR_URL;

  const oldKey =
    process.env.SEERR_API_KEY;

  process.env.SEERR_URL =
    'http://seerr.test:5055';

  process.env.SEERR_API_KEY =
    'test-api-key';

  try {
    await callback();
  } finally {
    if (
      oldUrl === undefined
    ) {
      delete process.env.SEERR_URL;
    } else {
      process.env.SEERR_URL =
        oldUrl;
    }

    if (
      oldKey === undefined
    ) {
      delete process.env.SEERR_API_KEY;
    } else {
      process.env.SEERR_API_KEY =
        oldKey;
    }
  }
}

test(
  'Seerr provider searches movies',
  async () => {
    await withSeerrEnvironment(
      async () => {
        const originalFetch =
          globalThis.fetch;

        globalThis.fetch =
          async (
            input,
          ) => {
            const url =
              new URL(
                String(input),
              );

            assert.equal(
              url.pathname,
              '/api/v1/search',
            );

            assert.equal(
              url.searchParams.get(
                'query',
              ),
              'Alien',
            );

            return new Response(
              JSON.stringify({
                results: [
                  {
                    id:
                      348,

                    mediaType:
                      'movie',

                    title:
                      'Alien',

                    originalTitle:
                      'Alien',

                    releaseDate:
                      '1979-05-25',

                    overview:
                      'A science-fiction horror film.',

                    posterPath:
                      '/poster.jpg',

                    mediaInfo: {
                      status:
                        5,
                    },
                  },
                ],
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
          const provider =
            new SeerrRequestProvider();

          const results =
            await provider.search(
              'Alien',
              'movie',
            );

          assert.equal(
            results.length,
            1,
          );

          assert.equal(
            results[0]?.providerId,
            '348',
          );

          assert.equal(
            results[0]?.title,
            'Alien',
          );

          assert.equal(
            results[0]?.year,
            1979,
          );

          assert.equal(
            results[0]?.available,
            true,
          );

          assert.equal(
            results[0]?.status,
            'available',
          );
        } finally {
          globalThis.fetch =
            originalFetch;
        }
      },
    );
  },
);

test(
  'Seerr provider searches TV series',
  async () => {
    await withSeerrEnvironment(
      async () => {
        const originalFetch =
          globalThis.fetch;

        globalThis.fetch =
          async () =>
            new Response(
              JSON.stringify({
                results: [
                  {
                    id:
                      1399,

                    mediaType:
                      'tv',

                    name:
                      'Game of Thrones',

                    originalName:
                      'Game of Thrones',

                    firstAirDate:
                      '2011-04-17',

                    mediaInfo: {
                      status:
                        2,
                    },
                  },
                ],
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

        try {
          const provider =
            new SeerrRequestProvider();

          const results =
            await provider.search(
              'Game of Thrones',
              'series',
            );

          assert.equal(
            results.length,
            1,
          );

          assert.equal(
            results[0]?.mediaType,
            'series',
          );

          assert.equal(
            results[0]?.year,
            2011,
          );

          assert.equal(
            results[0]?.requested,
            true,
          );
        } finally {
          globalThis.fetch =
            originalFetch;
        }
      },
    );
  },
);

test(
  'Seerr provider submits movie requests',
  async () => {
    await withSeerrEnvironment(
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
              'http://seerr.test:5055/api/v1/request',
            );

            assert.equal(
              init?.method,
              'POST',
            );

            assert.deepEqual(
              JSON.parse(
                String(
                  init?.body,
                ),
              ),
              {
                mediaType:
                  'movie',

                mediaId:
                  348,
              },
            );

            return new Response(
              JSON.stringify({
                id:
                  42,

                status:
                  1,
              }),
              {
                status:
                  201,

                headers: {
                  'Content-Type':
                    'application/json',
                },
              },
            );
          };

        try {
          const provider =
            new SeerrRequestProvider();

          const result =
            await provider.request({
              providerId:
                '348',

              mediaType:
                'movie',

              title:
                'Alien',

              originalTitle:
                'Alien',

              year:
                1979,

              overview:
                undefined,

              posterUrl:
                undefined,

              status:
                'unavailable',

              requested:
                false,

              available:
                false,
            });

          assert.equal(
            result.success,
            true,
          );

          assert.equal(
            result.providerRequestId,
            '42',
          );

          assert.equal(
            result.status,
            'pending',
          );
        } finally {
          globalThis.fetch =
            originalFetch;
        }
      },
    );
  },
);

test(
  'Seerr provider requests all TV seasons',
  async () => {
    await withSeerrEnvironment(
      async () => {
        const originalFetch =
          globalThis.fetch;

        globalThis.fetch =
          async (
            _input,
            init,
          ) => {
            assert.deepEqual(
              JSON.parse(
                String(
                  init?.body,
                ),
              ),
              {
                mediaType:
                  'tv',

                mediaId:
                  1399,

                seasons:
                  'all',
              },
            );

            return new Response(
              JSON.stringify({
                id:
                  43,

                status:
                  2,
              }),
              {
                status:
                  201,

                headers: {
                  'Content-Type':
                    'application/json',
                },
              },
            );
          };

        try {
          const provider =
            new SeerrRequestProvider();

          const result =
            await provider.request({
              providerId:
                '1399',

              mediaType:
                'series',

              title:
                'Game of Thrones',

              originalTitle:
                undefined,

              year:
                2011,

              overview:
                undefined,

              posterUrl:
                undefined,

              seriesStatus:
                'ended',

              status:
                'unavailable',

              requested:
                false,

              available:
                false,
            });

          assert.equal(
            result.status,
            'approved',
          );
        } finally {
          globalThis.fetch =
            originalFetch;
        }
      },
    );
  },
);