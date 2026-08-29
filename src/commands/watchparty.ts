import {
  ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';

import { getMediaOpsBranding } from '../config/branding.js';
import { isMediaOpsDemoMode } from '../config/demo-mode.js';
import { getInteractionLocale } from '../i18n/discord-locale.js';
import { t } from '../i18n/index.js';
import { createWatchParty } from '../services/watchparty.js';
import { createWatchPartyJoinRow } from '../watchparty/components.js';

export const data = new SlashCommandBuilder()
  .setName('watchparty')
  .setDescription(t('en', 'commands.watchparty.description'))
  .setDescriptionLocalizations({ fr: t('fr', 'commands.watchparty.description') });

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const locale = getInteractionLocale(interaction);
  const { botName, serverName } = getMediaOpsBranding();

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  try {
    const party = await createWatchParty();
    const demoMode = isMediaOpsDemoMode();
    const row = createWatchPartyJoinRow(
      t(locale, 'watchparty.openButton'),
      party.joinUrl,
      demoMode,
    );
    const demoNotice = demoMode
      ? (
          locale === 'fr'
            ? '\n\n🔒 Mode démo : le lien Watch Party est volontairement désactivé.'
            : '\n\n🔒 Demo mode: the Watch Party link is intentionally disabled.'
        )
      : '';

    await interaction.editReply({
      content:
        `${t(locale, 'watchparty.title', { serverName })}\n\n` +
        `**${party.partyCode}**\n\n` +
        t(locale, 'watchparty.securityNotice', { botName }) +
        demoNotice,
      components: [row],
    });
  } catch (error) {
    console.error('Watch Party creation failed:', error);
    await interaction.editReply(t(locale, 'watchparty.validationError'));
  }
}
