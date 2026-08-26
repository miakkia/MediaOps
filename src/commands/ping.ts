import {
  ChatInputCommandInteraction,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';

import { getMediaOpsBranding } from '../config/branding.js';
import { getInteractionLocale } from '../i18n/discord-locale.js';
import { t } from '../i18n/index.js';

export const data = new SlashCommandBuilder()
  .setName('ping')
  .setDescription(t('en', 'commands.ping.description'))
  .setDescriptionLocalizations({ fr: t('fr', 'commands.ping.description') })
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const locale = getInteractionLocale(interaction);
  const { botName } = getMediaOpsBranding();
  await interaction.reply({
    content: t(locale, 'health.botOnline', { botName }),
    flags: MessageFlags.Ephemeral,
  });
}
