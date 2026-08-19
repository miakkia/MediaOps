import {
  ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';

import { searchEmbyMovies } from '../services/emby.js';

export const data = new SlashCommandBuilder()
  .setName('movie')
  .setDescription('Search for a movie in the Emby library.')
  .addStringOption(option =>
    option
      .setName('title')
      .setDescription('Movie title to search for.')
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
    const movies = await searchEmbyMovies(title);

    if (movies.length === 0) {
      await interaction.editReply(
        `No movie found for **${title}**.`,
      );
      return;
    }

    const results = movies.map(movie => {
      const year = movie.year ? ` (${movie.year})` : '';

      return `• **${movie.name}**${year}`;
    });

    await interaction.editReply(
      `🎬 **Movie results**\n\n${results.join('\n')}`,
    );
  } catch (error) {
    console.error('Emby movie search failed:', error);

    await interaction.editReply(
      'Unable to search the Emby library right now.',
    );
  }
}