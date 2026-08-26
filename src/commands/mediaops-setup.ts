import {
  ChatInputCommandInteraction,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';

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

  const botName = process.env.MEDIAOPS_BOT_NAME?.trim() || 'MediaOps Bot';
  const serverName = process.env.MEDIAOPS_SERVER_NAME?.trim() || 'My Media Server';

  const content = [
    `## 🎬 ${botName}`,
    `**${serverName} — Media commands / Commandes média**`,
    '',
    '🇫🇷 **Commandes utilisateur**',
    '🔎 `/movie` — Rechercher un film dans votre serveur média.',
    '📺 `/tv` — Rechercher une série.',
    '➕ `/request` — Rechercher et demander un film ou une série via le fournisseur de demandes configuré.',
    '🆕 `/latest` — Voir les ajouts récents.',
    '🎬 `/watchparty-setup` — Les administrateurs peuvent publier le panneau Watch Party dans le salon approprié.',
    '📋 `/watchparty-upcoming` — Voir les Watch Parties à venir.',
    '',
    '🇬🇧 **User commands**',
    '🔎 `/movie` — Search for a movie on your media server.',
    '📺 `/tv` — Search for a TV series.',
    '➕ `/request` — Search and request a movie or series through the configured request provider.',
    '🆕 `/latest` — See recently added media.',
    '🎬 `/watchparty-setup` — Administrators can publish the Watch Party panel in the appropriate channel.',
    '📋 `/watchparty-upcoming` — See upcoming Watch Parties.',
    '',
    '💡 Discord affiche aussi les options disponibles lorsque vous tapez `/` / Discord also shows available options when you type `/`.',
  ].join('\n');

  await channel.send({ content });
  await interaction.reply({
    content: '✅ MediaOps user panel published / Panneau utilisateur MediaOps publié.',
    flags: MessageFlags.Ephemeral,
  });
}
