const ABSOLUTE_FAILSAFE_MS = 4.5 * 60 * 60 * 1000;

export function getWatchPartyExpireAt(
  scheduledAt: string,
  _runtimeMinutes?: number,
): number | undefined {
  const scheduledTime = new Date(scheduledAt).getTime();

  if (Number.isNaN(scheduledTime)) {
    return undefined;
  }

  return scheduledTime + ABSOLUTE_FAILSAFE_MS;
}

export function getWatchPartyCloseWindowAt(
  scheduledAt: string,
  runtimeMinutes: number | undefined,
): number | undefined {
  const scheduledTime = new Date(scheduledAt).getTime();

  if (Number.isNaN(scheduledTime)) {
    return undefined;
  }

  if (
    runtimeMinutes === undefined ||
    !Number.isFinite(runtimeMinutes) ||
    runtimeMinutes <= 0
  ) {
    return undefined;
  }

  return scheduledTime + runtimeMinutes * 60 * 1000;
}

export const WATCHPARTY_ABSOLUTE_FAILSAFE_MINUTES = 270;
