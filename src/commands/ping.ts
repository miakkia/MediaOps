import {
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

export const data =
  new SlashCommandBuilder()
    .setName('ping')
    .setDescription(
      t(
        'en',
        'commands.ping.description',
      ),
    )
    .setDescriptionLocalizations({
      fr:
        t(
          'fr',
          'commands.ping.description',
        ),
    });

export async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const locale =
    getInteractionLocale(
      interaction,
    );

  await interaction.reply({
    content:
      t(
        locale,
        'health.botOnline',
      ),

    flags:
      MessageFlags.Ephemeral,
  });
}