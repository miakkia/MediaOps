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

    const results =
      series.map(item => {
        const year =
          item.year !== undefined
            ? ` (${item.year})`
            : '';

        return (
          `• **${item.name}**${year}`
        );
      });

    await interaction.editReply(
      `${t(
        locale,
        'emby.tv.results',
      )}\n\n` +
      results.join('\n'),
    );
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