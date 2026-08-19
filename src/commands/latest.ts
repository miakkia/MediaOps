import {
  ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';

import { getLatestEmbyItems } from '../services/emby.js';

export const data = new SlashCommandBuilder()
  .setName('latest')
  .setDescription('Show the latest movies and TV series added to Emby.');

export async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  await interaction.deferReply({
    flags: MessageFlags.Ephemeral,
  });

  try {
    const items = await getLatestEmbyItems();

    if (items.length === 0) {
      await interaction.editReply(
        'No recent movies or TV series were found.',
      );
      return;
    }

    const results = items.map(item => {
      const icon = item.type === 'Movie' ? '🎬' : '📺';
      const year = item.year ? ` (${item.year})` : '';

      return `${icon} **${item.name}**${year}`;
    });

    await interaction.editReply(
      `🆕 **Latest additions**\n\n${results.join('\n')}`,
    );
  } catch (error) {
    console.error('Emby latest-items request failed:', error);

    await interaction.editReply(
      'Unable to retrieve the latest Emby additions right now.',
    );
  }
}