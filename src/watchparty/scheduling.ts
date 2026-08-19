import type {
  ChatInputCommandInteraction,
  ModalSubmitInteraction,
  TextBasedChannel,
} from 'discord.js';

import {
  t,
  type SupportedLocale,
} from '../i18n/index.js';

import type {
  MediaMovie,
} from '../providers/media-provider.js';

import {
  createScheduledWatchParty,
  setWatchPartyMessageId,
} from '../storage/watchparty-store.js';

import {
  createWatchPartyRsvpRow,
} from './components.js';

interface ScheduleWatchPartyInput {
  guildId: string;
  channelId: string;
  organizerDiscordId: string;

  movie: MediaMovie;

  scheduledAt: string;

  locale: SupportedLocale;

  channel:
    | TextBasedChannel
    | null;
}

export async function scheduleWatchParty(
  input: ScheduleWatchPartyInput,
): Promise<void> {
  const scheduledDate =
    new Date(
      input.scheduledAt,
    );

  if (
    Number.isNaN(
      scheduledDate.getTime(),
    )
  ) {
    throw new Error(
      'Scheduled Watch Party date is invalid.',
    );
  }

  if (
    scheduledDate.getTime() <=
    Date.now()
  ) {
    throw new Error(
      'Scheduled Watch Party date must be in the future.',
    );
  }

  const channel =
    input.channel;

  if (
    !channel ||
    !channel.isSendable()
  ) {
    throw new Error(
      'Watch Party channel is not sendable.',
    );
  }

  const party =
    await createScheduledWatchParty({
      guildId:
        input.guildId,

      channelId:
        input.channelId,

      organizerDiscordId:
        input.organizerDiscordId,

      embyItemId:
        input.movie.id,

      mediaTitle:
        input.movie.name,

      mediaYear:
        input.movie.year,

      scheduledAt:
        scheduledDate.toISOString(),
    });

  const timestamp =
    Math.floor(
      scheduledDate.getTime() /
      1000,
    );

  const year =
    input.movie.year !== undefined
      ? ` (${input.movie.year})`
      : '';

  const rsvpRow =
    createWatchPartyRsvpRow(
      party.id,

      t(
        input.locale,
        'watchparty.scheduling.going',
      ),

      t(
        input.locale,
        'watchparty.scheduling.notGoing',
      ),

      t(
        input.locale,
        'watchparty.cancel.button',
      ),
    );

  const publicMessage =
    await channel.send({
      content:
        `${t(
          input.locale,
          'watchparty.scheduling.title',
        )}\n\n` +

        `${t(
          input.locale,
          'watchparty.scheduling.movie',
        )}: **${input.movie.name}**${year}\n` +

        `${t(
          input.locale,
          'watchparty.scheduling.organizer',
        )}: <@${input.organizerDiscordId}>\n` +

        `${t(
          input.locale,
          'watchparty.scheduling.scheduledFor',
        )}: <t:${timestamp}:F>\n` +

        `${t(
          input.locale,
          'watchparty.scheduling.relativeTime',
        )}: <t:${timestamp}:R>`,

      components: [
        rsvpRow,
      ],
    });

  await setWatchPartyMessageId(
    party.id,
    publicMessage.id,
  );
}

export function getSchedulingContext(
  interaction:
    | ChatInputCommandInteraction
    | ModalSubmitInteraction,
): {
  guildId: string;
  channelId: string;
  organizerDiscordId: string;
  channel: TextBasedChannel;
} {
  const guildId =
    interaction.guildId;

  const channelId =
    interaction.channelId;

  const channel =
    interaction.channel;

  if (
    !guildId ||
    !channelId ||
    !channel ||
    !channel.isTextBased()
  ) {
    throw new Error(
      'Watch Party scheduling requires a Discord server text channel.',
    );
  }

  return {
    guildId,
    channelId,

    organizerDiscordId:
      interaction.user.id,

    channel,
  };
}