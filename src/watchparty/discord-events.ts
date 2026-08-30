import {
  Guild,
  GuildScheduledEventEntityType,
  GuildScheduledEventPrivacyLevel,
  GuildScheduledEventStatus,
  type Client,
} from 'discord.js';

import { getMediaOpsBranding } from '../config/branding.js';
import type { ScheduledWatchParty } from '../storage/watchparty-store.js';
import {
  getWatchPartyScheduledEventId,
  removeWatchPartyScheduledEventId,
  setWatchPartyScheduledEventId,
} from '../storage/watchparty-event-store.js';

const EVENT_CREATION_LEAD_MS = 48 * 60 * 60 * 1000;
const EVENT_FALLBACK_DURATION_MS = 4.5 * 60 * 60 * 1000;

export function shouldCreateDiscordScheduledEvent(
  scheduledAt: Date,
  now = new Date(),
): boolean {
  return scheduledAt.getTime() - now.getTime() >= EVENT_CREATION_LEAD_MS;
}

export function getDiscordScheduledEventEndTime(
  scheduledAt: Date,
): Date {
  return new Date(scheduledAt.getTime() + EVENT_FALLBACK_DURATION_MS);
}

function getEventName(party: ScheduledWatchParty): string {
  const year = party.mediaYear !== undefined ? ` (${party.mediaYear})` : '';
  return `🎬 Watch Party — ${party.mediaTitle}${year}`.slice(0, 100);
}

export async function createDiscordScheduledEventForParty(
  guild: Guild,
  party: ScheduledWatchParty,
  eventImage?: Buffer,
): Promise<string | undefined> {
  const scheduledAt = new Date(party.scheduledAt);

  if (
    Number.isNaN(scheduledAt.getTime()) ||
    !shouldCreateDiscordScheduledEvent(scheduledAt)
  ) {
    return undefined;
  }

  const { botName, serverName } = getMediaOpsBranding();

  try {
    const event = await guild.scheduledEvents.create({
      name: getEventName(party),
      description:
        `${botName} Watch Party hosted by <@${party.organizerDiscordId}>. ` +
        'Use the Watch Party post in Discord for RSVP and session details.',
      scheduledStartTime: scheduledAt,
      scheduledEndTime: getDiscordScheduledEventEndTime(scheduledAt),
      privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
      entityType: GuildScheduledEventEntityType.External,
      entityMetadata: {
        location: `${serverName} Watch Party`.slice(0, 100),
      },
      ...(eventImage ? { image: eventImage } : {}),
      reason: `MediaOps Watch Party ${party.id}`,
    });

    await setWatchPartyScheduledEventId(party.id, event.id);

    console.log(
      `Discord Scheduled Event ${event.id} created for Watch Party ${party.id}.`,
    );

    return event.id;
  } catch (error) {
    console.error(
      `Discord Scheduled Event creation failed for Watch Party ${party.id}:`,
      error,
    );

    return undefined;
  }
}

async function fetchLinkedEvent(
  guild: Guild,
  partyId: string,
) {
  const eventId = await getWatchPartyScheduledEventId(partyId);
  if (!eventId) return undefined;

  try {
    const event = await guild.scheduledEvents.fetch(eventId);
    if (!event) {
      await removeWatchPartyScheduledEventId(partyId);
      return undefined;
    }
    return event;
  } catch (error) {
    console.warn(
      `Unable to fetch Discord Scheduled Event ${eventId} for Watch Party ${partyId}:`,
      error,
    );
    return undefined;
  }
}

export async function cancelDiscordScheduledEventForParty(
  guild: Guild,
  partyId: string,
): Promise<void> {
  const event = await fetchLinkedEvent(guild, partyId);
  if (!event) return;

  try {
    if (event.status === GuildScheduledEventStatus.Scheduled) {
      await event.setStatus(
        GuildScheduledEventStatus.Canceled,
        'MediaOps Watch Party cancelled',
      );
      return;
    }

    if (event.status === GuildScheduledEventStatus.Active) {
      await event.setStatus(
        GuildScheduledEventStatus.Completed,
        'MediaOps Watch Party ended',
      );
    }
  } catch (error) {
    console.error(
      `Unable to cancel or complete Discord Scheduled Event ${event.id}:`,
      error,
    );
  }
}

export async function synchronizeDiscordScheduledEventForParty(
  client: Client,
  party: ScheduledWatchParty,
): Promise<void> {
  const eventId = await getWatchPartyScheduledEventId(party.id);
  if (!eventId) return;

  let guild: Guild;
  try {
    guild = await client.guilds.fetch(party.guildId);
  } catch (error) {
    console.warn(
      `Unable to fetch guild ${party.guildId} for Watch Party Scheduled Event sync:`,
      error,
    );
    return;
  }

  const event = await fetchLinkedEvent(guild, party.id);
  if (!event) return;

  try {
    if (
      party.status === 'active' &&
      event.status === GuildScheduledEventStatus.Scheduled
    ) {
      await event.setStatus(
        GuildScheduledEventStatus.Active,
        'MediaOps Watch Party started',
      );
      return;
    }

    if (
      party.status === 'cancelled' ||
      party.status === 'auto_cancelled'
    ) {
      if (event.status === GuildScheduledEventStatus.Scheduled) {
        await event.setStatus(
          GuildScheduledEventStatus.Canceled,
          'MediaOps Watch Party cancelled',
        );
      } else if (event.status === GuildScheduledEventStatus.Active) {
        await event.setStatus(
          GuildScheduledEventStatus.Completed,
          'MediaOps Watch Party ended',
        );
      }
      return;
    }

    if (
      party.status === 'expired' &&
      event.status === GuildScheduledEventStatus.Active
    ) {
      await event.setStatus(
        GuildScheduledEventStatus.Completed,
        'MediaOps Watch Party completed',
      );
    }
  } catch (error) {
    console.error(
      `Discord Scheduled Event sync failed for Watch Party ${party.id}:`,
      error,
    );
  }
}
