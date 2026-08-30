import {
  ActionRowBuilder,
  ButtonBuilder,
} from 'discord.js';

import type {
  ScheduledWatchParty,
} from '../storage/watchparty-store.js';

import {
  createWatchPartyActiveRow,
  createWatchPartyRsvpRow,
} from './components.js';

import {
  t,
  type SupportedLocale,
} from '../i18n/index.js';

export interface WatchPartyMessageContent {
  content: string;
  components: ActionRowBuilder<ButtonBuilder>[];
}

export function buildScheduledWatchPartyMessage(
  party: ScheduledWatchParty,
  locale: SupportedLocale,
): WatchPartyMessageContent {
  const scheduledDate =
    new Date(party.scheduledAt);

  if (
    Number.isNaN(
      scheduledDate.getTime(),
    )
  ) {
    throw new Error(
      'Scheduled Watch Party date is invalid.',
    );
  }

  const timestamp =
    Math.floor(
      scheduledDate.getTime() / 1000,
    );

  const year =
    party.mediaYear !== undefined
      ? ` (${party.mediaYear})`
      : '';

  const goingParticipants =
    party.participants.filter(
      participant =>
        participant.response === 'going',
    );

  const notGoingParticipants =
    party.participants.filter(
      participant =>
        participant.response === 'not_going',
    );

  const goingText =
    goingParticipants.length > 0
      ? goingParticipants
          .map(
            participant =>
              `<@${participant.discordUserId}>`,
          )
          .join(', ')
      : '—';

  const notGoingText =
    notGoingParticipants.length > 0
      ? notGoingParticipants
          .map(
            participant =>
              `<@${participant.discordUserId}>`,
          )
          .join(', ')
      : '—';

  const isCancelled =
    party.status === 'cancelled';

  const isActive =
    party.status === 'active';

  const controlsDisabled =
    party.status !== 'scheduled' &&
    party.status !== 'ready';

  const cancelDisabled =
    party.status !== 'scheduled' &&
    party.status !== 'ready' &&
    party.status !== 'active';

  const title =
    isCancelled
      ? t(
          locale,
          'watchparty.cancel.title',
        )
      : t(
          locale,
          'watchparty.scheduling.title',
        );

  const cancellationNotice =
    isCancelled
      ? `\n\n${t(
          locale,
          'watchparty.cancel.notice',
        )}`
      : '';

  const content =
    `${title}\n\n` +

    `${t(
      locale,
      'watchparty.scheduling.movie',
    )}: **${party.mediaTitle}**${year}\n` +

    `${t(
      locale,
      'watchparty.scheduling.organizer',
    )}: <@${party.organizerDiscordId}>\n` +

    `${t(
      locale,
      'watchparty.scheduling.scheduledFor',
    )}: <t:${timestamp}:F>\n` +

    `${t(
      locale,
      'watchparty.scheduling.relativeTime',
    )}: <t:${timestamp}:R>\n\n` +

    `✅ ${t(
      locale,
      'watchparty.scheduling.going',
    )}: ${goingText}\n` +

    `❌ ${t(
      locale,
      'watchparty.scheduling.notGoing',
    )}: ${notGoingText}` +

    cancellationNotice;

  const buttonRow =
    isActive
      ? createWatchPartyActiveRow(
          party.id,
          locale === 'fr'
            ? 'Fermer la salle'
            : 'Close Room',
        )
      : createWatchPartyRsvpRow(
          party.id,

          t(
            locale,
            'watchparty.scheduling.going',
          ),

          t(
            locale,
            'watchparty.scheduling.notGoing',
          ),

          locale === 'fr'
            ? 'Démarrer maintenant'
            : 'Start Now',

          t(
            locale,
            'watchparty.cancel.button',
          ),

          controlsDisabled,
          cancelDisabled,
        );

  return {
    content,
    components: [
      buttonRow,
    ],
  };
}
