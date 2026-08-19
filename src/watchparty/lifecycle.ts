import {
  refreshWatchPartyLifecycle,
} from '../storage/watchparty-store.js';

const LIFECYCLE_INTERVAL_MS =
  60 * 1000;

let lifecycleTimer:
  NodeJS.Timeout | undefined;

async function runLifecycleRefresh():
  Promise<void> {
  try {
    await refreshWatchPartyLifecycle();
  } catch (error) {
    console.error(
      'Watch Party lifecycle refresh failed:',
      error,
    );
  }
}

export function startWatchPartyLifecycle(): void {
  if (lifecycleTimer) {
    return;
  }

  void runLifecycleRefresh();

  lifecycleTimer =
    setInterval(
      () => {
        void runLifecycleRefresh();
      },
      LIFECYCLE_INTERVAL_MS,
    );

  lifecycleTimer.unref();

  console.log(
    'Watch Party lifecycle scheduler started.',
  );
}
