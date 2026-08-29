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
  setWatchPartyLaunchMessageId,
  setWatchPartyReminderMessageId,
  setWatchPartyStatus,
} from '../storage/watchparty-store.js';

import {
  parseWatchPartyCancelCustomId,
  parseWatchPartyRsvpCustomId,
  parseWatchPartyStartEarlyCustomId,
} from './components.js';

import {
  cancelDiscordScheduledEventForParty,
} from './discord-events.js';

import {
  buildScheduledWatchPartyMessage,
} from './message.js';

import {
  openScheduledWatchParty,
} from './start.js';

export async function handleWatchPartyButton(
  interaction: ButtonInteraction,
): Promise<boolean> {
  const cancelInteraction =
    parseWatchPartyCancelCustomId(
      interaction.customId,
    );

  const startEarlyInteraction =
    parseWatchPartyStartEarlyCustomId(
      interaction.customId,
    );

  const rsvpInteraction =
    parseWatchPartyRsvpCustomId(
      interaction.customId,
    );

  if (
    !cancelInteraction &&
    !startEarlyInteraction &&
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
      startEarlyInteraction?.partyId ??
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

    if (startEarlyInteraction) {
      if (
        interaction.user.id !==
        party.organizerDiscordId
      ) {
        await interaction.editReply(
          locale === 'fr'
            ? 'Seul l’organisateur peut démarrer cette Watch Party plus tôt.'
            : 'Only the organizer can start this Watch Party early.',
        );

        return true;
      }

      if (
        party.status !== 'scheduled' &&
        party.status !== 'ready'
      ) {
        await interaction.editReply(
          locale === 'fr'
            ? 'Cette Watch Party ne peut plus être démarrée plus tôt.'
            : 'This Watch Party can no longer be started early.',
        );

        return true;
      }

      const scheduledTime =
        new Date(
          party.scheduledAt,
        ).getTime();

      if (
        Number.isNaN(scheduledTime) ||
        scheduledTime <= Date.now() ||
        party.partyCode
      ) {
        await interaction.editReply(
          locale === 'fr'
            ? 'Cette Watch Party est déjà en cours de démarrage ou a déjà commencé.'
            : 'This Watch Party is already starting or has already started.',
        );

        return true;
      }

      const opened =
        await openScheduledWatchParty(
          interaction.client,
          party.id,
        );

      if (party.reminderMessageId) {
        try {
          const reminderMessage =
            await interaction.channel?.messages.fetch(
              party.reminderMessageId,
            );

          if (reminderMessage) {
            await reminderMessage.delete();
          }
        } catch (error) {
          console.warn(
            `Unable to remove early-start reminder for Watch Party ${party.id}:`,
            error,
          );
        }

        await setWatchPartyReminderMessageId(
          party.id,
          undefined,
        );
      }

      const renderedMessage =
        buildScheduledWatchPartyMessage(
          opened.party,
          locale,
        );

      await interaction.message.edit({
        content:
          renderedMessage.content,

        components:
          renderedMessage.components,
      });

      await interaction.editReply(
        locale === 'fr'
          ? `▶️ La Watch Party pour **${opened.party.mediaTitle}** a été démarrée maintenant.`
          : `▶️ The Watch Party for **${opened.party.mediaTitle}** has been started now.`,
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

      const wasActive =
        party.status === 'active';

      const cancelledParty =
        await setWatchPartyStatus(
          party.id,
          'cancelled',
        );

      // Discord Scheduled Events are supplementary. Their API state must never
      // prevent the existing Watch Party cancellation from succeeding. An
      // active event is completed; a future event is cancelled.
      if (interaction.guild) {
        await cancelDiscordScheduledEventForParty(
          interaction.guild,
          party.id,
        );
      }

      // Clean up every Discord message MediaOps created for this lifecycle.
      // This does not dissolve Oratorian's Watch Party room; MediaOps only
      // cancels the orchestration and artifacts it owns.
      for (const trackedMessage of [
        {
          id: party.reminderMessageId,
          kind: 'reminder',
        },
        {
          id: party.launchMessageId,
          kind: 'launch',
        },
      ]) {
        if (!trackedMessage.id) {
          continue;
        }

        try {
          const message =
            await interaction.channel?.messages.fetch(
              trackedMessage.id,
            );

          if (message) {
            await message.delete();
          }
        } catch (error) {
          console.warn(
            `Unable to remove ${trackedMessage.kind} message for Watch Party ${party.id}:`,
            error,
          );
        }
      }

      if (party.reminderMessageId) {
        await setWatchPartyReminderMessageId(
          party.id,
          undefined,
        );
      }

      if (party.launchMessageId) {
        await setWatchPartyLaunchMessageId(
          party.id,
          undefined,
        );
      }

      // A cancelled/ended Watch Party no longer needs its public RSVP post.
      // Keep the persisted party record for history/auditing, but remove the
      // Discord message so the channel only contains active/relevant parties.
      try {
        await interaction.message.delete();
      } catch (error) {
        console.error(
          'Failed to delete cancelled Watch Party message:',
          error,
        );

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
        wasActive
          ? (
              locale === 'fr'
                ? `🛑 La Watch Party pour **${cancelledParty.mediaTitle}** a été terminée dans MediaOps.`
                : `🛑 The Watch Party for **${cancelledParty.mediaTitle}** has been ended in MediaOps.`
            )
          : t(
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
      startEarlyInteraction
        ? (
            locale === 'fr'
              ? 'Impossible de démarrer la Watch Party plus tôt pour le moment.'
              : 'Unable to start the Watch Party early right now.'
          )
        : t(
            locale,
            'watchparty.rsvp.updateError',
          ),
    );

    return true;
  }
}
