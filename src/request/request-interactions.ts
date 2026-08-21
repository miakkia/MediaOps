import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  MessageFlags,
} from 'discord.js';

import type {
  RequestMediaType,
  RequestSearchResult,
} from '../providers/request-provider.js';

import {
  requestProvider,
} from '../providers/request-provider-instance.js';

const SELECT_PREFIX =
  'request-select:';

const CONFIRM_PREFIX =
  'request-confirm:';

const CANCEL_PREFIX =
  'request-cancel:';

function parseCustomId(
  customId: string,
  prefix: string,
): {
  mediaType: RequestMediaType;
  providerId: string;
} | undefined {
  if (
    !customId.startsWith(prefix)
  ) {
    return undefined;
  }

  const payload =
    customId.slice(
      prefix.length,
    );

  const [
    mediaType,
    providerId,
  ] =
    payload.split(':');

  if (
    (
      mediaType !== 'movie' &&
      mediaType !== 'series'
    ) ||
    !providerId
  ) {
    return undefined;
  }

  return {
    mediaType,
    providerId,
  };
}

function createMinimalItem(
  mediaType: RequestMediaType,
  providerId: string,
): RequestSearchResult {
  return {
    providerId,
    mediaType,
    title:
      'Selected media',
    originalTitle:
      undefined,
    year:
      undefined,
    overview:
      undefined,
    posterUrl:
      undefined,
    status:
      'unavailable',
    requested:
      false,
    available:
      false,
  };
}

export async function handleRequestButton(
  interaction: ButtonInteraction,
): Promise<boolean> {
  const selected =
    parseCustomId(
      interaction.customId,
      SELECT_PREFIX,
    );

  if (selected) {
    const confirmRow =
      new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(
              `${CONFIRM_PREFIX}${selected.mediaType}:${selected.providerId}`,
            )
            .setLabel(
              'Confirm request',
            )
            .setStyle(
              ButtonStyle.Success,
            ),

          new ButtonBuilder()
            .setCustomId(
              `${CANCEL_PREFIX}${selected.mediaType}:${selected.providerId}`,
            )
            .setLabel(
              'Cancel',
            )
            .setStyle(
              ButtonStyle.Secondary,
            ),
        );

    await interaction.reply({
      content:
        selected.mediaType === 'movie'
          ? '⚠️ Confirm that you want to submit this movie request to Ombi.'
          : '⚠️ Confirm that you want to request all available seasons of this TV series from Ombi.',

      components: [
        confirmRow,
      ],

      flags:
        MessageFlags.Ephemeral,
    });

    return true;
  }

  const cancelled =
    parseCustomId(
      interaction.customId,
      CANCEL_PREFIX,
    );

  if (cancelled) {
    await interaction.update({
      content:
        '❎ Request cancelled.',

      components: [],
    });

    return true;
  }

  const confirmed =
    parseCustomId(
      interaction.customId,
      CONFIRM_PREFIX,
    );

  if (!confirmed) {
    return false;
  }

  if (!requestProvider) {
    await interaction.update({
      content:
        '❌ No request provider is configured.',

      components: [],
    });

    return true;
  }

  await interaction.deferUpdate();

  try {
    const item =
      createMinimalItem(
        confirmed.mediaType,
        confirmed.providerId,
      );

    const result =
      await requestProvider.request(
        item,
        {
          requester: {
            source:
              'discord',

            id:
              interaction.user.id,
          },
        },
      );

    if (!result.success) {
      await interaction.editReply({
        content:
          `❌ ${result.message ?? 'Unable to submit the request.'}`,

        components: [],
      });

      return true;
    }

    const statusLabel =
      result.status === 'approved'
        ? '✅ Request submitted and automatically approved.'
        : '✅ Request submitted to Ombi and awaiting approval.';

    const requestId =
      result.providerRequestId
        ? `\nOmbi Request ID: \`${result.providerRequestId}\``
        : '';

    await interaction.editReply({
      content:
        statusLabel +
        requestId,

      components: [],
    });
  } catch (error) {
    console.error(
      'Ombi request submission failed:',
      error,
    );

    await interaction.editReply({
      content:
        '❌ Unable to submit the request to Ombi right now.',

      components: [],
    });
  }

  return true;
}
