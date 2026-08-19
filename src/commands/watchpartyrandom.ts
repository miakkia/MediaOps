import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
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

const RANDOM_BUTTON_ID =
  'watchpartyrandom:another';

const CHOOSE_BUTTON_PREFIX =
  'watchpartyrandom:choose:';

export const data =
  new SlashCommandBuilder()
    .setName('watchpartyrandom')
    .setDescription(
      t(
        'en',
        'commands.watchpartyRandom.description',
      ),
    )
    .setDescriptionLocalizations({
      fr:
        t(
          'fr',
          'commands.watchpartyRandom.description',
        ),
    });

export async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const locale =
    getInteractionLocale(
      interaction,
    );

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

      return;
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
      `${CHOOSE_BUTTON_PREFIX}${movie.id}`;

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
          RANDOM_BUTTON_ID,
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
  } catch (error) {
    console.error(
      'Random Watch Party movie selection failed:',
      error,
    );

    await interaction.editReply(
      t(
        locale,
        'watchparty.random.error',
      ),
    );
  }
}