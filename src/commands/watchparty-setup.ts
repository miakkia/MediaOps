import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';

import {
  getWatchPartyUrl,
} from '../services/watchparty.js';

const RANDOM_BUTTON_ID =
  'watchpartysetup:random';

const SCHEDULE_BUTTON_ID =
  'watchpartysetup:schedule';

export const data =
  new SlashCommandBuilder()
    .setName('watchparty-setup')
    .setDescription(
      'Publish the Watch Party welcome panel in this channel.',
    )
    .setDescriptionLocalizations({
      fr:
        'Publier le panneau Watch Party dans ce salon.',
    })
    .setDefaultMemberPermissions(
      PermissionFlagsBits.ManageGuild,
    );

export async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  if (
    !interaction.guildId ||
    !interaction.channelId
  ) {
    await interaction.reply({
      content:
        '❌ This command must be used in a Discord server.',

      flags:
        MessageFlags.Ephemeral,
    });

    return;
  }

  const channel =
    interaction.channel;

  if (
    !channel ||
    !channel.isSendable()
  ) {
    await interaction.reply({
      content:
        '❌ Unable to publish the Watch Party panel in this channel.',

      flags:
        MessageFlags.Ephemeral,
    });

    return;
  }

  const watchPartyUrl =
    getWatchPartyUrl();

  const randomButton =
    new ButtonBuilder()
      .setCustomId(
        RANDOM_BUTTON_ID,
      )
      .setLabel(
        'Random / Aléatoire',
      )
      .setEmoji('🎲')
      .setStyle(
        ButtonStyle.Secondary,
      );

  const scheduleButton =
    new ButtonBuilder()
      .setCustomId(
        SCHEDULE_BUTTON_ID,
      )
      .setLabel(
        'Planifier / Schedule',
      )
      .setEmoji('📅')
      .setStyle(
        ButtonStyle.Primary,
      );

  const openButton =
    new ButtonBuilder()
      .setLabel(
        'Ouvrir / Open',
      )
      .setEmoji('🌐')
      .setStyle(
        ButtonStyle.Link,
      )
      .setURL(
        watchPartyUrl,
      );

  const row =
    new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        randomButton,
        scheduleButton,
        openButton,
      );

  const content = [
    '## 🎬 Watch Party',
    '',
    '🇫🇷 **Français**',
    'Regardez un film ensemble avec SolitarioHomeCinema.',
    '',
    '🎲 **Aucune idée quoi regarder?**',
    'Laissez Solitario Butler choisir un film au hasard.',
    '',
    '📅 **Vous savez quoi regarder?**',
    'Planifiez simplement votre prochaine soirée.',
    '',
    '🌐 **Prêt à regarder?**',
    'Ouvrez Watch Party pour créer ou rejoindre une session.',
    '',
    '🇬🇧 **English**',
    'Watch a movie together with SolitarioHomeCinema.',
    '',
    '🎲 **Not sure what to watch?**',
    'Let Solitario Butler choose a random movie.',
    '',
    '📅 **Know what you want to watch?**',
    'Simply schedule your next movie night.',
    '',
    '🌐 **Ready to watch?**',
    'Open Watch Party to create or join a session.',
    '',
    '🔐 **Sécurité / Security**',
    'Votre mot de passe Emby est saisi uniquement dans Watch Party et n’est jamais envoyé à Solitario Butler.',
    'Your Emby password is entered only in Watch Party and is never sent to Solitario Butler.',
  ].join('\n');

  await channel.send({
    content,
    components: [
      row,
    ],
  });

  await interaction.reply({
    content:
      '✅ Watch Party panel published / Panneau Watch Party publié.',

    flags:
      MessageFlags.Ephemeral,
  });
}