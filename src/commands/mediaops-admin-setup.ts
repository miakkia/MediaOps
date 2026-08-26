import {
  ChatInputCommandInteraction,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';

import { getMediaOpsBranding } from '../config/branding.js';

export const data = new SlashCommandBuilder()
  .setName('mediaops-admin-setup')
  .setDescription('Publish the MediaOps administrator diagnostics panel.')
  .setDescriptionLocalizations({ fr: 'Publier le panneau de diagnostic administrateur MediaOps.' })
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const channel = interaction.channel;
  if (!interaction.guildId || !channel || !channel.isSendable()) {
    await interaction.reply({
      content: '❌ Unable to publish the MediaOps admin panel in this channel.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const { botName } = getMediaOpsBranding();

  const content = [
    `## 🛠️ ${botName} — Admin`,
    '',
    '🔒 **Recommended / Recommandé:** publish this panel in a private administrator or moderator channel.',
    '',
    '❤️ `/health`',
    'FR: Vérifie MediaOps, le serveur média et le fournisseur de demandes. Utilisez-le après un déploiement, une mise à jour ou lorsqu’une fonction semble hors ligne.',
    'EN: Checks MediaOps, the media server, and the request provider. Use it after deployments, updates, or when a feature appears offline.',
    '',
    '🏓 `/ping`',
    'FR: Vérification rapide que le bot Discord répond. Utilisez-la pour distinguer un problème Discord/bot d’un problème avec un service externe.',
    'EN: Quick check that the Discord bot is responding. Use it to distinguish a Discord/bot problem from an external service problem.',
    '',
    '💡 **Diagnostic order / Ordre de diagnostic:** `/ping` → `/health` → container logs.',
    '⚠️ Ne publiez jamais de tokens, API keys, passwords ou URLs de webhook dans Discord / Never post tokens, API keys, passwords, or webhook URLs in Discord.',
  ].join('\n');

  await channel.send({ content });
  await interaction.reply({
    content: '✅ MediaOps admin panel published / Panneau administrateur MediaOps publié.',
    flags: MessageFlags.Ephemeral,
  });
}
