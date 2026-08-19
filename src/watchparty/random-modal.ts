import {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';

const RANDOM_SCHEDULE_MODAL_PREFIX =
  'watchpartyrandom:schedule:';

const DATE_INPUT_ID =
  'date';

const TIME_INPUT_ID =
  'time';

export interface RandomScheduleDateTimeInput {
  date: string;
  time: string;
}

export function createRandomScheduleModal(
  movieId: string,
  locale: 'en' | 'fr',
): ModalBuilder {
  const customId =
    `${RANDOM_SCHEDULE_MODAL_PREFIX}${movieId}`;

  if (customId.length > 100) {
    throw new Error(
      'Random Watch Party modal custom ID exceeds Discord limits.',
    );
  }

  const dateInput =
    new TextInputBuilder()
      .setCustomId(
        DATE_INPUT_ID,
      )
      .setLabel(
        locale === 'fr'
          ? 'Date'
          : 'Date',
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

  const dateRow =
    new ActionRowBuilder<TextInputBuilder>()
      .addComponents(
        dateInput,
      );

  const timeRow =
    new ActionRowBuilder<TextInputBuilder>()
      .addComponents(
        timeInput,
      );

  return new ModalBuilder()
    .setCustomId(
      customId,
    )
    .setTitle(
      locale === 'fr'
        ? 'Planifier la Watch Party'
        : 'Schedule Watch Party',
    )
    .addComponents(
      dateRow,
      timeRow,
    );
}

export function parseRandomScheduleModalId(
  customId: string,
): string | undefined {
  if (
    !customId.startsWith(
      RANDOM_SCHEDULE_MODAL_PREFIX,
    )
  ) {
    return undefined;
  }

  const movieId =
    customId
      .slice(
        RANDOM_SCHEDULE_MODAL_PREFIX.length,
      )
      .trim();

  if (
    movieId.length === 0 ||
    movieId.length > 128 ||
    !/^[A-Za-z0-9_-]+$/.test(
      movieId,
    )
  ) {
    return undefined;
  }

  return movieId;
}

export function getRandomScheduleDateTime(
  fields: {
    getTextInputValue(
      customId: string,
    ): string;
  },
): RandomScheduleDateTimeInput {
  const date =
    fields
      .getTextInputValue(
        DATE_INPUT_ID,
      )
      .trim();

  const time =
    fields
      .getTextInputValue(
        TIME_INPUT_ID,
      )
      .trim();

  return {
    date,
    time,
  };
}