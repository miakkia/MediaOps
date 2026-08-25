import { getEmbyMovieRuntimeMinutes } from '../services/emby-runtime.js';
import {
  getWatchParties,
  setWatchPartyStatus,
} from '../storage/watchparty-store.js';
import { getWatchPartyExpireAt } from './expiry.js';

const CHECK_INTERVAL_MS = 60 * 1000;

let runtimeExpiryTimer: NodeJS.Timeout | undefined;

export async function runRuntimeAwareWatchPartyExpiry(
  now = Date.now(),
): Promise<void> {
  const parties = await getWatchParties();

  for (const party of parties) {
    if (party.status !== 'active') {
      continue;
    }

    try {
      const runtimeMinutes = await getEmbyMovieRuntimeMinutes(
        party.embyItemId,
      );
      const expireAt = getWatchPartyExpireAt(
        party.scheduledAt,
        runtimeMinutes,
      );

      if (expireAt !== undefined && now >= expireAt) {
        await setWatchPartyStatus(party.id, 'expired');
        console.log(
          `Watch Party ${party.id} expired from Emby runtime (${runtimeMinutes?.toFixed(1) ?? 'fallback'} min).`,
        );
      }
    } catch (error) {
      // The shared 4.5-hour lifecycle remains the safety fallback if Emby
      // runtime cannot be read for any reason.
      console.warn(
        `Unable to evaluate runtime-aware expiry for Watch Party ${party.id}:`,
        error,
      );
    }
  }
}

export function startRuntimeAwareWatchPartyExpiry(): void {
  if (runtimeExpiryTimer) {
    return;
  }

  void runRuntimeAwareWatchPartyExpiry();

  runtimeExpiryTimer = setInterval(
    () => {
      void runRuntimeAwareWatchPartyExpiry();
    },
    CHECK_INTERVAL_MS,
  );

  runtimeExpiryTimer.unref();
  console.log('Runtime-aware Watch Party expiry scheduler started.');
}
