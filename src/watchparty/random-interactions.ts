import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
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
  createRandomScheduleModal,
} from './random-modal.js';

interface RandomInteractionId {
  action:
    | 'another'
    | 'choose';

  movieId:
    string | undefined;
}

function parseRandomInteractionId(
  customId: string,
): RandomInteractionId | undefined {
  const normalized =
    customId
      .replace(
        /\\:/g,
        ':',
      )
      .trim();

  const parts =
    normalized.split(':');

  if (
    parts[0] !== 'watchpartyrandom'
  ) {
    return undefined;
  }

  if (
    parts.length === 2 &&
    parts[1] === 'another'
  ) {
    return {
      action:
        'another',

      movieId:
        undefined,
    };
  }

  if (
    parts.length === 3 &&
    parts[1] === 'choose'
  ) {
    const movieId =
      parts[2]?.trim();

    if (
      !movieId ||
      movieId.length > 128 ||
      !/^[A-Za-z0-9_-]+$/.test(
        movieId,
      )
    ) {
      return undefined;
    }

    return {
      action:
        'choose',

      movieId,
    };
  }

  return undefined;
}

export async function handleWatchPartyRandomButton(
  interaction: ButtonInteraction,
): Promise<boolean> {
  const parsed =
    parseRandomInteractionId(
      interaction.customId,
    );

  if (!parsed) {
    return false;
  }

  const locale =
    getInteractionLocale(
      interaction,
    );

  if (
    parsed.action === 'another'
  ) {
    await interaction.deferUpdate();

    try {
      const movie =
        await mediaProvider.getRandomMovie()

      if (!movie) {
        await interaction.editReply({
          content:
            t(
              locale,
              'watchparty.random.empty',
            ),

          components: [],
        });

        return true;
      }

      const year =
        movie.year !== undefined
          ? ` (${movie.year})`
          : '';

      const overview =
        movie.overview?.trim();

      const description =
        overview &&
        overview.length > 0
          ? overview
          : t(
              locale,
              'watchparty.random.noOverview',
            );

      const chooseCustomId =
        `watchpartyrandom:choose:${movie.id}`;

      if (
        chooseCustomId.length >
        100
      ) {
        throw new Error(
          'Random Watch Party choose custom ID exceeds Discord limits.',
        );
      }

      const anotherButton =
        new ButtonBuilder()
          .setCustomId(
            'watchpartyrandom:another',
          )
          .setLabel(
            locale === 'fr'
              ? 'Un autre film'
              : 'Another movie',
          )
          .setEmoji('🎲')
          .setStyle(
            ButtonStyle.Secondary,
          );

      const chooseButton =
        new ButtonBuilder()
          .setCustomId(
            chooseCustomId,
          )
          .setLabel(
            locale === 'fr'
              ? 'Choisir ce film'
              : 'Choose this movie',
          )
          .setEmoji('✅')
          .setStyle(
            ButtonStyle.Success,
          );

      const row =
        new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            anotherButton,
            chooseButton,
          );

      await interaction.editReply({
        content:
          `${t(
            locale,
            'watchparty.random.title',
          )}\n\n` +

          `🎬 **${movie.name}**${year}\n\n` +

          description,

        components: [
          row,
        ],
      });

      return true;
    } catch (error) {
      console.error(
        'Random Watch Party reroll failed:',
        error,
      );

      await interaction.editReply({
        content:
          t(
            locale,
            'watchparty.random.error',
          ),

        components: [],
      });

      return true;
    }
  }

  if (
    parsed.action === 'choose' &&
    parsed.movieId
  ) {
    try {
      const modal =
        createRandomScheduleModal(
          parsed.movieId,
          locale,
        );

      await interaction.showModal(
        modal,
      );

      return true;
    } catch (error) {
      console.error(
        'Unable to open random Watch Party scheduling modal:',
        error,
      );

      return true;
    }
  }

  return false;
}