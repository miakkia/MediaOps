import type { Client } from 'discord.js';
import {
  cleanupWatchPartyHistory,
  getWatchParties,
  refreshWatchPartyLifecycle,
  setWatchPartyReminderMessageId,
  setWatchPartyReminderSentAt,
} from '../storage/watchparty-store.js';
import { synchronizeDiscordScheduledEventForParty } from './discord-events.js';
import { buildWatchPartyReminderContent, shouldSendWatchPartyReminder } from './reminders.js';
import { openScheduledWatchParty } from './start.js';

const LIFECYCLE_INTERVAL_MS = 60 * 1000;
const configuredLocale = process.env.MEDIAOPS_LOCALE?.trim().toLowerCase();
const reminderLocale = configuredLocale === 'fr' ? 'fr' : 'en';
let lifecycleTimer: NodeJS.Timeout | undefined;

async function sendWatchPartyReminders(client: Client): Promise<void> {
  const parties = await getWatchParties();
  const now = Date.now();
  for (const party of parties) {
    if (!shouldSendWatchPartyReminder(party, now)) continue;
    try {
      const channel = await client.channels.fetch(party.channelId);
      if (!channel || !channel.isSendable()) {
        console.warn(`Watch Party reminder channel is unavailable: ${party.channelId}`);
        continue;
      }
      const reminderMessage = await channel.send({
        content: buildWatchPartyReminderContent(party, reminderLocale),
      });
      // Store the message identity before marking the reminder complete. This
      // makes cancellation cleanup restart-safe while a failed send remains
      // eligible for a later retry.
      await setWatchPartyReminderMessageId(party.id, reminderMessage.id);
      await setWatchPartyReminderSentAt(party.id, new Date().toISOString());
      console.log(`Watch Party reminder sent for ${party.id}`);
    } catch (error) {
      console.error(`Watch Party reminder failed for ${party.id}:`, error);
    }
  }
}

async function openScheduledWatchParties(client: Client): Promise<void> {
  const parties = await getWatchParties();
  const now = Date.now();
  for (const party of parties) {
    if (party.status !== 'scheduled' && party.status !== 'ready') continue;
    if (party.partyCode) continue;
    const scheduledTime = new Date(party.scheduledAt).getTime();
    if (Number.isNaN(scheduledTime) || now < scheduledTime) continue;
    try {
      const opened = await openScheduledWatchParty(client, party.id);
      console.log(`Scheduled Watch Party ${party.id} opened automatically as ${opened.partyCode}`);
    } catch (error) {
      console.error(`Automatic Watch Party creation failed for ${party.id}:`, error);
    }
  }
}

async function synchronizeDiscordScheduledEvents(client: Client): Promise<void> {
  for (const party of await getWatchParties()) {
    await synchronizeDiscordScheduledEventForParty(client, party);
  }
}

async function cleanupFinishedWatchPartyPosts(client: Client): Promise<void> {
  const parties = await getWatchParties();
  for (const party of parties) {
    if (party.status !== 'cancelled' && party.status !== 'auto_cancelled' && party.status !== 'expired') continue;

    // Cancellation means the announced session will not happen (or was stopped
    // early), so remove its reminder too. Expiry means a session actually ran;
    // preserve the reminder as useful history and only remove active posts.
    const messageIds = [
      party.messageId,
      party.launchMessageId,
      ...(party.status === 'cancelled' || party.status === 'auto_cancelled'
        ? [party.reminderMessageId]
        : []),
    ].filter((messageId): messageId is string => Boolean(messageId));

    if (messageIds.length === 0) continue;
    try {
      const channel = await client.channels.fetch(party.channelId);
      if (!channel || !channel.isTextBased()) continue;
      for (const messageId of new Set(messageIds)) {
        const message = await channel.messages.fetch(messageId).catch(() => null);
        if (!message) continue;
        await message.delete();
        console.log(`Removed finished Watch Party post ${messageId} for ${party.id}.`);
      }
    } catch (error) {
      console.warn(`Unable to remove finished Watch Party posts for ${party.id}:`, error);
    }
  }
}

async function runLifecycleRefresh(client: Client): Promise<void> {
  try {
    await refreshWatchPartyLifecycle();
    await sendWatchPartyReminders(client);
    await openScheduledWatchParties(client);
    await refreshWatchPartyLifecycle();
    await synchronizeDiscordScheduledEvents(client);
    await cleanupFinishedWatchPartyPosts(client);
    const removed = await cleanupWatchPartyHistory();
    if (removed > 0) console.log(`Watch Party cleanup removed ${removed} old record(s).`);
  } catch (error) {
    console.error('Watch Party lifecycle refresh failed:', error);
  }
}

export function startWatchPartyLifecycle(client: Client): void {
  if (lifecycleTimer) return;
  void runLifecycleRefresh(client);
  lifecycleTimer = setInterval(() => { void runLifecycleRefresh(client); }, LIFECYCLE_INTERVAL_MS);
  lifecycleTimer.unref();
  console.log('Watch Party lifecycle scheduler started.');
}
