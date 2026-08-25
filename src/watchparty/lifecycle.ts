import type {
  Client,
} from 'discord.js';

import {
  t,
} from '../i18n/index.js';

import {
  createWatchParty,
} from '../services/watchparty.js';

import {
  cleanupWatchPartyHistory,
  getWatchParties,
  refreshWatchPartyLifecycle,
  setWatchPartyCode,
  setWatchPartyReminderSentAt,
  setWatchPartyStatus,
} from '../storage/watchparty-store.js';

import {
  synchronizeDiscordScheduledEventForParty,
} from './discord-events.js';

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

async function openScheduledWatchParties(
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

    if (party.partyCode) {
      continue;
    }

    const scheduledTime =
      new Date(
        party.scheduledAt,
      ).getTime();

    if (
      Number.isNaN(scheduledTime) ||
      now < scheduledTime
    ) {
      continue;
    }

    try {
      const room =
        await createWatchParty();

      // Persist first so a Discord failure cannot create duplicate rooms.
      await setWatchPartyCode(
        party.id,
        room.partyCode,
      );

      await setWatchPartyStatus(
        party.id,
        'active',
      );

      const channel =
        await client.channels.fetch(
          party.channelId,
        );

      if (
        !channel ||
        !channel.isSendable()
      ) {
        console.warn(
          `Watch Party launch channel is unavailable: ${party.channelId}`,
        );

        continue;
      }

      const year =
        party.mediaYear !== undefined
          ? ` (${party.mediaYear})`
          : '';

      await channel.send({
        content:
          '🎬 **Watch Party ouverte / Watch Party is open!**\n\n' +
          `**${party.mediaTitle}**${year}\n` +
          `Code: \`${room.partyCode}\`\n` +
          `➡️ ${room.joinUrl}`,
      });

      console.log(
        `Scheduled Watch Party ${party.id} opened automatically as ${room.partyCode}`,
      );
    } catch (error) {
      console.error(
        `Automatic Watch Party creation failed for ${party.id}:`,
        error,
      );
    }
  }
}

async function synchronizeDiscordScheduledEvents(
  client: Client,
): Promise<void> {
  const parties = await getWatchParties();

  for (const party of parties) {
    await synchronizeDiscordScheduledEventForParty(
      client,
      party,
    );
  }
}

async function cleanupFinishedWatchPartyPosts(
  client: Client,
): Promise<void> {
  const parties = await getWatchParties();

  for (const party of parties) {
    if (
      party.status !== 'cancelled' &&
      party.status !== 'expired'
    ) {
      continue;
    }

    if (!party.messageId) {
      continue;
    }

    try {
      const channel = await client.channels.fetch(
        party.channelId,
      );

      if (!channel || !channel.isTextBased()) {
        continue;
      }

      const message = await channel.messages.fetch(
        party.messageId,
      ).catch(() => null);

      if (!message) {
        continue;
      }

      await message.delete();
      console.log(
        `Removed finished Watch Party post ${party.messageId} for ${party.id}.`,
      );
    } catch (error) {
      console.warn(
        `Unable to remove finished Watch Party post for ${party.id}:`,
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

    await openScheduledWatchParties(
      client,
    );

    await refreshWatchPartyLifecycle();

    // Keep Scheduled Events aligned after all Watch Party state transitions.
    // Any Discord API error is isolated inside the event integration and must
    // not stop room creation, RSVP, reminders, or retention cleanup.
    await synchronizeDiscordScheduledEvents(
      client,
    );

    // Remove the original RSVP post after a Watch Party is cancelled or has
    // finished. This also cleans up old posts left behind by previous builds
    // as soon as the bot starts or on the next lifecycle pass.
    await cleanupFinishedWatchPartyPosts(
      client,
    );

    const removed =
      await cleanupWatchPartyHistory();

    if (removed > 0) {
      console.log(
        `Watch Party cleanup removed ${removed} old record(s).`,
      );
    }
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
