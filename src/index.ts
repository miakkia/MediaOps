import 'dotenv/config';

import { readdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  ChatInputCommandInteraction,
  Client,
  Events,
  GatewayIntentBits,
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';

import { getMediaOpsBranding } from './config/branding.js';
import { getInteractionLocale } from './i18n/discord-locale.js';
import { t } from './i18n/index.js';
import { handleRequestButton } from './request/request-interactions.js';
import { handleRequestForumMessage } from './request/forum-status-sync.js';
import { startRequestTracker } from './request/request-tracker.js';
import { handleWatchPartyButton } from './watchparty/interactions.js';
import { startWatchPartyLifecycle } from './watchparty/lifecycle.js';
import { handleWatchPartyRandomButton } from './watchparty/random-interactions.js';
import { handleWatchPartyRandomModal } from './watchparty/random-modal-interactions.js';
import { startRuntimeAwareWatchPartyExpiry } from './watchparty/runtime-expiry-lifecycle.js';
import { handleWatchPartySetupButton } from './watchparty/setup-interactions.js';
import { handleWatchPartySetupModal } from './watchparty/setup-modal-interactions.js';

const token = process.env.DISCORD_TOKEN?.trim();
const { botName: configuredBotName } = getMediaOpsBranding();

if (!token) {
  throw new Error('DISCORD_TOKEN is missing from environment variables.');
}

interface CommandModule {
  data: SlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

function isCommandModule(value: unknown): value is CommandModule {
  if (!value || typeof value !== 'object') return false;
  const module = value as Record<string, unknown>;
  if (!module.data || typeof module.data !== 'object') return false;
  const data = module.data as Record<string, unknown>;
  return typeof data.toJSON === 'function' && typeof module.execute === 'function';
}

const commandsDirectory = join(import.meta.dirname, 'commands');
const entries = await readdir(commandsDirectory, { withFileTypes: true });
const commandFiles = entries
  .filter(entry => {
    if (!entry.isFile()) return false;
    const extension = extname(entry.name);
    return extension === '.ts' || extension === '.js';
  })
  .map(entry => entry.name)
  .sort();

const commands = new Map<string, CommandModule>();

for (const fileName of commandFiles) {
  const filePath = join(commandsDirectory, fileName);
  const importedModule: unknown = await import(pathToFileURL(filePath).href);

  if (!isCommandModule(importedModule)) {
    throw new Error(`Invalid Discord command module: ${fileName}`);
  }

  const commandName = importedModule.data.toJSON().name;
  if (!commandName) throw new Error(`Discord command has no name: ${fileName}`);
  if (commands.has(commandName)) throw new Error(`Duplicate Discord command name: ${commandName}`);
  commands.set(commandName, importedModule);
}

if (commands.size === 0) {
  throw new Error('No Discord commands were found.');
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once(Events.ClientReady, readyClient => {
  console.log(`${configuredBotName} connected as ${readyClient.user.tag}`);
  console.log(`Loaded ${commands.size} Discord commands: ${[...commands.keys()].join(', ')}`);
  startWatchPartyLifecycle(readyClient);
  startRuntimeAwareWatchPartyExpiry();
  startRequestTracker(readyClient);
});

client.on(Events.MessageCreate, async message => {
  try {
    const synchronized = await handleRequestForumMessage(message);
    if (synchronized) {
      console.log(`Synchronized media request Forum thread ${message.channelId}.`);
    }
  } catch (error) {
    console.error('Request Forum synchronization failed:', error);
  }
});

client.on(Events.InteractionCreate, async interaction => {
  if (interaction.isButton()) {
    try {
      if (await handleRequestButton(interaction)) return;
      if (await handleWatchPartySetupButton(interaction)) return;
      if (await handleWatchPartyRandomButton(interaction)) return;

      const watchPartyHandled = await handleWatchPartyButton(interaction);
      if (!watchPartyHandled) {
        console.warn(`Unhandled Discord button interaction: ${interaction.customId}`);
      }
    } catch (error) {
      console.error('Discord button interaction failed:', error);
    }
    return;
  }

  if (interaction.isModalSubmit()) {
    try {
      if (await handleWatchPartySetupModal(interaction)) return;
      const randomHandled = await handleWatchPartyRandomModal(interaction);
      if (!randomHandled) {
        console.warn(`Unhandled Discord modal interaction: ${interaction.customId}`);
      }
    } catch (error) {
      console.error('Discord modal interaction failed:', error);
    }
    return;
  }

  if (!interaction.isChatInputCommand()) return;

  const command = commands.get(interaction.commandName);
  if (!command) {
    console.warn(`Unknown Discord command received: ${interaction.commandName}`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`Discord command failed: ${interaction.commandName}`, error);
    const locale = getInteractionLocale(interaction);
    const safeMessage = t(locale, 'common.unexpectedError');

    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(safeMessage);
      } else {
        await interaction.reply({ content: safeMessage, flags: MessageFlags.Ephemeral });
      }
    } catch (replyError) {
      console.error(`Unable to send command error response for ${interaction.commandName}`, replyError);
    }
  }
});

await client.login(token);
