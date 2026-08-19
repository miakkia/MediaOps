import type {
  Client,
} from 'discord.js';

import {
  t,
} from '../i18n/index.js';

import {
  getWatchParties,
  refreshWatchPartyLifecycle,
  setWatchPartyReminderSentAt,
} from '../storage/watchparty-store.js';

const LIFECYCLE_INTERVAL_MS =
  60 * 1000;

const REMINDER_LEAD_TIME_MS =
  15 * 60 * 1000;

const configuredLocale =
  process.env.MEDIAOPS_LOCALE?.trim().toLowerCase();

const reminderLocale =
  configuredLocale === 'fr'
    ? 'fr'
    : 'en';

let lifecycleTimer:
  NodeJS.Timeout | undefined;

async function sendWatchPartyReminders(
  client: Client,
): Promise<void> {
  const parties =
    await getWatchParties();

  const now =
    Date.now();

  for (const party of parties) {
    if (
      party.status !== 'scheduled' &&
      party.status !== 'ready'
    ) {
      continue;
    }

    if (party.reminderSentAt) {
      continue;
    }

    const scheduledTime =
      new Date(
        party.scheduledAt,
      ).getTime();

    if (
      Number.isNaN(
        scheduledTime,
      )
    ) {
      continue;
    }

    const reminderTime =
      scheduledTime -
      REMINDER_LEAD_TIME_MS;

    if (
      now < reminderTime ||
      now >= scheduledTime
    ) {
      continue;
    }

    try {
      const channel =
        await client.channels.fetch(
          party.channelId,
        );

      if (
        !channel ||
        !channel.isSendable()
      ) {
        console.warn(
          `Watch Party reminder channel is unavailable: ${party.channelId}`,
        );

        continue;
      }

      const timestamp =
        Math.floor(
          scheduledTime /
          1000,
        );

      const year =
        party.mediaYear !== undefined
          ? ` (${party.mediaYear})`
          : '';

      await channel.send({
        content:
          `${t(
            reminderLocale,
            'watchparty.reminder.title',
          )}\n\n` +
          `**${party.mediaTitle}**${year}\n` +
          `${t(
            reminderLocale,
            'watchparty.reminder.starts',
          )} <t:${timestamp}:R> • <t:${timestamp}:F>`,
      });

      await setWatchPartyReminderSentAt(
        party.id,
        new Date().toISOString(),
      );

      console.log(
        `Watch Party reminder sent for ${party.id}`,
      );
    } catch (error) {
      console.error(
        `Watch Party reminder failed for ${party.id}:`,
        error,
      );
    }
  }
}

async function runLifecycleRefresh(
  client: Client,
): Promise<void> {
  try {
    await refreshWatchPartyLifecycle();

    await sendWatchPartyReminders(
      client,
    );
  } catch (error) {
    console.error(
      'Watch Party lifecycle refresh failed:',
      error,
    );
  }
}

export function startWatchPartyLifecycle(
  client: Client,
): void {
  if (lifecycleTimer) {
    return;
  }

  void runLifecycleRefresh(
    client,
  );

  lifecycleTimer =
    setInterval(
      () => {
        void runLifecycleRefresh(
          client,
        );
      },
      LIFECYCLE_INTERVAL_MS,
    );

  lifecycleTimer.unref();

  console.log(
    'Watch Party lifecycle scheduler started.',
  );
}
