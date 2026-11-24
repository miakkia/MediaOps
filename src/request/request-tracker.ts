import type { Client } from 'discord.js';

import type { MediaItem, MediaProvider } from '../providers/media-provider.js';
import {
  listTrackedRequests,
  updateTrackedRequest,
} from '../storage/request-tracking-store.js';

const POLL_INTERVAL_MS = 5 * 60 * 1000;
const RETRY_DELAYS_MS = [5000, 15000, 30000, 60000];

function isServiceUnavailable(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return error.name === 'TimeoutError' ||
    /HTTP (502|503|504)\b|request timed out/i.test(error.message) ||
    (error instanceof TypeError && error.message === 'fetch failed');
}

function normalizeTitle(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function matchesTrackedRequest(
  item: MediaItem,
  title: string,
  year: number | undefined,
): boolean {
  const targetTitle = normalizeTitle(title);
  const titleMatches = [item.name, item.originalTitle, item.sortName]
    .filter((value): value is string => Boolean(value))
    .some(value => normalizeTitle(value) === targetTitle);

  if (!titleMatches) return false;

  return year === undefined || item.year === undefined || item.year === year;
}

async function isAvailableWithProvider(
  provider: MediaProvider,
  title: string,
  year: number | undefined,
  mediaType: 'movie' | 'series',
): Promise<boolean> {
  const results = mediaType === 'movie'
    ? await provider.searchMovies(title)
    : await provider.searchSeries(title);

  return results.some(item => matchesTrackedRequest(item, title, year));
}

async function isAvailableOnMediaServer(
  title: string,
  year: number | undefined,
  mediaType: 'movie' | 'series',
): Promise<boolean> {
  const { mediaProvider } = await import('../providers/media-provider-instance.js');
  return isAvailableWithProvider(mediaProvider, title, year, mediaType);
}

async function checkTrackedRequests(client: Client): Promise<void> {
  const tracked = await listTrackedRequests();

  for (const request of tracked) {
    if (request.availableNotifiedAt) continue;

    try {
      const available = await isAvailableOnMediaServer(
        request.title,
        request.year,
        request.mediaType,
      );

      if (!available) continue;

      const availableAt = new Date().toISOString();
      await updateTrackedRequest(request.providerRequestId, {
        status: 'available',
        updatedAt: availableAt,
      });

      try {
        const user = await client.users.fetch(request.discordUserId);
        const year = request.year !== undefined ? ` (${request.year})` : '';
        await user.send(
          `🎉 **${request.title}${year}** is now available on the media server.`,
        );

        const notifiedAt = new Date().toISOString();
        await updateTrackedRequest(request.providerRequestId, {
          status: 'available',
          updatedAt: notifiedAt,
          availableNotifiedAt: notifiedAt,
        });
      } catch (error) {
        console.warn(
          `Unable to notify Discord user ${request.discordUserId} that request ${request.providerRequestId} is available; notification will be retried:`,
          error,
        );
      }
    } catch (error) {
      if (isServiceUnavailable(error)) throw error;
      console.warn(
        `Unable to refresh request ${request.providerRequestId}:`,
        error,
      );
    }
  }
}

export function startRequestTracker(client: Client): void {
  let failures = 0;
  async function run(): Promise<void> {
    let delay = POLL_INTERVAL_MS;
    try {
      await checkTrackedRequests(client);
      if (failures > 0) console.info('Media request tracking resumed.');
      failures = 0;
    } catch (error) {
      if (isServiceUnavailable(error)) {
        if (failures === 0) console.warn('Media server temporarily unavailable; request tracking will retry.');
        delay = RETRY_DELAYS_MS[Math.min(failures, RETRY_DELAYS_MS.length - 1)] ?? 60000;
        failures = Math.min(failures + 1, RETRY_DELAYS_MS.length);
      } else {
        console.warn('Unable to run media request tracking:', error);
      }
    } finally {
      const timer = setTimeout(() => void run(), delay);
      timer.unref();
    }
  }
  void run();
}

export {
  checkTrackedRequests,
  isServiceUnavailable,
  isAvailableOnMediaServer,
  isAvailableWithProvider,
  matchesTrackedRequest,
};
