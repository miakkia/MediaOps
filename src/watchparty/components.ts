import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';

const CUSTOM_ID_PREFIX = 'watchparty';

export type WatchPartyRsvpAction =
  | 'going'
  | 'not_going';

export type WatchPartyAction =
  | WatchPartyRsvpAction
  | 'start_early'
  | 'cancel';

export interface WatchPartyRsvpCustomId {
  action: WatchPartyRsvpAction;
  partyId: string;
}

export interface WatchPartyStartEarlyCustomId {
  action: 'start_early';
  partyId: string;
}

export interface WatchPartyCancelCustomId {
  action: 'cancel';
  partyId: string;
}

export function createWatchPartyRsvpRow(
  partyId: string,
  goingLabel = 'I’m going',
  notGoingLabel = 'I’m not going',
  startEarlyLabel = 'Start Now',
  cancelLabel = 'Cancel Watch Party',
  disabled = false,
): ActionRowBuilder<ButtonBuilder> {
  const goingButton =
    new ButtonBuilder()
      .setCustomId(
        createCustomId(
          partyId,
          'going',
        ),
      )
      .setLabel(goingLabel)
      .setEmoji('✅')
      .setStyle(ButtonStyle.Success)
      .setDisabled(disabled);

  const notGoingButton =
    new ButtonBuilder()
      .setCustomId(
        createCustomId(
          partyId,
          'not_going',
        ),
      )
      .setLabel(notGoingLabel)
      .setEmoji('❌')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled);

  const startEarlyButton =
    new ButtonBuilder()
      .setCustomId(
        createCustomId(
          partyId,
          'start_early',
        ),
      )
      .setLabel(startEarlyLabel)
      .setEmoji('▶️')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(disabled);

  const cancelButton =
    new ButtonBuilder()
      .setCustomId(
        createCustomId(
          partyId,
          'cancel',
        ),
      )
      .setLabel(cancelLabel)
      .setEmoji('🛑')
      .setStyle(ButtonStyle.Danger)
      .setDisabled(disabled);

  return new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      goingButton,
      notGoingButton,
      startEarlyButton,
      cancelButton,
    );
}

export function parseWatchPartyRsvpCustomId(
  customId: string,
): WatchPartyRsvpCustomId | undefined {
  const parsed =
    parseCustomId(customId);

  if (!parsed) {
    return undefined;
  }

  if (
    parsed.action !== 'going' &&
    parsed.action !== 'not_going'
  ) {
    return undefined;
  }

  return {
    action: parsed.action,
    partyId: parsed.partyId,
  };
}

export function parseWatchPartyStartEarlyCustomId(
  customId: string,
): WatchPartyStartEarlyCustomId | undefined {
  const parsed =
    parseCustomId(customId);

  if (
    !parsed ||
    parsed.action !== 'start_early'
  ) {
    return undefined;
  }

  return {
    action: 'start_early',
    partyId: parsed.partyId,
  };
}

export function parseWatchPartyCancelCustomId(
  customId: string,
): WatchPartyCancelCustomId | undefined {
  const parsed =
    parseCustomId(customId);

  if (
    !parsed ||
    parsed.action !== 'cancel'
  ) {
    return undefined;
  }

  return {
    action: 'cancel',
    partyId: parsed.partyId,
  };
}

function parseCustomId(
  customId: string,
): {
  action: WatchPartyAction;
  partyId: string;
} | undefined {
  const parts =
    customId.split(':');

  if (parts.length !== 4) {
    return undefined;
  }

  const [
    prefix,
    category,
    action,
    partyId,
  ] = parts;

  if (
    prefix !== CUSTOM_ID_PREFIX ||
    category !== 'rsvp' ||
    !partyId
  ) {
    return undefined;
  }

  if (
    action !== 'going' &&
    action !== 'not_going' &&
    action !== 'start_early' &&
    action !== 'cancel'
  ) {
    return undefined;
  }

  return {
    action,
    partyId,
  };
}

function createCustomId(
  partyId: string,
  action: WatchPartyAction,
): string {
  const customId =
    `${CUSTOM_ID_PREFIX}:rsvp:${action}:${partyId}`;

  if (customId.length > 100) {
    throw new Error(
      'Watch Party interaction custom ID exceeds Discord limits.',
    );
  }

  return customId;
}
