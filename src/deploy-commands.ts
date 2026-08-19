import 'dotenv/config';
import { REST, Routes } from 'discord.js';

import { data as pingCommand } from './commands/ping.js';

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.DISCORD_GUILD_ID;

if (!token || !clientId || !guildId) {
  throw new Error(
    'DISCORD_TOKEN, DISCORD_CLIENT_ID and DISCORD_GUILD_ID are required.',
  );
}

const commands = [
  pingCommand.toJSON(),
];

const rest = new REST().setToken(token);

await rest.put(
  Routes.applicationGuildCommands(clientId, guildId),
  { body: commands },
);

console.log('Successfully registered Discord commands.');