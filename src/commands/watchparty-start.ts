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
  .setName('watchparty-start')
  .setDescription('Validate and open an existing Watch Party.')
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
        `❌ Watch Party **${code}** does not exist or is no longer active.`,
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
      content:
        `✅ **Watch Party ${code} is active.**\n\n` +
        'The session was verified directly with the Watch Party server.',
      components: [row],
    });
  } catch (error) {
    console.error('Watch Party validation failed:', error);

    await interaction.editReply(
      'Unable to validate the Watch Party right now.',
    );
  }
}