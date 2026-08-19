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
  mediaProvider,
} from '../providers/media-provider-instance.js';

export const data =
  new SlashCommandBuilder()
    .setName('movie')
    .setDescription(
      t(
        'en',
        'commands.movie.description',
      ),
    )
    .setDescriptionLocalizations({
      fr:
        t(
          'fr',
          'commands.movie.description',
        ),
    })
    .addStringOption(option =>
      option
        .setName('title')
        .setDescription(
          t(
            'en',
            'commands.movie.titleOptionDescription',
          ),
        )
        .setDescriptionLocalizations({
          fr:
            t(
              'fr',
              'commands.movie.titleOptionDescription',
            ),
        })
        .setRequired(true)
        .setMaxLength(100),
    );

export async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const locale =
    getInteractionLocale(
      interaction,
    );

  const title =
    interaction.options.getString(
      'title',
      true,
    );

  await interaction.deferReply({
    flags:
      MessageFlags.Ephemeral,
  });

  try {
      const movies =
         await mediaProvider.searchMovies(
           title,
  );
    if (movies.length === 0) {
      await interaction.editReply(
        t(
          locale,
          'emby.movie.notFound',
          {
            title,
          },
        ),
      );

      return;
    }

    const results =
      movies.map(movie => {
        const year =
          movie.year !== undefined
            ? ` (${movie.year})`
            : '';

        return (
          `• **${movie.name}**${year}`
        );
      });

    await interaction.editReply(
      `${t(
        locale,
        'emby.movie.results',
      )}\n\n` +
      results.join('\n'),
    );
  } catch (error) {
    console.error(
      'Emby movie search failed:',
      error,
    );

    await interaction.editReply(
      t(
        locale,
        'emby.unavailable',
      ),
    );
  }
}