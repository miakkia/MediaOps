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

import {
  getRandomScheduleDateTime,
  parseRandomScheduleModalId,
} from './random-modal.js';

import {
  getSchedulingContext,
  scheduleWatchParty,
} from './scheduling.js';

import {
  parseWatchPartyDateTime,
} from './timezone.js';

export async function handleWatchPartyRandomModal(
  interaction: ModalSubmitInteraction,
): Promise<boolean> {
  const movieId = parseRandomScheduleModalId(interaction.customId);

  if (!movieId) {
    return false;
  }

  const locale = getInteractionLocale(interaction);

  await interaction.deferReply({
    flags: MessageFlags.Ephemeral,
  });

  try {
    const { date, time } = getRandomScheduleDateTime(interaction.fields);
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

    const movie = await mediaProvider.getMovieById(movieId);

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
      'Random Watch Party scheduling modal failed:',
      error,
    );

    await interaction.editReply(
      t(locale, 'watchparty.scheduling.scheduleError'),
    );

    return true;
  }
}
