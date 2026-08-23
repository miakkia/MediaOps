const POST_RUNTIME_GRACE_MS = 45 * 60 * 1000;
const FALLBACK_ACTIVE_EXPIRY_MS = 6 * 60 * 60 * 1000;

export function getWatchPartyExpireAt(
  scheduledAt: string,
  runtimeMinutes: number | undefined,
): number | undefined {
  const scheduledTime = new Date(scheduledAt).getTime();

  if (Number.isNaN(scheduledTime)) {
    return undefined;
  }

  if (
    runtimeMinutes !== undefined &&
    Number.isFinite(runtimeMinutes) &&
    runtimeMinutes > 0
  ) {
    return scheduledTime + runtimeMinutes * 60 * 1000 + POST_RUNTIME_GRACE_MS;
  }

  return scheduledTime + FALLBACK_ACTIVE_EXPIRY_MS;
}

export function getWatchPartyCloseWindowAt(
  scheduledAt: string,
  runtimeMinutes: number | undefined,
): number | undefined {
  const expireAt = getWatchPartyExpireAt(scheduledAt, runtimeMinutes);

  if (expireAt === undefined) {
    return undefined;
  }

  return expireAt - POST_RUNTIME_GRACE_MS;
}

export const WATCHPARTY_POST_RUNTIME_GRACE_MINUTES = 45;
