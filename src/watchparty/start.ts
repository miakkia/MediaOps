import type {
  Client,
} from 'discord.js';

import {
  isMediaOpsDemoMode,
} from '../config/demo-mode.js';

import {
  createWatchParty,
} from '../services/watchparty.js';

import {
  findWatchPartyById,
  setWatchPartyCode,
  setWatchPartyLaunchMessageId,
  setWatchPartyStatus,
  type ScheduledWatchParty,
} from '../storage/watchparty-store.js';

import {
  synchronizeDiscordScheduledEventForParty,
} from './discord-events.js';

export interface OpenScheduledWatchPartyResult {
  party: ScheduledWatchParty;
  partyCode: string;
  joinUrl: string;
}

export async function openScheduledWatchParty(
  client: Client,
  partyId: string,
): Promise<OpenScheduledWatchPartyResult> {
  const party =
    await findWatchPartyById(
      partyId,
    );

  if (!party) {
    throw new Error(
      'Scheduled Watch Party was not found.',
    );
  }

  if (
    party.status !== 'scheduled' &&
    party.status !== 'ready'
  ) {
    throw new Error(
      'Scheduled Watch Party is not available to start.',
    );
  }

  if (party.partyCode) {
    throw new Error(
      'Scheduled Watch Party has already been opened.',
    );
  }

  const room =
    await createWatchParty();

  await setWatchPartyCode(
    party.id,
    room.partyCode,
  );

  let activeParty =
    await setWatchPartyStatus(
      party.id,
      'active',
    );

  const channel =
    await client.channels.fetch(
      party.channelId,
    );

  if (
    channel &&
    channel.isSendable()
  ) {
    const year =
      party.mediaYear !== undefined
        ? ` (${party.mediaYear})`
        : '';

    const demoMode =
      isMediaOpsDemoMode();

    const accessLine =
      demoMode
        ? '🔒 **Mode démo / Demo mode:** lien Watch Party désactivé / Watch Party link disabled.'
        : `➡️ ${room.joinUrl}`;

    const launchMessage =
      await channel.send({
        content:
          '🎬 **Watch Party ouverte / Watch Party is open!**\n\n' +
          `**${party.mediaTitle}**${year}\n` +
          `Code: \`${room.partyCode}\`\n` +
          accessLine,
      });

    activeParty =
      await setWatchPartyLaunchMessageId(
        party.id,
        launchMessage.id,
      );
  } else {
    console.warn(
      `Watch Party launch channel is unavailable: ${party.channelId}`,
    );
  }

  await synchronizeDiscordScheduledEventForParty(
    client,
    activeParty,
  );

  return {
    party: activeParty,
    partyCode: room.partyCode,
    joinUrl: room.joinUrl,
  };
}
