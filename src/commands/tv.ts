import {
  ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';

import { searchEmbySeries } from '../services/emby.js';

export const data = new SlashCommandBuilder()
  .setName('tv')
  .setDescription('Search for a TV series in the Emby library.')
  .addStringOption(option =>
    option
      .setName('title')
      .setDescription('TV series title to search for.')
      .setRequired(true)
      .setMaxLength(100),
  );

export async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const title = interaction.options.getString('title', true);

  await interaction.deferReply({
    flags: MessageFlags.Ephemeral,
  });

  try {
    const series = await searchEmbySeries(title);

    if (series.length === 0) {
      await interaction.editReply(
        `No TV series found for **${title}**.`,
      );
      return;
    }

    const results = series.map(item => {
      const year = item.year ? ` (${item.year})` : '';

      return `• **${item.name}**${year}`;
    });

    await interaction.editReply(
      `📺 **TV series results**\n\n${results.join('\n')}`,
    );
  } catch (error) {
    console.error('Emby TV series search failed:', error);

    await interaction.editReply(
      'Unable to search the Emby library right now.',
    );
  }
}