import type {
  Client,
} from 'discord.js';

import {
  createWatchParty,
} from '../services/watchparty.js';

import {
  cleanupWatchPartyHistory,
  getWatchParties,
  refreshWatchPartyLifecycle,
  setWatchPartyCode,
  setWatchPartyLaunchMessageId,
  setWatchPartyReminderSentAt,
  setWatchPartyStatus,
} from '../storage/watchparty-store.js';

import {
  synchronizeDiscordScheduledEventForParty,
} from './discord-events.js';

import {
  buildWatchPartyReminderContent,
  shouldSendWatchPartyReminder,
} from './reminders.js';

const LIFECYCLE_INTERVAL_MS =
  60 * 1000;

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

  const now = Date.now();

  for (const party of parties) {
    if (!shouldSendWatchPartyReminder(party, now)) {
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

      await channel.send({
        content: buildWatchPartyReminderContent(
          party,
          reminderLocale,
        ),
      });

      // Persist only after Discord confirms the send. A failed send remains
      // eligible and is retried by the next lifecycle pass.
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
  const now = Date.now();

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
      new Date(party.scheduledAt).getTime();

    if (
      Number.isNaN(scheduledTime) ||
      now < scheduledTime
    ) {
      continue;
    }

    try {
      const room = await createWatchParty();

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

      const launchMessage = await channel.send({
        content:
          '🎬 **Watch Party ouverte / Watch Party is open!**\n\n' +
          `**${party.mediaTitle}**${year}\n` +
          `Code: \`${room.partyCode}\`\n` +
          `➡️ ${room.joinUrl}`,
      });

      // Track the launch post so cancellation/expiry can remove every public
      // message owned by this Watch Party. Persist only after Discord confirms
      // creation; an absent ID is safe for parties created by older builds.
      await setWatchPartyLaunchMessageId(
        party.id,
        launchMessage.id,
      );

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
      party.status !== 'auto_cancelled' &&
      party.status !== 'expired'
    ) {
      continue;
    }

    const messageIds = [
      party.messageId,
      party.launchMessageId,
    ].filter(
      (messageId): messageId is string => Boolean(messageId),
    );

    if (messageIds.length === 0) {
      continue;
    }

    try {
      const channel = await client.channels.fetch(
        party.channelId,
      );

      if (!channel || !channel.isTextBased()) {
        continue;
      }

      for (const messageId of messageIds) {
        const message = await channel.messages.fetch(
          messageId,
        ).catch(() => null);

        if (!message) {
          continue;
        }

        await message.delete();
        console.log(
          `Removed finished Watch Party post ${messageId} for ${party.id}.`,
        );
      }
    } catch (error) {
      console.warn(
        `Unable to remove finished Watch Party posts for ${party.id}:`,
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
    await sendWatchPartyReminders(client);
    await openScheduledWatchParties(client);
    await refreshWatchPartyLifecycle();

    // Keep Scheduled Events aligned after all Watch Party state transitions.
    // Any Discord API error is isolated inside the event integration and must
    // not stop room creation, RSVP, reminders, or retention cleanup.
    await synchronizeDiscordScheduledEvents(client);

    // Remove every tracked public post after a Watch Party is cancelled or has
    // finished. This also cleans up old RSVP posts on startup/next lifecycle
    // pass; launch posts from older builds remain harmless because they have no
    // persisted launchMessageId to target.
    await cleanupFinishedWatchPartyPosts(client);

    const removed = await cleanupWatchPartyHistory();

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

  void runLifecycleRefresh(client);

  lifecycleTimer =
    setInterval(
      () => {
        void runLifecycleRefresh(client);
      },
      LIFECYCLE_INTERVAL_MS,
    );

  lifecycleTimer.unref();

  console.log(
    'Watch Party lifecycle scheduler started.',
  );
}
