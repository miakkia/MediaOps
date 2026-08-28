import {
  MessageFlags,
  ModalSubmitInteraction,
} from 'discord.js';

import {
  getInteractionLocale,
} from '../i18n/discord-locale.js';

import {
  t,
} from '../i18n/index.js';

import {
  mediaProvider,
} from '../providers/media-provider-instance.js';

import type {
  MediaMovie,
} from '../providers/media-provider.js';

import {
  getManualScheduleModalValues,
  isManualScheduleModalId,
} from './setup-interactions.js';

import {
  getSchedulingContext,
  scheduleWatchParty,
} from './scheduling.js';

import {
  parseWatchPartyDateTime,
} from './timezone.js';

function normalizeMovieTitle(
  value: string,
): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase();
}

function matchesMovieTitle(
  movie: MediaMovie,
  requestedTitle: string,
): boolean {
  const candidates = [
    movie.name,
    movie.originalTitle,
    movie.sortName,
  ];

  return candidates.some(
    candidate =>
      candidate !== undefined &&
      normalizeMovieTitle(candidate) === requestedTitle,
  );
}

function selectBestMovie(
  movies: MediaMovie[],
  requestedTitle: string,
): MediaMovie | undefined {
  const normalizedRequestedTitle = normalizeMovieTitle(requestedTitle);
  const exactMatch = movies.find(
    movie => matchesMovieTitle(movie, normalizedRequestedTitle),
  );

  return exactMatch ?? movies[0];
}

export async function handleWatchPartySetupModal(
  interaction: ModalSubmitInteraction,
): Promise<boolean> {
  if (!isManualScheduleModalId(interaction.customId)) {
    return false;
  }

  const locale = getInteractionLocale(interaction);

  await interaction.deferReply({
    flags: MessageFlags.Ephemeral,
  });

  try {
    const { title, date, time } = getManualScheduleModalValues(interaction.fields);

    if (title.length === 0) {
      await interaction.editReply(
        t(locale, 'watchparty.scheduling.movieSelectionError'),
      );
      return true;
    }

    const scheduledDate = parseWatchPartyDateTime(`${date} ${time}`);

    if (Number.isNaN(scheduledDate.getTime())) {
      await interaction.editReply(
        t(locale, 'watchparty.scheduling.invalidDate'),
      );
      return true;
    }

    if (scheduledDate.getTime() <= Date.now()) {
      await interaction.editReply(
        t(locale, 'watchparty.scheduling.pastDate'),
      );
      return true;
    }

    const movies = await mediaProvider.searchMovies(title);

    if (movies.length === 0) {
      await interaction.editReply(
        t(locale, 'emby.movie.notFound', { title }),
      );
      return true;
    }

    const movie = selectBestMovie(movies, title);

    if (!movie) {
      await interaction.editReply(
        t(locale, 'watchparty.scheduling.movieSelectionError'),
      );
      return true;
    }

    const context = getSchedulingContext(interaction);

    await scheduleWatchParty({
      guildId: context.guildId,
      channelId: context.channelId,
      organizerDiscordId: context.organizerDiscordId,
      movie,
      scheduledAt: scheduledDate.toISOString(),
      locale,
      guild: context.guild,
      channel: context.channel,
    });

    await interaction.editReply(
      t(locale, 'watchparty.scheduling.confirmation'),
    );

    return true;
  } catch (error) {
    console.error(
      'Watch Party setup scheduling modal failed:',
      error,
    );

    await interaction.editReply(
      t(locale, 'watchparty.scheduling.scheduleError'),
    );

    return true;
  }
}
