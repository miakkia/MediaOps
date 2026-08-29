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
  SeriesLifecycleStatus,
} from '../providers/media-provider.js';

export const data =
  new SlashCommandBuilder()
    .setName('tv')
    .setDescription(
      t(
        'en',
        'commands.tv.description',
      ),
    )
    .setDescriptionLocalizations({
      fr:
        t(
          'fr',
          'commands.tv.description',
        ),
    })
    .addStringOption(option =>
      option
        .setName('title')
        .setDescription(
          t(
            'en',
            'commands.tv.titleOptionDescription',
          ),
        )
        .setDescriptionLocalizations({
          fr:
            t(
              'fr',
              'commands.tv.titleOptionDescription',
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

function statusLabel(
  status: SeriesLifecycleStatus | undefined,
  locale: 'en' | 'fr',
): string | undefined {
  if (status === 'ended') {
    return locale === 'fr'
      ? '🔴 Terminée'
      : '🔴 Ended';
  }

  if (status === 'continuing') {
    return locale === 'fr'
      ? '🟢 En cours'
      : '🟢 Continuing';
  }

  return undefined;
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
    const series =
      await mediaProvider.searchSeries(
        title,
      );

    if (series.length === 0) {
      await interaction.editReply(
        t(
          locale,
          'emby.tv.notFound',
          {
            title,
          },
        ),
      );

      return;
    }

    const displayedSeries =
      series.slice(0, 5);

    const posters =
      await Promise.all(
        displayedSeries.map(item =>
          mediaProvider.getPoster(item.id),
        ),
      );

    const files: AttachmentBuilder[] = [];

    const embeds =
      displayedSeries.map((item, index) => {
        const metadata = [
          item.year !== undefined
            ? String(item.year)
            : undefined,
          statusLabel(
            item.seriesStatus,
            locale,
          ),
        ].filter(
          (value): value is string =>
            value !== undefined,
        );

        const embed =
          new EmbedBuilder()
            .setTitle(item.name)
            .setDescription(
              metadata.length > 0
                ? metadata.join(' • ')
                : '—',
            );

        const poster =
          posters[index];

        if (poster) {
          const filename =
            `series-${index + 1}.${posterExtension(poster)}`;

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
        `📺 ${t(
          locale,
          'emby.tv.results',
        )}`,
      embeds,
      files,
    });
  } catch (error) {
    console.error(
      'Emby TV series search failed:',
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
