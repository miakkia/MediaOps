import {
  ButtonInteraction,
  MessageFlags,
} from 'discord.js';

import {
  getInteractionLocale,
} from '../i18n/discord-locale.js';

import {
  t,
} from '../i18n/index.js';

import {
  findWatchPartyById,
  setParticipantResponse,
  setWatchPartyStatus,
} from '../storage/watchparty-store.js';

import {
  parseWatchPartyCancelCustomId,
  parseWatchPartyRsvpCustomId,
} from './components.js';

import {
  cancelDiscordScheduledEventForParty,
} from './discord-events.js';

import {
  buildScheduledWatchPartyMessage,
} from './message.js';

export async function handleWatchPartyButton(
  interaction: ButtonInteraction,
): Promise<boolean> {
  const cancelInteraction =
    parseWatchPartyCancelCustomId(
      interaction.customId,
    );

  const rsvpInteraction =
    parseWatchPartyRsvpCustomId(
      interaction.customId,
    );

  if (
    !cancelInteraction &&
    !rsvpInteraction
  ) {
    return false;
  }

  const locale =
    getInteractionLocale(
      interaction,
    );

  await interaction.deferReply({
    flags: MessageFlags.Ephemeral,
  });

  try {
    const partyId =
      cancelInteraction?.partyId ??
      rsvpInteraction?.partyId;

    if (!partyId) {
      return false;
    }

    const party =
      await findWatchPartyById(
        partyId,
      );

    if (!party) {
      await interaction.editReply(
        t(
          locale,
          'watchparty.rsvp.partyMissing',
        ),
      );

      return true;
    }

    if (
      party.guildId !== interaction.guildId ||
      party.channelId !== interaction.channelId ||
      party.messageId !== interaction.message.id
    ) {
      await interaction.editReply(
        t(
          locale,
          'watchparty.rsvp.invalidChannel',
        ),
      );

      return true;
    }

    if (cancelInteraction) {
      if (
        interaction.user.id !==
        party.organizerDiscordId
      ) {
        await interaction.editReply(
          t(
            locale,
            'watchparty.cancel.organizerOnly',
          ),
        );

        return true;
      }

      if (party.status === 'cancelled') {
        await interaction.editReply(
          t(
            locale,
            'watchparty.cancel.alreadyCancelled',
          ),
        );

        return true;
      }

      if (
        party.status !== 'scheduled' &&
        party.status !== 'ready' &&
        party.status !== 'active'
      ) {
        await interaction.editReply(
          t(
            locale,
            'watchparty.cancel.unavailable',
          ),
        );

        return true;
      }

      const cancelledParty =
        await setWatchPartyStatus(
          party.id,
          'cancelled',
        );

      // Discord Scheduled Events are supplementary. Their API state must never
      // prevent the existing Watch Party cancellation from succeeding.
      if (interaction.guild) {
        await cancelDiscordScheduledEventForParty(
          interaction.guild,
          party.id,
        );
      }

      // A cancelled Watch Party no longer needs a public RSVP post. Keep the
      // persisted party record for history/auditing, but remove the Discord
      // message so the channel only contains active/relevant Watch Parties.
      try {
        await interaction.message.delete();
      } catch (error) {
        console.error(
          'Failed to delete cancelled Watch Party message:',
          error,
        );

        // Fall back to the previous behaviour so cancellation still succeeds
        // even if Discord refuses message deletion for any reason.
        const renderedMessage =
          buildScheduledWatchPartyMessage(
            cancelledParty,
            locale,
          );

        await interaction.message.edit({
          content:
            renderedMessage.content,

          components:
            renderedMessage.components,
        });
      }

      await interaction.editReply(
        t(
          locale,
          'watchparty.cancel.confirmed',
          {
            title:
              cancelledParty.mediaTitle,
          },
        ),
      );

      return true;
    }

    if (!rsvpInteraction) {
      return false;
    }

    if (
      party.status !== 'scheduled' &&
      party.status !== 'ready'
    ) {
      await interaction.editReply(
        t(
          locale,
          'watchparty.rsvp.closed',
        ),
      );

      return true;
    }

    const scheduledTime =
      new Date(
        party.scheduledAt,
      ).getTime();

    if (
      Number.isNaN(scheduledTime) ||
      scheduledTime <= Date.now()
    ) {
      await interaction.editReply(
        t(
          locale,
          'watchparty.rsvp.started',
        ),
      );

      return true;
    }

    const updatedParty =
      await setParticipantResponse(
        party.id,
        interaction.user.id,
        rsvpInteraction.action,
      );

    const renderedMessage =
      buildScheduledWatchPartyMessage(
        updatedParty,
        locale,
      );

    await interaction.message.edit({
      content:
        renderedMessage.content,

      components:
        renderedMessage.components,
    });

    if (
      rsvpInteraction.action === 'going'
    ) {
      await interaction.editReply(
        t(
          locale,
          'watchparty.rsvp.goingConfirmed',
          {
            title:
              updatedParty.mediaTitle,
          },
        ),
      );

      return true;
    }

    await interaction.editReply(
      t(
        locale,
        'watchparty.rsvp.notGoingConfirmed',
        {
          title:
            updatedParty.mediaTitle,
        },
      ),
    );

    return true;
  } catch (error) {
    console.error(
      'Watch Party interaction failed:',
      error,
    );

    await interaction.editReply(
      t(
        locale,
        'watchparty.rsvp.updateError',
      ),
    );

    return true;
  }
}
