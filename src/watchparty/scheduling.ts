import type {
  ChatInputCommandInteraction,
  Guild,
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

import {
  createDiscordScheduledEventForParty,
  shouldCreateDiscordScheduledEvent,
} from './discord-events.js';

interface ScheduleWatchPartyInput {
  guildId: string;
  channelId: string;
  organizerDiscordId: string;

  movie: MediaMovie;

  scheduledAt: string;

  locale: SupportedLocale;

  guild: Guild;

  channel:
    | TextBasedChannel
    | null;
}

async function getScheduledEventPoster(
  movieId: string,
): Promise<Buffer | undefined> {
  try {
    const { mediaProvider } =
      await import(
        '../providers/media-provider-instance.js'
      );

    if (!mediaProvider.getPoster) {
      return undefined;
    }

    const poster =
      await mediaProvider.getPoster(movieId);

    return poster
      ? Buffer.from(poster.data)
      : undefined;
  } catch (error) {
    console.warn(
      `Unable to load poster for Discord Scheduled Event movie ${movieId}:`,
      error,
    );
    return undefined;
  }
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

      input.locale === 'fr'
        ? 'Démarrer maintenant'
        : 'Start Now',

      t(
        input.locale,
        'watchparty.cancel.button',
      ),
    );

  const publicMessage =
    await channel.send({
      content:
        '@here\n\n' +

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

      allowedMentions: {
        parse: [
          'everyone',
          'users',
        ],
      },

      components: [
        rsvpRow,
      ],
    });

  await setWatchPartyMessageId(
    party.id,
    publicMessage.id,
  );

  // Scheduled Events are an enhancement, never a prerequisite for the
  // existing Watch Party announcement/RSVP workflow. Poster retrieval is
  // also best-effort: a missing or rejected image must never block the party.
  const eventImage =
    shouldCreateDiscordScheduledEvent(
      scheduledDate,
    )
      ? await getScheduledEventPoster(
          input.movie.id,
        )
      : undefined;

  await createDiscordScheduledEventForParty(
    input.guild,
    party,
    eventImage,
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
  guild: Guild;
  channel: TextBasedChannel;
} {
  const guildId =
    interaction.guildId;

  const channelId =
    interaction.channelId;

  const guild =
    interaction.guild;

  const channel =
    interaction.channel;

  if (
    !guildId ||
    !channelId ||
    !guild ||
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

    guild,
    channel,
  };
}
