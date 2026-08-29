import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';

import { getMediaOpsBranding } from '../config/branding.js';
import { isMediaOpsDemoMode } from '../config/demo-mode.js';
import { getWatchPartyUrl } from '../services/watchparty.js';
import { createWatchPartyJoinButton } from '../watchparty/components.js';

const RANDOM_BUTTON_ID = 'watchpartysetup:random';
const SCHEDULE_BUTTON_ID = 'watchpartysetup:schedule';

export const data = new SlashCommandBuilder()
  .setName('watchparty-setup')
  .setDescription('Publish the Watch Party welcome panel in this channel.')
  .setDescriptionLocalizations({ fr: 'Publier le panneau Watch Party dans ce salon.' })
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guildId || !interaction.channelId) {
    await interaction.reply({
      content: '❌ This command must be used in a Discord server.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const channel = interaction.channel;
  if (!channel || !channel.isSendable()) {
    await interaction.reply({
      content: '❌ Unable to publish the Watch Party panel in this channel.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const demoMode = isMediaOpsDemoMode();
  const watchPartyUrl = demoMode ? undefined : getWatchPartyUrl();
  const { botName, serverName } = getMediaOpsBranding();

  const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(RANDOM_BUTTON_ID)
      .setLabel('Random / Aléatoire')
      .setEmoji('🎲')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(SCHEDULE_BUTTON_ID)
      .setLabel('Planifier / Schedule')
      .setEmoji('📅')
      .setStyle(ButtonStyle.Primary),
    createWatchPartyJoinButton('Ouvrir / Open', watchPartyUrl, demoMode, '🌐'),
  );

  const openLineFr = demoMode
    ? '🔒 **Ouvrir / Open** est désactivé en mode démo; aucune URL Watch Party configurée n’est publiée dans Discord.'
    : '🌐 Créez ou rejoignez une session avec **Ouvrir / Open**.';
  const openLineEn = demoMode
    ? '🔒 **Ouvrir / Open** is disabled in Demo Mode; no configured Watch Party URL is published to Discord.'
    : '🌐 Create or join a session with **Ouvrir / Open**.';

  const content = [
    '## 🎬 Watch Party',
    '',
    `🇫🇷 Regardez un film ensemble sur **${serverName}** avec **${botName}**.`,
    '🎲 Choisissez un film au hasard avec **Random / Aléatoire**.',
    '📅 Planifiez une soirée avec **Planifier / Schedule**.',
    openLineFr,
    '📋 Utilisez `/watchparty-upcoming` pour voir les soirées à venir.',
    'ℹ️ Utilisez `/watchparty-status` pour vérifier l’état du service Watch Party.',
    '',
    `🇬🇧 Watch a movie together on **${serverName}** with **${botName}**.`,
    '🎲 Let the bot choose a movie with **Random / Aléatoire**.',
    '📅 Plan your next movie night with **Planifier / Schedule**.',
    openLineEn,
    '📋 Use `/watchparty-upcoming` to see upcoming parties.',
    'ℹ️ Use `/watchparty-status` to check the Watch Party service.',
    '',
    '🔐 **Sécurité / Security**',
    `Votre mot de passe Emby est saisi uniquement dans Watch Party et n’est jamais envoyé à ${botName}.`,
    `Your Emby password is entered only in Watch Party and is never sent to ${botName}.`,
  ].join('\n');

  await channel.send({ content, components: [actionRow] });
  await interaction.reply({
    content: '✅ Watch Party panel published / Panneau Watch Party publié.',
    flags: MessageFlags.Ephemeral,
  });
}
