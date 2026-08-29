import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';

const RANDOM_BUTTON_ID = 'watchpartysetup:random';
const SCHEDULE_BUTTON_ID = 'watchpartysetup:schedule';
const DEMO_OPEN_BUTTON_ID = 'watchpartysetup:demo:open';

export function createWatchPartySetupRow(
  demoMode: boolean,
  watchPartyUrl?: string,
): ActionRowBuilder<ButtonBuilder> {
  const openButton = new ButtonBuilder()
    .setLabel('Ouvrir / Open')
    .setEmoji('🌐');

  if (demoMode) {
    openButton
      .setCustomId(DEMO_OPEN_BUTTON_ID)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true);
  } else {
    if (!watchPartyUrl) {
      throw new Error('Watch Party URL is required outside demo mode.');
    }

    openButton
      .setStyle(ButtonStyle.Link)
      .setURL(watchPartyUrl);
  }

  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(RANDOM_BUTTON_ID)
      .setLabel('Random / Aléatoire')
      .setEmoji('🎲')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(SCHEDULE_BUTTON_ID)
      .setLabel('Planifier / Schedule')
      .setEmoji('📅')
      .setStyle(ButtonStyle.Primary),
    openButton,
  );
}
