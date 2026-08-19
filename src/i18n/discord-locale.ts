import type {
  ChatInputCommandInteraction,
  Interaction,
} from 'discord.js';

import {
  normalizeLocale,
  type SupportedLocale,
} from './index.js';

export function getInteractionLocale(
  interaction:
    | Interaction
    | ChatInputCommandInteraction,
): SupportedLocale {
  const guildLocale =
    'guildLocale' in interaction
      ? interaction.guildLocale
      : null;

  if (guildLocale) {
    return normalizeLocale(
      guildLocale,
    );
  }

  return normalizeLocale(
    interaction.locale,
  );
}