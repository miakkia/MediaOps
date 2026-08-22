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
  createWatchParty,
} from '../services/watchparty.js';

export const data =
  new SlashCommandBuilder()
    .setName('watchparty')
    .setDescription(
      t(
        'en',
        'commands.watchparty.description',
      ),
    )
    .setDescriptionLocalizations({
      fr:
        t(
          'fr',
          'commands.watchparty.description',
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
    const party =
      await createWatchParty();

    const openButton =
      new ButtonBuilder()
        .setLabel(
          t(
            locale,
            'watchparty.openButton',
          ),
        )
        .setEmoji('🎬')
        .setStyle(
          ButtonStyle.Link,
        )
        .setURL(
          party.joinUrl,
        );

    const row =
      new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          openButton,
        );

    await interaction.editReply({
      content:
        `${t(
          locale,
          'watchparty.title',
        )}\n\n` +
        `**${party.partyCode}**\n\n` +
        t(
          locale,
          'watchparty.securityNotice',
        ),
      components: [
        row,
      ],
    });
  } catch (error) {
    console.error(
      'Watch Party creation failed:',
      error,
    );

    await interaction.editReply(
      t(
        locale,
        'watchparty.validationError',
      ),
    );
  }
}
