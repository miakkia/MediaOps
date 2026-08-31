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
import { requestProvider } from '../providers/request-provider-instance.js';
import { saveTrackedRequest } from '../storage/request-tracking-store.js';
import {
  consumeRequestSelection,
  getRequestSelection,
} from './request-selection-store.js';

const SELECT_PREFIX = 'request-select:';
const CONFIRM_PREFIX = 'request-confirm:';
const CANCEL_PREFIX = 'request-cancel:';

const SELECT_TOKEN_PREFIX = 'request-select-token:';
const CONFIRM_TOKEN_PREFIX = 'request-confirm-token:';
const CANCEL_TOKEN_PREFIX = 'request-cancel-token:';

export function parseRequestCustomId(
  customId: string,
  prefix: string,
): { mediaType: RequestMediaType; providerId: string } | undefined {
  if (!customId.startsWith(prefix)) return undefined;

  const [mediaType, providerId] = customId.slice(prefix.length).split(':');
  if (
    (mediaType !== 'movie' && mediaType !== 'series') ||
    !providerId
  ) {
    return undefined;
  }

  return { mediaType, providerId };
}

function parseTokenCustomId(
  customId: string,
  prefix: string,
): string | undefined {
  if (!customId.startsWith(prefix)) return undefined;
  const token = customId.slice(prefix.length).trim();
  return token || undefined;
}

function createMinimalItem(
  mediaType: RequestMediaType,
  providerId: string,
): RequestSearchResult {
  return {
    providerId,
    mediaType,
    title: 'Selected media',
    originalTitle: undefined,
    year: undefined,
    overview: undefined,
    posterUrl: undefined,
    status: 'unavailable',
    requested: false,
    available: false,
  };
}

function formatMediaTitle(item: RequestSearchResult): string {
  return item.year !== undefined ? `${item.title} (${item.year})` : item.title;
}

function buildConfirmRow(
  confirmCustomId: string,
  cancelCustomId: string,
): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(confirmCustomId)
      .setLabel('Confirm request')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(cancelCustomId)
      .setLabel('Cancel')
      .setStyle(ButtonStyle.Secondary),
  );
}

function formatSubmissionStatus(
  providerName: string,
  status: string,
  message: string | undefined,
): string {
  if (message) {
    return status === 'approved'
      ? `✅ ${message}`
      : `🕒 ${message}`;
  }

  return status === 'approved'
    ? `✅ Request submitted and approved by ${providerName}.`
    : `🕒 Request submitted to ${providerName}.`;
}

async function submitRequest(
  interaction: ButtonInteraction,
  item: RequestSearchResult,
): Promise<boolean> {
  if (!requestProvider) {
    await interaction.update({
      content: '❌ No request provider is configured.',
      components: [],
    });
    return true;
  }

  const provider = requestProvider;
  await interaction.deferUpdate();

  try {
    const result = await provider.request(item, {
      requester: {
        source: 'discord',
        id: interaction.user.id,
      },
    });

    if (!result.success) {
      await interaction.editReply({
        content: `❌ ${result.message ?? `Unable to submit the request to ${provider.name}.`}`,
        components: [],
      });
      return true;
    }

    if (result.providerRequestId) {
      const now = new Date().toISOString();
      await saveTrackedRequest({
        providerRequestId: result.providerRequestId,
        providerId: item.providerId,
        mediaType: item.mediaType,
        title: item.title,
        year: item.year,
        discordUserId: interaction.user.id,
        status: result.status,
        createdAt: now,
        updatedAt: now,
        availableNotifiedAt: undefined,
      });
    }

    const statusLabel = formatSubmissionStatus(
      provider.name,
      result.status,
      result.message,
    );

    const requestId = result.providerRequestId
      ? `\n${provider.name} Request ID: \`${result.providerRequestId}\``
      : '';

    await interaction.editReply({
      content: `**${formatMediaTitle(item)}**\n${statusLabel}${requestId}`,
      components: [],
    });
  } catch (error) {
    console.error(`${provider.name} request submission failed:`, error);
    await interaction.editReply({
      content: `❌ Unable to submit the request to ${provider.name} right now.`,
      components: [],
    });
  }

  return true;
}

export async function handleRequestButton(
  interaction: ButtonInteraction,
): Promise<boolean> {
  const selectedToken = parseTokenCustomId(interaction.customId, SELECT_TOKEN_PREFIX);

  if (selectedToken) {
    const item = getRequestSelection(selectedToken, interaction.user.id);

    if (!item) {
      await interaction.reply({
        content: '⌛ This request selection expired. Run `/request` again.',
        flags: MessageFlags.Ephemeral,
      });
      return true;
    }

    await interaction.reply({
      content:
        item.mediaType === 'movie'
          ? `⚠️ Confirm request for **${formatMediaTitle(item)}**.`
          : `⚠️ Confirm request for **${formatMediaTitle(item)}**. All available seasons will be requested.`,
      components: [
        buildConfirmRow(
          `${CONFIRM_TOKEN_PREFIX}${selectedToken}`,
          `${CANCEL_TOKEN_PREFIX}${selectedToken}`,
        ),
      ],
      flags: MessageFlags.Ephemeral,
    });
    return true;
  }

  const cancelledToken = parseTokenCustomId(interaction.customId, CANCEL_TOKEN_PREFIX);
  if (cancelledToken) {
    consumeRequestSelection(cancelledToken, interaction.user.id);
    await interaction.update({ content: '❎ Request cancelled.', components: [] });
    return true;
  }

  const confirmedToken = parseTokenCustomId(interaction.customId, CONFIRM_TOKEN_PREFIX);
  if (confirmedToken) {
    const item = consumeRequestSelection(confirmedToken, interaction.user.id);

    if (!item) {
      await interaction.update({
        content: '⌛ This request selection expired. Run `/request` again.',
        components: [],
      });
      return true;
    }

    return submitRequest(interaction, item);
  }

  // Legacy custom IDs are still accepted so buttons created by an older
  // MediaOps build continue working during rolling updates.
  const selected = parseRequestCustomId(interaction.customId, SELECT_PREFIX);

  if (selected) {
    if (!requestProvider) {
      await interaction.reply({
        content: '❌ No request provider is configured.',
        flags: MessageFlags.Ephemeral,
      });
      return true;
    }

    await interaction.reply({
      content:
        selected.mediaType === 'movie'
          ? `⚠️ Confirm that you want to submit this movie request to ${requestProvider.name}.`
          : `⚠️ Confirm that you want to request all available seasons of this TV series from ${requestProvider.name}.`,
      components: [
        buildConfirmRow(
          `${CONFIRM_PREFIX}${selected.mediaType}:${selected.providerId}`,
          `${CANCEL_PREFIX}${selected.mediaType}:${selected.providerId}`,
        ),
      ],
      flags: MessageFlags.Ephemeral,
    });
    return true;
  }

  const cancelled = parseRequestCustomId(interaction.customId, CANCEL_PREFIX);
  if (cancelled) {
    await interaction.update({ content: '❎ Request cancelled.', components: [] });
    return true;
  }

  const confirmed = parseRequestCustomId(interaction.customId, CONFIRM_PREFIX);
  if (!confirmed) return false;

  return submitRequest(
    interaction,
    createMinimalItem(confirmed.mediaType, confirmed.providerId),
  );
}
