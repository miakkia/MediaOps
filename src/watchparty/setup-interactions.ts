import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  EmbedBuilder,
  MessageFlags,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
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
  MediaPoster,
} from '../providers/media-provider.js';

const RANDOM_BUTTON_ID =
  'watchpartysetup:random';

const SCHEDULE_BUTTON_ID =
  'watchpartysetup:schedule';

const MANUAL_SCHEDULE_MODAL_ID =
  'watchpartysetup:schedule-modal';

const TITLE_INPUT_ID =
  'title';

const DATE_INPUT_ID =
  'date';

const TIME_INPUT_ID =
  'time';

function posterExtension(
  poster: MediaPoster,
): string {
  switch (poster.contentType) {
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/gif':
      return 'gif';
    default:
      return 'jpg';
  }
}

export async function handleWatchPartySetupButton(
  interaction: ButtonInteraction,
): Promise<boolean> {
  const locale =
    getInteractionLocale(
      interaction,
    );

  if (
    interaction.customId ===
    RANDOM_BUTTON_ID
  ) {
    await interaction.deferReply({
      flags:
        MessageFlags.Ephemeral,
    });

    try {
      const movie =
        await mediaProvider.getRandomMovie()

      if (!movie) {
        await interaction.editReply(
          t(
            locale,
            'watchparty.random.empty',
          ),
        );

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

      const embed =
        new EmbedBuilder()
          .setTitle(
            `🎬 ${movie.name}${year}`,
          )
          .setDescription(description);

      const files: AttachmentBuilder[] = [];

      if (mediaProvider.getPoster) {
        const poster =
          await mediaProvider.getPoster(
            movie.id,
          );

        if (poster) {
          const filename =
            `watchparty-random.${posterExtension(poster)}`;

          files.push(
            new AttachmentBuilder(
              Buffer.from(poster.data),
              { name: filename },
            ),
          );

          embed.setThumbnail(
            `attachment://${filename}`,
          );
        }
      }

      await interaction.editReply({
        content:
          t(
            locale,
            'watchparty.random.title',
          ),

        embeds: [
          embed,
        ],

        files,

        components: [
          row,
        ],
      });

      return true;
    } catch (error) {
      console.error(
        'Watch Party setup random action failed:',
        error,
      );

      await interaction.editReply(
        t(
          locale,
          'watchparty.random.error',
        ),
      );

      return true;
    }
  }

  if (
    interaction.customId ===
    SCHEDULE_BUTTON_ID
  ) {
    const modal =
      createManualScheduleModal(
        locale,
      );

    await interaction.showModal(
      modal,
    );

    return true;
  }

  return false;
}

export function createManualScheduleModal(
  locale: 'en' | 'fr',
): ModalBuilder {
  const titleInput =
    new TextInputBuilder()
      .setCustomId(
        TITLE_INPUT_ID,
      )
      .setLabel(
        locale === 'fr'
          ? 'Film'
          : 'Movie',
      )
      .setPlaceholder(
        locale === 'fr'
          ? 'Ex. Jurassic Park'
          : 'e.g. Jurassic Park',
      )
      .setStyle(
        TextInputStyle.Short,
      )
      .setRequired(true)
      .setMaxLength(100);

  const dateInput =
    new TextInputBuilder()
      .setCustomId(
        DATE_INPUT_ID,
      )
      .setLabel(
        'Date',
      )
      .setPlaceholder(
        '2026-08-20',
      )
      .setStyle(
        TextInputStyle.Short,
      )
      .setRequired(true)
      .setMinLength(10)
      .setMaxLength(10);

  const timeInput =
    new TextInputBuilder()
      .setCustomId(
        TIME_INPUT_ID,
      )
      .setLabel(
        locale === 'fr'
          ? 'Heure'
          : 'Time',
      )
      .setPlaceholder(
        '21:00',
      )
      .setStyle(
        TextInputStyle.Short,
      )
      .setRequired(true)
      .setMinLength(5)
      .setMaxLength(5);

  return new ModalBuilder()
    .setCustomId(
      MANUAL_SCHEDULE_MODAL_ID,
    )
    .setTitle(
      locale === 'fr'
        ? 'Planifier une Watch Party'
        : 'Schedule a Watch Party',
    )
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>()
        .addComponents(
          titleInput,
        ),

      new ActionRowBuilder<TextInputBuilder>()
        .addComponents(
          dateInput,
        ),

      new ActionRowBuilder<TextInputBuilder>()
        .addComponents(
          timeInput,
        ),
    );
}

export function isManualScheduleModalId(
  customId: string,
): boolean {
  return (
    customId ===
    MANUAL_SCHEDULE_MODAL_ID
  );
}

export function getManualScheduleModalValues(
  fields: {
    getTextInputValue(
      customId: string,
    ): string;
  },
): {
  title: string;
  date: string;
  time: string;
} {
  return {
    title:
      fields
        .getTextInputValue(
          TITLE_INPUT_ID,
        )
        .trim(),

    date:
      fields
        .getTextInputValue(
          DATE_INPUT_ID,
        )
        .trim(),

    time:
      fields
        .getTextInputValue(
          TIME_INPUT_ID,
        )
        .trim(),
  };
}