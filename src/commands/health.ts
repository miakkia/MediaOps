import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import { getMediaOpsBranding } from '../config/branding.js';
import { getInteractionLocale } from '../i18n/discord-locale.js';
import { t } from '../i18n/index.js';
import { mediaProvider } from '../providers/media-provider-instance.js';
import { requestProvider } from '../providers/request-provider-instance.js';

function getPackageVersion(): string {
  try {
    const currentDir = dirname(fileURLToPath(import.meta.url));
    const packagePath = resolve(currentDir, '../../package.json');
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf8')) as { version?: string };
    return packageJson.version ?? 'unknown';
  } catch {
    return 'unknown';
  }
}

async function checkRequestProvider(): Promise<{ provider: string; online: boolean; detail: string }> {
  if (!requestProvider) {
    return {
      provider: 'not configured',
      online: false,
      detail: 'not configured',
    };
  }

  try {
    await requestProvider.healthCheck();
    return {
      provider: requestProvider.name,
      online: true,
      detail: 'health check passed',
    };
  } catch (error) {
    console.error(`${requestProvider.name} health check failed:`, error);
    return {
      provider: requestProvider.name,
      online: false,
      detail: 'health check failed',
    };
  }
}

export const data = new SlashCommandBuilder()
  .setName('health')
  .setDescription(t('en', 'commands.health.description'))
  .setDescriptionLocalizations({ fr: t('fr', 'commands.health.description') })
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const locale = getInteractionLocale(interaction);
  const { botName } = getMediaOpsBranding();
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const version = getPackageVersion();
  const channel = process.env.MEDIAOPS_BUILD_CHANNEL?.trim() || process.env.NODE_ENV || 'unknown';
  const sha = process.env.MEDIAOPS_BUILD_SHA?.trim() || 'unknown';
  const shortSha = sha === 'unknown' ? sha : sha.slice(0, 8);
  const requestProviderStatus = await checkRequestProvider();

  let mediaOnline = false;
  let serverName = t(locale, 'health.unknown');
  let mediaVersion = t(locale, 'health.unknown');

  try {
    const info = await mediaProvider.getSystemInfo();
    mediaOnline = true;
    serverName = info.serverName ?? serverName;
    mediaVersion = info.version ?? mediaVersion;
  } catch (error) {
    console.error(`${mediaProvider.name} health check failed:`, error);
  }

  const botAvatar = interaction.client.user?.displayAvatarURL({ size: 256 });
  const isFrench = locale === 'fr';
  const embed = new EmbedBuilder()
    .setTitle(isFrench ? 'État de santé MediaOps' : 'MediaOps Health')
    .setDescription(t(locale, 'health.botOnline', { botName }))
    .addFields(
      {
        name: 'MediaOps',
        value: `✅ ${isFrench ? 'En ligne' : 'Online'}\nVersion: \`${version}\`\n${isFrench ? 'Canal' : 'Channel'}: \`${channel}\`\nSHA: \`${shortSha}\``,
        inline: false,
      },
      {
        name: mediaProvider.name,
        value: `${mediaOnline ? '✅' : '❌'} ${mediaOnline ? (isFrench ? 'En ligne' : 'Online') : (isFrench ? 'Hors ligne' : 'Offline')}\n${isFrench ? 'Serveur' : 'Server'}: \`${serverName}\`\nVersion: \`${mediaVersion}\``,
        inline: false,
      },
      {
        name: isFrench ? 'Fournisseur de requêtes' : 'Request Provider',
        value: `${requestProviderStatus.online ? '✅' : '❌'} ${requestProviderStatus.online ? (isFrench ? 'En ligne' : 'Online') : (isFrench ? 'Hors ligne' : 'Offline')}\nProvider: \`${requestProviderStatus.provider}\`\nCheck: \`${requestProviderStatus.detail}\``,
        inline: false,
      },
    )
    .setTimestamp();

  if (botAvatar) embed.setThumbnail(botAvatar);
  await interaction.editReply({ embeds: [embed] });
}
