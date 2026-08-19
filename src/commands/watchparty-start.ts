import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
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
  getWatchPartyJoinUrl,
  watchPartyExists,
} from '../services/watchparty.js';

export const data =
  new SlashCommandBuilder()
    .setName('watchparty-start')
    .setDescription(
      t(
        'en',
        'commands.watchpartyStart.description',
      ),
    )
    .setDescriptionLocalizations({
      fr:
        t(
          'fr',
          'commands.watchpartyStart.description',
        ),
    })
    .addStringOption(option =>
      option
        .setName('code')
        .setDescription(
          t(
            'en',
            'commands.watchpartyStart.codeOptionDescription',
          ),
        )
        .setDescriptionLocalizations({
          fr:
            t(
              'fr',
              'commands.watchpartyStart.codeOptionDescription',
            ),
        })
        .setRequired(true)
        .setMinLength(5)
        .setMaxLength(5),
    );

export async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const locale =
    getInteractionLocale(
      interaction,
    );

  const code =
    interaction.options
      .getString(
        'code',
        true,
      )
      .trim()
      .toUpperCase();

  await interaction.deferReply({
    flags:
      MessageFlags.Ephemeral,
  });

  try {
    const exists =
      await watchPartyExists(
        code,
      );

    if (!exists) {
      await interaction.editReply(
        t(
          locale,
          'watchparty.invalid',
          {
            code,
          },
        ),
      );

      return;
    }

    const joinUrl =
      getWatchPartyJoinUrl(
        code,
      );

    const joinButton =
      new ButtonBuilder()
        .setLabel(
          t(
            locale,
            'watchparty.joinButton',
          ),
        )
        .setEmoji('🎬')
        .setStyle(
          ButtonStyle.Link,
        )
        .setURL(
          joinUrl,
        );

    const row =
      new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          joinButton,
        );

    await interaction.editReply({
      content:
        t(
          locale,
          'watchparty.verified',
          {
            code,
          },
        ),

      components: [
        row,
      ],
    });
  } catch (error) {
    console.error(
      'Watch Party validation failed:',
      error,
    );

    await interaction.editReply(
      t(
        locale,
        'watchparty.validationError',
      ),
    );
  }
}