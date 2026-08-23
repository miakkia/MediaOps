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
  getUpcomingWatchParties,
  refreshWatchPartyLifecycle,
} from '../storage/watchparty-store.js';

export const data =
  new SlashCommandBuilder()
    .setName('watchparty-upcoming')
    .setDescription(
      t(
        'en',
        'commands.watchpartyUpcoming.description',
      ),
    )
    .setDescriptionLocalizations({
      fr:
        t(
          'fr',
          'commands.watchpartyUpcoming.description',
        ),
    });

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
    await refreshWatchPartyLifecycle();

    const guildId =
      interaction.guildId;

    if (!guildId) {
      await interaction.editReply(
        t(
          locale,
          'watchparty.upcoming.guildOnly',
        ),
      );

      return;
    }

    const parties =
      await getUpcomingWatchParties(
        guildId,
      );

    if (parties.length === 0) {
      await interaction.editReply(
        t(
          locale,
          'watchparty.upcoming.empty',
        ),
      );

      return;
    }

    const results =
      parties
        .slice(0, 10)
        .map(party => {
          const timestamp =
            Math.floor(
              new Date(
                party.scheduledAt,
              ).getTime() / 1000,
            );

          const year =
            party.mediaYear !== undefined
              ? ` (${party.mediaYear})`
              : '';

          const going =
            party.participants.filter(
              participant =>
                participant.response ===
                'going',
            ).length;

          const status =
            party.status === 'active'
              ? '🎬'
              : party.status === 'ready'
                ? '🟢'
                : '🗓️';

          const code =
            party.status === 'active' &&
            party.partyCode
              ? `\n   🔑 \`${party.partyCode}\``
              : '';

          return (
            `${status} **${party.mediaTitle}**${year}\n` +
            `   <t:${timestamp}:F> • <t:${timestamp}:R>\n` +
            `   👥 ${going} going` +
            code
          );
        });

    await interaction.editReply(
      `${t(
        locale,
        'watchparty.upcoming.title',
      )}\n\n` +
      results.join('\n\n'),
    );
  } catch (error) {
    console.error(
      'Watch Party upcoming request failed:',
      error,
    );

    await interaction.editReply(
      t(
        locale,
        'watchparty.upcoming.error',
      ),
    );
  }
}
