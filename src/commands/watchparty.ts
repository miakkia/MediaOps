import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';

import { getWatchPartyUrl } from '../services/watchparty.js';

export const data = new SlashCommandBuilder()
  .setName('watchparty')
  .setDescription('Open SolitarioHomeCinema Watch Party.');

export async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const watchPartyUrl = getWatchPartyUrl();

  const openButton = new ButtonBuilder()
    .setLabel('Open Watch Party')
    .setEmoji('🌐')
    .setStyle(ButtonStyle.Link)
    .setURL(watchPartyUrl);

  const row =
    new ActionRowBuilder<ButtonBuilder>().addComponents(openButton);

  await interaction.reply({
    content:
      '🎉 **SolitarioHomeCinema Watch Party**\n\n' +
      '1. Open Watch Party.\n' +
      '2. Create the party and authenticate directly with Emby.\n' +
      '3. Copy the generated 5-character party code.\n' +
      '4. Run `/watchparty-start` with that code.\n\n' +
      '🔐 Your Emby password is entered only on Watch Party and is never sent to Solitario Butler.',
    components: [row],
    flags: MessageFlags.Ephemeral,
  });
}