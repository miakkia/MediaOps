import {
  AttachmentBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
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

import type {
  MediaPoster,
} from '../providers/media-provider.js';

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

function posterExtension(
  poster: MediaPoster,
): string {
  switch (poster.contentType) {
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/gif':
      return 'gif';
    default:
      return 'jpg';
  }
}

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

    const displayedMovies =
      movies.slice(0, 5);

    const posters =
      await Promise.all(
        displayedMovies.map(movie =>
          mediaProvider.getPoster(movie.id),
        ),
      );

    const files: AttachmentBuilder[] = [];

    const embeds =
      displayedMovies.map((movie, index) => {
        const embed =
          new EmbedBuilder()
            .setTitle(movie.name)
            .setDescription(
              movie.year !== undefined
                ? String(movie.year)
                : '—',
            );

        const poster =
          posters[index];

        if (poster) {
          const filename =
            `movie-${index + 1}.${posterExtension(poster)}`;

          files.push(
            new AttachmentBuilder(
              Buffer.from(poster.data),
              { name: filename },
            ),
          );

          embed.setThumbnail(
            `attachment://${filename}`,
          );
        }

        return embed;
      });

    await interaction.editReply({
      content:
        `🎬 ${t(
          locale,
          'emby.movie.results',
        )}`,
      embeds,
      files,
    });
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
