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
import { createWatchPartyJoinRow } from '../watchparty/components.js';

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

  const controlsRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
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
  );

  const openRow = createWatchPartyJoinRow(
    'Ouvrir / Open',
    watchPartyUrl,
    demoMode,
  );
  const openButton = openRow.components[0];
  openButton.setEmoji('🌐');
  controlsRow.addComponents(openButton);

  const demoNotice = demoMode
    ? [
        '',
        '🔒 **Mode démo / Demo mode**',
        'Le lien Watch Party est volontairement désactivé et aucune URL configurée n’est publiée dans Discord.',
        'The Watch Party link is intentionally disabled and no configured URL is published to Discord.',
      ]
    : [];

  const content = [
    '## 🎬 Watch Party',
    '',
    `🇫🇷 Regardez un film ensemble sur **${serverName}** avec **${botName}**.`,
    '🎲 Choisissez un film au hasard avec **Random / Aléatoire**.',
    '📅 Planifiez une soirée avec **Planifier / Schedule**.',
    '🌐 Créez ou rejoignez une session avec **Ouvrir / Open**.',
    '📋 Utilisez `/watchparty-upcoming` pour voir les soirées à venir.',
    'ℹ️ Utilisez `/watchparty-status` pour vérifier l’état du service Watch Party.',
    '',
    `🇬🇧 Watch a movie together on **${serverName}** with **${botName}**.`,
    '🎲 Let the bot choose a movie with **Random / Aléatoire**.',
    '📅 Plan your next movie night with **Planifier / Schedule**.',
    '🌐 Create or join a session with **Ouvrir / Open**.',
    '📋 Use `/watchparty-upcoming` to see upcoming parties.',
    'ℹ️ Use `/watchparty-status` to check the Watch Party service.',
    '',
    '🔐 **Sécurité / Security**',
    `Votre mot de passe Emby est saisi uniquement dans Watch Party et n’est jamais envoyé à ${botName}.`,
    `Your Emby password is entered only in Watch Party and is never sent to ${botName}.`,
    ...demoNotice,
  ].join('\n');

  await channel.send({ content, components: [controlsRow] });
  await interaction.reply({
    content: '✅ Watch Party panel published / Panneau Watch Party publié.',
    flags: MessageFlags.Ephemeral,
  });
}
