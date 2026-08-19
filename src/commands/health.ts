import {
  ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';

import { getEmbySystemInfo } from '../services/emby.js';

export const data = new SlashCommandBuilder()
  .setName('health')
  .setDescription('Check Solitario Butler and Emby health.');

export async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  try {
    const info = await getEmbySystemInfo();

    const embyInfo = info as {
      ServerName?: string;
      Version?: string;
    };

    await interaction.reply({
      content:
        `🟢 Solitario Butler is online.\n` +
        `🟢 Emby is online.\n` +
        `Server: ${embyInfo.ServerName ?? 'Unknown'}\n` +
        `Version: ${embyInfo.Version ?? 'Unknown'}`,
      flags: MessageFlags.Ephemeral,
    });
  } catch (error) {
    console.error('Emby health check failed:', error);

    await interaction.reply({
      content:
        '🟢 Solitario Butler is online.\n' +
        '🔴 Emby health check failed.',
      flags: MessageFlags.Ephemeral,
    });
  }
}