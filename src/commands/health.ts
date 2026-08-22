import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';
import {
  readFileSync,
} from 'node:fs';
import {
  fileURLToPath,
} from 'node:url';
import {
  dirname,
  resolve,
} from 'node:path';

import {
  getInteractionLocale,
} from '../i18n/discord-locale.js';

import {
  t,
} from '../i18n/index.js';

import {
  mediaProvider,
} from '../providers/media-provider-instance.js';

const HEALTH_TIMEOUT_MS = 5_000;

function getPackageVersion(): string {
  try {
    const currentDir =
      dirname(
        fileURLToPath(import.meta.url),
      );

    const packagePath =
      resolve(
        currentDir,
        '../../package.json',
      );

    const packageJson =
      JSON.parse(
        readFileSync(
          packagePath,
          'utf8',
        ),
      ) as {
        version?: string;
      };

    return packageJson.version ?? 'unknown';
  } catch {
    return 'unknown';
  }
}

async function checkRequestProvider(): Promise<{
  provider: string;
  online: boolean;
  detail: string;
}> {
  const provider =
    process.env.REQUEST_PROVIDER?.trim().toLowerCase() ||
    'not configured';

  const providerUrl =
    provider === 'ombi'
      ? process.env.OMBI_URL?.trim()
      : undefined;

  if (!providerUrl) {
    return {
      provider,
      online: false,
      detail: 'URL not configured',
    };
  }

  try {
    const response =
      await fetch(
        providerUrl,
        {
          method: 'GET',
          redirect: 'follow',
          signal:
            AbortSignal.timeout(
              HEALTH_TIMEOUT_MS,
            ),
        },
      );

    return {
      provider,
      online: response.ok,
      detail:
        response.ok
          ? `HTTP ${response.status}`
          : `HTTP ${response.status}`,
    };
  } catch (error) {
    if (
      error instanceof DOMException &&
      error.name === 'TimeoutError'
    ) {
      return {
        provider,
        online: false,
        detail: 'timeout',
      };
    }

    return {
      provider,
      online: false,
      detail: 'unreachable',
    };
  }
}

export const data =
  new SlashCommandBuilder()
    .setName('health')
    .setDescription(
      t(
        'en',
        'commands.health.description',
      ),
    )
    .setDescriptionLocalizations({
      fr:
        t(
          'fr',
          'commands.health.description',
        ),
    });

export async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const locale =
    getInteractionLocale(
      interaction,
    );

  await interaction.deferReply({
    flags:
      MessageFlags.Ephemeral,
  });

  const version =
    getPackageVersion();
  const channel =
    process.env.MEDIAOPS_BUILD_CHANNEL?.trim() ||
    process.env.NODE_ENV ||
    'unknown';
  const sha =
    process.env.MEDIAOPS_BUILD_SHA?.trim() ||
    'unknown';
  const shortSha =
    sha === 'unknown'
      ? sha
      : sha.slice(0, 8);

  const requestProvider =
    await checkRequestProvider();

  let embyOnline = false;
  let serverName =
    t(
      locale,
      'health.unknown',
    );
  let embyVersion =
    t(
      locale,
      'health.unknown',
    );

  try {
    const info =
      await mediaProvider.getSystemInfo();

    embyOnline = true;
    serverName =
      info.serverName ??
      serverName;
    embyVersion =
      info.version ??
      embyVersion;
  } catch (error) {
    console.error(
      'Emby health check failed:',
      error,
    );
  }

  const botAvatar =
    interaction.client.user?.displayAvatarURL({
      size: 256,
    });

  const isFrench =
    locale === 'fr';

  const embed =
    new EmbedBuilder()
      .setTitle(
        isFrench
          ? 'État de santé MediaOps'
          : 'MediaOps Health',
      )
      .setDescription(
        `${t(
          locale,
          'health.botOnline',
        )}`,
      )
      .addFields(
        {
          name: 'MediaOps',
          value:
            `✅ ${isFrench ? 'En ligne' : 'Online'}\n` +
            `Version: \`${version}\`\n` +
            `${isFrench ? 'Canal' : 'Channel'}: \`${channel}\`\n` +
            `SHA: \`${shortSha}\``,
          inline: false,
        },
        {
          name: 'Emby',
          value:
            `${embyOnline ? '✅' : '❌'} ` +
            `${embyOnline ? (isFrench ? 'En ligne' : 'Online') : (isFrench ? 'Hors ligne' : 'Offline')}\n` +
            `${isFrench ? 'Serveur' : 'Server'}: \`${serverName}\`\n` +
            `Version: \`${embyVersion}\``,
          inline: false,
        },
        {
          name:
            isFrench
              ? 'Fournisseur de requêtes'
              : 'Request Provider',
          value:
            `${requestProvider.online ? '✅' : '❌'} ` +
            `${requestProvider.online ? (isFrench ? 'En ligne' : 'Online') : (isFrench ? 'Hors ligne' : 'Offline')}\n` +
            `Provider: \`${requestProvider.provider}\`\n` +
            `Check: \`${requestProvider.detail}\``,
          inline: false,
        },
      )
      .setTimestamp();

  if (botAvatar) {
    embed.setThumbnail(
      botAvatar,
    );
  }

  await interaction.editReply({
    embeds: [
      embed,
    ],
  });
}
