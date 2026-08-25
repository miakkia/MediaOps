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

function parseLocalDateTime(
  date: string,
  time: string,
): Date | undefined {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !/^\d{2}:\d{2}$/.test(time)
  ) {
    return undefined;
  }

  const [yearText, monthText, dayText] = date.split('-');
  const [hourText, minuteText] = time.split(':');

  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    !Number.isInteger(hour) ||
    !Number.isInteger(minute)
  ) {
    return undefined;
  }

  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return undefined;
  }

  const localDate = new Date(
    year,
    month - 1,
    day,
    hour,
    minute,
    0,
    0,
  );

  if (
    localDate.getFullYear() !== year ||
    localDate.getMonth() !== month - 1 ||
    localDate.getDate() !== day ||
    localDate.getHours() !== hour ||
    localDate.getMinutes() !== minute
  ) {
    return undefined;
  }

  return localDate;
}

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

    const scheduledDate = parseLocalDateTime(date, time);

    if (!scheduledDate) {
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
