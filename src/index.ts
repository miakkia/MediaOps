import 'dotenv/config';
import {
  Client,
  Events,
  GatewayIntentBits,
} from 'discord.js';

import {
  execute as executeHealth,
} from './commands/health.js';

import {
  execute as executePing,
} from './commands/ping.js';

const token = process.env.DISCORD_TOKEN;

if (!token) {
  throw new Error('DISCORD_TOKEN is missing from environment variables.');
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
  ],
});

client.once(Events.ClientReady, readyClient => {
  console.log(`Solitario Butler connected as ${readyClient.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) {
    return;
  }

  if (interaction.commandName === 'ping') {
    await executePing(interaction);
    return;
  }

  if (interaction.commandName === 'health') {
    await executeHealth(interaction);
  }
});

client.login(token);