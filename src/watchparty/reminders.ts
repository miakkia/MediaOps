import {
  t,
} from '../i18n/index.js';

import type {
  ScheduledWatchParty,
} from '../storage/watchparty-store.js';

export const WATCHPARTY_REMINDER_LEAD_TIME_MS =
  15 * 60 * 1000;

export type WatchPartyReminderLocale =
  | 'en'
  | 'fr';

export function shouldSendWatchPartyReminder(
  party: ScheduledWatchParty,
  nowMs = Date.now(),
): boolean {
  if (
    party.status !== 'scheduled' &&
    party.status !== 'ready'
  ) {
    return false;
  }

  if (party.reminderSentAt) {
    return false;
  }

  const scheduledTime =
    new Date(party.scheduledAt).getTime();

  if (Number.isNaN(scheduledTime)) {
    return false;
  }

  const reminderTime =
    scheduledTime - WATCHPARTY_REMINDER_LEAD_TIME_MS;

  return (
    nowMs >= reminderTime &&
    nowMs < scheduledTime
  );
}

export function buildWatchPartyReminderContent(
  party: ScheduledWatchParty,
  locale: WatchPartyReminderLocale,
): string {
  const scheduledTime =
    new Date(party.scheduledAt).getTime();

  if (Number.isNaN(scheduledTime)) {
    throw new Error(
      'Watch Party reminder has an invalid scheduled date.',
    );
  }

  const timestamp =
    Math.floor(scheduledTime / 1000);

  const year =
    party.mediaYear !== undefined
      ? ` (${party.mediaYear})`
      : '';

  return (
    `${t(
      locale,
      'watchparty.reminder.title',
    )}\n\n` +
    `**${party.mediaTitle}**${year}\n` +
    `${t(
      locale,
      'watchparty.reminder.starts',
    )} <t:${timestamp}:F>`
  );
}
