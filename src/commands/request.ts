import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';

import type {
  RequestMediaType,
  RequestSearchResult,
} from '../providers/request-provider.js';
import { requestProvider } from '../providers/request-provider-instance.js';
import {
  storeRequestSelection,
} from '../request/request-selection-store.js';

export const data = new SlashCommandBuilder()
  .setName('request')
  .setDescription('Search for a movie or TV series to request.')
  .setDescriptionLocalizations({ fr: 'Rechercher un film ou une série à demander.' })
  .addStringOption(option =>
    option
      .setName('type')
      .setDescription('Media type to search for.')
      .setDescriptionLocalizations({ fr: 'Type de média à rechercher.' })
      .setRequired(true)
      .addChoices(
        { name: 'Movie', name_localizations: { fr: 'Film' }, value: 'movie' },
        { name: 'TV Series', name_localizations: { fr: 'Série TV' }, value: 'series' },
      ),
  )
  .addStringOption(option =>
    option
      .setName('title')
      .setDescription('Movie or series title.')
      .setDescriptionLocalizations({ fr: 'Titre du film ou de la série.' })
      .setRequired(true),
  );

function getStatusLabel(item: RequestSearchResult): string {
  if (item.available) return '✅ Available';
  if (item.requested) return '📨 Requested';
  return '➕ Requestable';
}

function formatResult(item: RequestSearchResult, index: number): string {
  const year = item.year !== undefined ? ` (${item.year})` : '';
  return `**${index + 1}. ${item.title}**${year}\n${getStatusLabel(item)}`;
}

export async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  if (!requestProvider) {
    await interaction.reply({
      content: '❌ No request provider is configured.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const mediaType = interaction.options.getString('type', true) as RequestMediaType;
  const title = interaction.options.getString('title', true).trim();

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  try {
    const results = await requestProvider.search(title, mediaType);
    if (results.length === 0) {
      await interaction.editReply(`🔎 No results found for **${title}**.`);
      return;
    }

    const displayedResults = results.slice(0, 5);
    const buttons = displayedResults.map((item, index) => {
      const requestable = !item.available && !item.requested;
      const token = requestable
        ? storeRequestSelection(interaction.user.id, item)
        : undefined;

      return new ButtonBuilder()
        .setCustomId(
          token
            ? `request-select-token:${token}`
            : `request-disabled:${index + 1}`,
        )
        .setLabel(
          item.available
            ? `#${index + 1} Available`
            : item.requested
              ? `#${index + 1} Requested`
              : `Request #${index + 1}`,
        )
        .setStyle(requestable ? ButtonStyle.Primary : ButtonStyle.Secondary)
        .setDisabled(!requestable);
    });

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(buttons);
    await interaction.editReply({
      content:
        `🔎 **${requestProvider.name} search results**\n\n` +
        displayedResults.map(formatResult).join('\n\n'),
      components: [row],
    });
  } catch (error) {
    console.error('Request provider search failed:', error);
    await interaction.editReply('❌ Unable to search the request provider right now.');
  }
}
