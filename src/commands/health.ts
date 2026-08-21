import {
  ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';

import {
  getInteractionLocale,
} from '../i18n/discord-locale.js';

import {
  buildInfo,
} from '../build-info.js';

import {
  t,
} from '../i18n/index.js';

import {
  mediaProvider,
} from '../providers/media-provider-instance.js';

import {
  requestProvider,
  requestProviderName,
} from '../providers/request-provider-instance.js';


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

  const lines: string[] = [
    t(
      locale,
      'health.botOnline',
    ),

    `MediaOps: ${buildInfo.version} • ${buildInfo.channel} • ${buildInfo.commit}`,
  ];

  try {
    const info =
      await mediaProvider.getSystemInfo();

    const serverName =
      info.serverName ??
      t(
        locale,
        'health.unknown',
      );

    const version =
      info.version ??
      t(
        locale,
        'health.unknown',
      );

    lines.push(
      t(
        locale,
        'health.embyOnline',
      ),

      `${t(
        locale,
        'health.server',
      )}: ${serverName}`,

      `${t(
        locale,
        'health.version',
      )}: ${version}`,
    );
  } catch (error) {
    console.error(
      'Media provider health check failed:',
      error,
    );

    lines.push(
      t(
        locale,
        'health.embyFailed',
      ),
    );
  }

  if (
    requestProviderName !== 'none'
  ) {
    lines.push(
      '',
      `Request Provider: ${requestProvider?.name ?? requestProviderName}`,
    );

    if (requestProvider) {
      try {
        await requestProvider.healthCheck();

        lines.push(
          `${requestProvider.name}: Online`,
        );
      } catch (error) {
        console.error(
          'Request provider health check failed:',
          error,
        );

        lines.push(
          `${requestProvider.name}: Unavailable`,
        );
      }
    } else {
      lines.push(
        `${requestProviderName}: Not configured`,
      );
    }
  }

  await interaction.reply({
    content:
      lines.join('\n'),

    flags:
      MessageFlags.Ephemeral,
  });
}
