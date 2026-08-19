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

import {
  getEmbySystemInfo,
} from '../services/emby.js';

export const data =
  new SlashCommandBuilder()
    .setName('health')
    .setDescription(
      t(
        'en',
        'commands.health.description',
      ),
    )
    .setDescriptionLocalizations({
      fr:
        t(
          'fr',
          'commands.health.description',
        ),
    });

export async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const locale =
    getInteractionLocale(
      interaction,
    );

  try {
    const info =
      await getEmbySystemInfo();

    const serverName =
      info.ServerName ??
      t(
        locale,
        'health.unknown',
      );

    const version =
      info.Version ??
      t(
        locale,
        'health.unknown',
      );

    await interaction.reply({
      content:
        `${t(
          locale,
          'health.botOnline',
        )}\n` +

        `${t(
          locale,
          'health.embyOnline',
        )}\n` +

        `${t(
          locale,
          'health.server',
        )}: ${serverName}\n` +

        `${t(
          locale,
          'health.version',
        )}: ${version}`,

      flags:
        MessageFlags.Ephemeral,
    });
  } catch (error) {
    console.error(
      'Emby health check failed:',
      error,
    );

    await interaction.reply({
      content:
        `${t(
          locale,
          'health.botOnline',
        )}\n` +

        `${t(
          locale,
          'health.embyFailed',
        )}`,

      flags:
        MessageFlags.Ephemeral,
    });
  }
}