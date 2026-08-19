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
  getLatestEmbyItems,
} from '../services/emby.js';

export const data =
  new SlashCommandBuilder()
    .setName('latest')
    .setDescription(
      t(
        'en',
        'commands.latest.description',
      ),
    )
    .setDescriptionLocalizations({
      fr:
        t(
          'fr',
          'commands.latest.description',
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
    const items =
      await getLatestEmbyItems();

    if (items.length === 0) {
      await interaction.editReply(
        t(
          locale,
          'emby.latest.empty',
        ),
      );

      return;
    }

    const results =
      items.map(item => {
        const icon =
          item.type === 'Movie'
            ? '🎬'
            : '📺';

        const year =
          item.year !== undefined
            ? ` (${item.year})`
            : '';

        return (
          `${icon} **${item.name}**${year}`
        );
      });

    await interaction.editReply(
      `${t(
        locale,
        'emby.latest.title',
      )}\n\n` +
      results.join('\n'),
    );
  } catch (error) {
    console.error(
      'Emby latest-items request failed:',
      error,
    );

    await interaction.editReply(
      t(
        locale,
        'emby.latest.error',
      ),
    );
  }
}