import {
  ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';

import {
  isMediaOpsDemoMode,
} from '../config/demo-mode.js';

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

import {
  createWatchPartyJoinRow,
} from '../watchparty/components.js';

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

    const demoMode =
      isMediaOpsDemoMode();

    const joinUrl =
      demoMode
        ? undefined
        : getWatchPartyJoinUrl(
            code,
          );

    const row =
      createWatchPartyJoinRow(
        t(
          locale,
          'watchparty.joinButton',
        ),
        joinUrl,
        demoMode,
      );

    const demoNotice =
      demoMode
        ? (
            locale === 'fr'
              ? '\n\n🔒 Mode démo : le lien Watch Party est volontairement désactivé.'
              : '\n\n🔒 Demo mode: the Watch Party link is intentionally disabled.'
          )
        : '';

    await interaction.editReply({
      content:
        t(
          locale,
          'watchparty.verified',
          {
            code,
          },
        ) + demoNotice,

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