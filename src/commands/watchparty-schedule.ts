import {
  ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';

import {
  getInteractionLocale,
} from '../i18n/discord-locale.js';

import {
  t,
} from '../i18n/index.js';

import {
  mediaProvider,
} from '../providers/media-provider-instance.js';

import {
  createScheduledWatchParty,
  setWatchPartyMessageId,
  setWatchPartyStatus,
} from '../storage/watchparty-store.js';

import {
  createWatchPartyRsvpRow,
} from '../watchparty/components.js';

export const data =
  new SlashCommandBuilder()
    .setName('watchparty-schedule')
    .setDescription(
      t(
        'en',
        'commands.watchpartySchedule.description',
      ),
    )
    .setDescriptionLocalizations({
      fr:
        t(
          'fr',
          'commands.watchpartySchedule.description',
        ),
    })
    .addStringOption(option =>
      option
        .setName('title')
        .setDescription(
          t(
            'en',
            'commands.watchpartySchedule.titleOptionDescription',
          ),
        )
        .setDescriptionLocalizations({
          fr:
            t(
              'fr',
              'commands.watchpartySchedule.titleOptionDescription',
            ),
        })
        .setRequired(true)
        .setMaxLength(100),
    )
    .addStringOption(option =>
      option
        .setName('datetime')
        .setDescription(
          t(
            'en',
            'commands.watchpartySchedule.dateTimeOptionDescription',
          ),
        )
        .setDescriptionLocalizations({
          fr:
            t(
              'fr',
              'commands.watchpartySchedule.dateTimeOptionDescription',
            ),
        })
        .setRequired(true)
        .setMaxLength(40),
    );

export async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const locale =
    getInteractionLocale(
      interaction,
    );

  if (
    !interaction.guildId ||
    !interaction.channelId
  ) {
    await interaction.reply({
      content:
        t(
          locale,
          'watchparty.scheduling.serverOnly',
        ),

      flags:
        MessageFlags.Ephemeral,
    });

    return;
  }

  const title =
    interaction.options.getString(
      'title',
      true,
    );

  const dateTime =
    interaction.options.getString(
      'datetime',
      true,
    );

  await interaction.deferReply({
    flags:
      MessageFlags.Ephemeral,
  });

  try {
    const movies =
    await mediaProvider.searchMovies(
        title,
      );

    if (movies.length === 0) {
      await interaction.editReply(
        t(
          locale,
          'emby.movie.notFound',
          {
            title,
          },
        ),
      );

      return;
    }

    const movie =
      movies[0];

    if (!movie) {
      await interaction.editReply(
        t(
          locale,
          'watchparty.scheduling.movieSelectionError',
        ),
      );

      return;
    }

    const scheduledDate =
      new Date(
        dateTime,
      );

    if (
      Number.isNaN(
        scheduledDate.getTime(),
      )
    ) {
      await interaction.editReply(
        t(
          locale,
          'watchparty.scheduling.invalidDate',
        ),
      );

      return;
    }

    if (
      scheduledDate.getTime() <=
      Date.now()
    ) {
      await interaction.editReply(
        t(
          locale,
          'watchparty.scheduling.pastDate',
        ),
      );

      return;
    }

    const party =
      await createScheduledWatchParty({
        guildId:
          interaction.guildId,

        channelId:
          interaction.channelId,

        organizerDiscordId:
          interaction.user.id,

        embyItemId:
          movie.id,

        mediaTitle:
          movie.name,

        mediaYear:
          movie.year,

        scheduledAt:
          scheduledDate.toISOString(),
      });

    const timestamp =
      Math.floor(
        scheduledDate.getTime() /
          1000,
      );

    const year =
      movie.year !== undefined
        ? ` (${movie.year})`
        : '';

    const rsvpRow =
      createWatchPartyRsvpRow(
        party.id,

        t(
          locale,
          'watchparty.scheduling.going',
        ),

        t(
          locale,
          'watchparty.scheduling.notGoing',
        ),

        t(
          locale,
          'watchparty.cancel.button',
        ),
      );

    const channel =
      interaction.channel;

    if (
      !channel ||
      !channel.isSendable()
    ) {
      throw new Error(
        'Watch Party channel is not sendable.',
      );
    }

    let publicMessage;

    try {
      publicMessage =
        await channel.send({
          content:
            `${t(
              locale,
              'watchparty.scheduling.title',
            )}\n\n` +

            `${t(
              locale,
              'watchparty.scheduling.movie',
            )}: **${movie.name}**${year}\n` +

            `${t(
              locale,
              'watchparty.scheduling.organizer',
            )}: <@${interaction.user.id}>\n` +

            `${t(
              locale,
              'watchparty.scheduling.scheduledFor',
            )}: <t:${timestamp}:F>\n` +

            `${t(
              locale,
              'watchparty.scheduling.relativeTime',
            )}: <t:${timestamp}:R>`,

          components: [
            rsvpRow,
          ],
        });
    } catch (error) {
      await setWatchPartyStatus(
        party.id,
        'auto_cancelled',
      );

      throw error;
    }

    await setWatchPartyMessageId(
      party.id,
      publicMessage.id,
    );

    await interaction.editReply(
      t(
        locale,
        'watchparty.scheduling.confirmation',
      ),
    );
  } catch (error) {
    console.error(
      'Watch Party scheduling failed:',
      error,
    );

    const discordError =
      error as {
        code?: number;
      };

    const messageKey =
      discordError.code === 50001
        ? 'watchparty.scheduling.channelAccessError'
        : 'watchparty.scheduling.scheduleError';

    await interaction.editReply(
      t(
        locale,
        messageKey,
      ),
    );
  }
}