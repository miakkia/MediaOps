import type { Client } from 'discord.js';

import { requestProvider } from '../providers/request-provider-instance.js';
import {
  listTrackedRequests,
  updateTrackedRequest,
} from '../storage/request-tracking-store.js';

const POLL_INTERVAL_MS = 5 * 60 * 1000;

async function checkTrackedRequests(client: Client): Promise<void> {
  if (!requestProvider) return;

  const tracked = await listTrackedRequests();

  for (const request of tracked) {
    if (request.availableNotifiedAt) continue;

    try {
      const results = await requestProvider.search(
        request.title,
        request.mediaType,
      );

      const match = results.find(item => item.providerId === request.providerId);
      if (!match?.available) continue;

      const now = new Date().toISOString();
      await updateTrackedRequest(request.providerRequestId, {
        status: 'available',
        updatedAt: now,
        availableNotifiedAt: now,
      });

      try {
        const user = await client.users.fetch(request.discordUserId);
        const year = request.year !== undefined ? ` (${request.year})` : '';
        await user.send(
          `🎉 **${request.title}${year}** is now available on the media server.`,
        );
      } catch (error) {
        console.warn(
          `Unable to notify Discord user ${request.discordUserId} that request ${request.providerRequestId} is available:`,
          error,
        );
      }
    } catch (error) {
      console.warn(
        `Unable to refresh request ${request.providerRequestId}:`,
        error,
      );
    }
  }
}

export function startRequestTracker(client: Client): void {
  void checkTrackedRequests(client);

  const timer = setInterval(
    () => void checkTrackedRequests(client),
    POLL_INTERVAL_MS,
  );
  timer.unref();
}

export { checkTrackedRequests };
