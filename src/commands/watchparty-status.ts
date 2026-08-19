import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';

import {
  getWatchPartyJoinUrl,
  watchPartyExists,
} from '../services/watchparty.js';

export const data = new SlashCommandBuilder()
  .setName('watchparty-status')
  .setDescription('Check whether a Watch Party is still active.')
  .addStringOption(option =>
    option
      .setName('code')
      .setDescription('The 5-character Watch Party code.')
      .setRequired(true)
      .setMinLength(5)
      .setMaxLength(5),
  );

export async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const code = interaction.options
    .getString('code', true)
    .trim()
    .toUpperCase();

  await interaction.deferReply({
    flags: MessageFlags.Ephemeral,
  });

  try {
    const exists = await watchPartyExists(code);

    if (!exists) {
      await interaction.editReply(
        `⚫ Watch Party **${code}** is not active.`,
      );
      return;
    }

    const joinUrl = getWatchPartyJoinUrl(code);

    const joinButton = new ButtonBuilder()
      .setLabel('Join Watch Party')
      .setEmoji('🎬')
      .setStyle(ButtonStyle.Link)
      .setURL(joinUrl);

    const row =
      new ActionRowBuilder<ButtonBuilder>().addComponents(joinButton);

    await interaction.editReply({
      content: `🟢 Watch Party **${code}** is active.`,
      components: [row],
    });
  } catch (error) {
    console.error('Watch Party status check failed:', error);

    await interaction.editReply(
      'Unable to check the Watch Party status right now.',
    );
  }
}