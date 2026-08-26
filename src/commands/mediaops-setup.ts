import {
  ChatInputCommandInteraction,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';

import { getMediaOpsBranding } from '../config/branding.js';

export const data = new SlashCommandBuilder()
  .setName('mediaops-setup')
  .setDescription('Publish the MediaOps user command panel in this channel.')
  .setDescriptionLocalizations({ fr: 'Publier le panneau utilisateur MediaOps dans ce salon.' })
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const channel = interaction.channel;
  if (!interaction.guildId || !channel || !channel.isSendable()) {
    await interaction.reply({
      content: '❌ Unable to publish the MediaOps panel in this channel.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const { botName, serverName } = getMediaOpsBranding();

  const content = [
    `## 🎬 ${botName}`,
    `**${serverName} — Media commands / Commandes média**`,
    '',
    '🇫🇷 **Commandes utilisateur**',
    '🔎 `/movie` — Rechercher un film dans votre serveur média.',
    '📺 `/tv` — Rechercher une série.',
    '➕ `/request` — Rechercher et demander un film ou une série via le fournisseur de demandes configuré.',
    '🆕 `/latest` — Voir les ajouts récents.',
    '📋 `/watchparty-upcoming` — Voir les Watch Parties à venir.',
    'ℹ️ `/watchparty-status` — Vérifier une session Watch Party.',
    '🎬 Le panneau Watch Party complet peut être publié par un administrateur avec `/watchparty-setup`.',
    '',
    '🇬🇧 **User commands**',
    '🔎 `/movie` — Search for a movie on your media server.',
    '📺 `/tv` — Search for a TV series.',
    '➕ `/request` — Search and request a movie or series through the configured request provider.',
    '🆕 `/latest` — See recently added media.',
    '📋 `/watchparty-upcoming` — See upcoming Watch Parties.',
    'ℹ️ `/watchparty-status` — Check a Watch Party session.',
    '🎬 Administrators can publish the full Watch Party panel with `/watchparty-setup`.',
    '',
    '💡 Discord affiche aussi les options disponibles lorsque vous tapez `/` / Discord also shows available options when you type `/`.',
  ].join('\n');

  await channel.send({ content });
  await interaction.reply({
    content: '✅ MediaOps user panel published / Panneau utilisateur MediaOps publié.',
    flags: MessageFlags.Ephemeral,
  });
}
