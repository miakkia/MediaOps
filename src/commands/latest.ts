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

  await interaction.deferReply({
    flags:
      MessageFlags.Ephemeral,
  });

  try {
    const items =
      await mediaProvider.getLatestItems();

    if (items.length === 0) {
      await interaction.editReply(
        t(
          locale,
          'emby.latest.empty',
        ),
      );

      return;
    }

    const displayedItems =
      items.slice(0, 5);

    const posters =
      await Promise.all(
        displayedItems.map(item =>
          mediaProvider.getPoster
            ? mediaProvider.getPoster(item.id)
            : Promise.resolve(undefined),
        ),
      );

    const files: AttachmentBuilder[] = [];

    const embeds =
      displayedItems.map((item, index) => {
        const icon =
          item.type === 'Movie'
            ? '🎬'
            : '📺';

        const details: string[] = [];

        if (item.year !== undefined) {
          details.push(String(item.year));
        }

        if (item.type === 'Series' && item.seriesStatus) {
          const normalizedStatus =
            item.seriesStatus.trim().toLowerCase();

          if (normalizedStatus === 'continuing') {
            details.push(
              locale === 'fr'
                ? '🟢 En cours'
                : '🟢 Continuing',
            );
          } else if (normalizedStatus === 'ended') {
            details.push(
              locale === 'fr'
                ? '🔴 Terminée'
                : '🔴 Ended',
            );
          }
        }

        const embed =
          new EmbedBuilder()
            .setTitle(`${icon} ${item.name}`)
            .setDescription(
              details.length > 0
                ? details.join(' • ')
                : '—',
            );

        const poster =
          posters[index];

        if (poster) {
          const filename =
            `latest-${index + 1}.${posterExtension(poster)}`;

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
        t(
          locale,
          'emby.latest.title',
        ),
      embeds,
      files,
    });
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
