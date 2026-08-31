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

async function withJellyfinProvider(
  handler: (
    provider: InstanceType<
      typeof import(
        '../src/providers/jellyfin/jellyfin-provider.js'
      ).JellyfinMediaProvider
    >,
  ) => Promise<void>,
): Promise<void> {
  await withEnvironment(
    {
      JELLYFIN_URL:
        'http://127.0.0.1:8096',
      JELLYFIN_API_KEY:
        'test-token',
    },
    async () => {
      const {
        JellyfinMediaProvider,
      } =
        await import(
          `../src/providers/jellyfin/jellyfin-provider.js?test=${Date.now()}-${Math.random()}`
        );

      await handler(
        new JellyfinMediaProvider(),
      );
    },
  );
}

function jsonResponse(
  value: unknown,
): Response {
  return new Response(
    JSON.stringify(
      value,
    ),
    {
      status:
        200,

      headers: {
        'Content-Type':
          'application/json',
      },
    },
  );
}

test('Jellyfin provider reads system information', async () => {
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
        new Headers(
          init?.headers,
        ).get(
          'X-Emby-Token',
        ),
        'test-token',
      );

      assert.equal(
        String(input).includes(
          'test-token',
        ),
        false,
      );

      return jsonResponse({
        ServerName:
          'MediaOps Jellyfin',

        Version:
          '10.11.0',
      });
    };

  try {
    await withJellyfinProvider(
      async (
        provider,
      ) => {
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
      },
    );
  } finally {
    globalThis.fetch =
      originalFetch;
  }
});

test('Jellyfin provider searches movies', async () => {
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
        '/Items',
      );

      assert.equal(
        url.searchParams.get(
          'SearchTerm',
        ),
        'Alien',
      );

      assert.equal(
        url.searchParams.get(
          'IncludeItemTypes',
        ),
        'Movie',
      );

      assert.equal(
        url.searchParams.get(
          'Recursive',
        ),
        'true',
      );

      assert.equal(
        url.searchParams.get(
          'Limit',
        ),
        '5',
      );

      assert.equal(
        url.search.includes(
          'test-token',
        ),
        false,
      );

      return jsonResponse({
        Items: [
          {
            Id:
              'movie-1',

            Name:
              'Alien',

            OriginalTitle:
              'Alien',

            SortName:
              'Alien',

            ProductionYear:
              1979,

            Overview:
              'Test overview',

            Type:
              'Movie',

            DateCreated:
              '2026-08-30T12:00:00Z',
          },
        ],

        TotalRecordCount:
          1,
      });
    };

  try {
    await withJellyfinProvider(
      async (
        provider,
      ) => {
        const movies =
          await provider.searchMovies(
            ' Alien ',
          );

        assert.deepEqual(
          movies,
          [
            {
              id:
                'movie-1',

              name:
                'Alien',

              originalTitle:
                'Alien',

              sortName:
                'Alien',

              year:
                1979,

              overview:
                'Test overview',

              type:
                'Movie',

              dateCreated:
                '2026-08-30T12:00:00Z',

              seriesStatus:
                undefined,
            },
          ],
        );
      },
    );
  } finally {
    globalThis.fetch =
      originalFetch;
  }
});

test('Jellyfin provider searches series and maps lifecycle status', async () => {
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
        '/Items',
      );

      assert.equal(
        url.searchParams.get(
          'IncludeItemTypes',
        ),
        'Series',
      );

      return jsonResponse({
        Items: [
          {
            Id:
              'series-1',

            Name:
              'Test Series',

            ProductionYear:
              2025,

            Type:
              'Series',

            Status:
              'Continuing',
          },
          {
            Id:
              'series-2',

            Name:
              'Finished Series',

            ProductionYear:
              2020,

            Type:
              'Series',

            Status:
              'Ended',
          },
        ],

        TotalRecordCount:
          2,
      });
    };

  try {
    await withJellyfinProvider(
      async (
        provider,
      ) => {
        const series =
          await provider.searchSeries(
            'Test',
          );

        assert.equal(
          series.length,
          2,
        );

        assert.equal(
          series[0]?.seriesStatus,
          'continuing',
        );

        assert.equal(
          series[1]?.seriesStatus,
          'ended',
        );
      },
    );
  } finally {
    globalThis.fetch =
      originalFetch;
  }
});

