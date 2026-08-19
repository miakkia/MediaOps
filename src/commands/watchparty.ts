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
  getWatchPartyUrl,
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

  const watchPartyUrl =
    getWatchPartyUrl();

  const openButton =
    new ButtonBuilder()
      .setLabel(
        t(
          locale,
          'watchparty.openButton',
        ),
      )
      .setEmoji('🌐')
      .setStyle(
        ButtonStyle.Link,
      )
      .setURL(
        watchPartyUrl,
      );

  const row =
    new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        openButton,
      );

  await interaction.reply({
    content:
      `${t(
        locale,
        'watchparty.title',
      )}\n\n` +

      `${t(
        locale,
        'watchparty.instructions',
      )}\n\n` +

      t(
        locale,
        'watchparty.securityNotice',
      ),

    components: [
      row,
    ],

    flags:
      MessageFlags.Ephemeral,
  });
}