test('Jellyfin provider requests latest media in descending creation order', async () => {
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
        '/Items',
      );

      assert.equal(
        url.searchParams.get(
          'IncludeItemTypes',
        ),
        'Movie,Series',
      );

      assert.equal(
        url.searchParams.get(
          'SortBy',
        ),
        'DateCreated',
      );

      assert.equal(
        url.searchParams.get(
          'SortOrder',
        ),
        'Descending',
      );

      assert.equal(
        url.searchParams.get(
          'Limit',
        ),
        '10',
      );

      return jsonResponse({
        Items: [
          {
            Id:
              'latest-1',

            Name:
              'Newest Movie',

            Type:
              'Movie',

            ProductionYear:
              2026,
          },
        ],

        TotalRecordCount:
          1,
      });
    };

  try {
    await withJellyfinProvider(
      async (
        provider,
      ) => {
        const items =
          await provider.getLatestItems();

        assert.equal(
          items[0]?.id,
          'latest-1',
        );
      },
    );
  } finally {
    globalThis.fetch =
      originalFetch;
  }
});

test('Jellyfin provider uses server-side random movie sorting', async () => {
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
        url.searchParams.get(
          'IncludeItemTypes',
        ),
        'Movie',
      );

      assert.equal(
        url.searchParams.get(
          'SortBy',
        ),
        'Random',
      );

      assert.equal(
        url.searchParams.get(
          'Limit',
        ),
        '1',
      );

      return jsonResponse({
        Items: [
          {
            Id:
              'random-1',

            Name:
              'Random Movie',

            Type:
              'Movie',

            ProductionYear:
              2024,
          },
        ],

        TotalRecordCount:
          1,
      });
    };

  try {
    await withJellyfinProvider(
      async (
        provider,
      ) => {
        const movie =
          await provider.getRandomMovie();

        assert.equal(
          movie?.id,
          'random-1',
        );

        assert.equal(
          movie?.type,
          'Movie',
        );
      },
    );
  } finally {
    globalThis.fetch =
      originalFetch;
  }
});

test('Jellyfin provider looks up an exact movie ID', async () => {
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
        url.searchParams.get(
          'Ids',
        ),
        'movie_123',
      );

      assert.equal(
        url.searchParams.get(
          'IncludeItemTypes',
        ),
        'Movie',
      );

      return jsonResponse({
        Items: [
          {
            Id:
              'movie_123',

            Name:
              'Lookup Movie',

            Type:
              'Movie',

            ProductionYear:
              2023,
          },
        ],

        TotalRecordCount:
          1,
      });
    };

  try {
    await withJellyfinProvider(
      async (
        provider,
      ) => {
        const movie =
          await provider.getMovieById(
            'movie_123',
          );

        assert.equal(
          movie?.id,
          'movie_123',
        );
      },
    );
  } finally {
    globalThis.fetch =
      originalFetch;
  }
});

test('Jellyfin provider rejects invalid movie IDs before network access', async () => {
  const originalFetch =
    globalThis.fetch;

  let fetchCalled =
    false;

  globalThis.fetch =
    async () => {
      fetchCalled =
        true;

      throw new Error(
        'fetch should not run',
      );
    };

  try {
    await withJellyfinProvider(
      async (
        provider,
      ) => {
        await assert.rejects(
          provider.getMovieById(
            '../invalid',
          ),
          /Invalid Jellyfin item ID/,
        );

        assert.equal(
          fetchCalled,
          false,
        );
      },
    );
  } finally {
    globalThis.fetch =
      originalFetch;
  }
});

test('Jellyfin provider rejects malformed Items responses', async () => {
  const originalFetch =
    globalThis.fetch;

  globalThis.fetch =
    async () =>
      jsonResponse({
        Unexpected:
          [],
      });

  try {
    await withJellyfinProvider(
      async (
        provider,
      ) => {
        await assert.rejects(
          provider.searchMovies(
            'Alien',
          ),
          /Jellyfin returned an invalid movie search response/,
        );
      },
    );
  } finally {
    globalThis.fetch =
      originalFetch;
  }
});