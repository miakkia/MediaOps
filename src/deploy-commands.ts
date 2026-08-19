import 'dotenv/config';

import { readdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  REST,
  Routes,
  SlashCommandBuilder,
} from 'discord.js';

const token = process.env.DISCORD_TOKEN?.trim();
const clientId = process.env.DISCORD_CLIENT_ID?.trim();
const guildId = process.env.DISCORD_GUILD_ID?.trim();

if (!token || !clientId || !guildId) {
  throw new Error(
    'DISCORD_TOKEN, DISCORD_CLIENT_ID and DISCORD_GUILD_ID are required.',
  );
}

interface CommandModule {
  data: SlashCommandBuilder;
}

function isCommandModule(value: unknown): value is CommandModule {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const module = value as Record<string, unknown>;

  if (!module.data || typeof module.data !== 'object') {
    return false;
  }

  const data = module.data as Record<string, unknown>;

  return typeof data.toJSON === 'function';
}

const commandsDirectory = join(import.meta.dirname, 'commands');
const entries = await readdir(commandsDirectory, {
  withFileTypes: true,
});

const commandFiles = entries
  .filter(entry => {
    if (!entry.isFile()) {
      return false;
    }

    const extension = extname(entry.name);

    return extension === '.ts' || extension === '.js';
  })
  .map(entry => entry.name)
  .sort();

const commands: ReturnType<SlashCommandBuilder['toJSON']>[] = [];
const commandNames = new Set<string>();

for (const fileName of commandFiles) {
  const filePath = join(commandsDirectory, fileName);
  const moduleUrl = pathToFileURL(filePath).href;
  const importedModule: unknown = await import(moduleUrl);

  if (!isCommandModule(importedModule)) {
    throw new Error(
      `Invalid Discord command module: ${fileName}`,
    );
  }

  const command = importedModule.data.toJSON();

  if (!command.name) {
    throw new Error(
      `Discord command has no name: ${fileName}`,
    );
  }

  if (commandNames.has(command.name)) {
    throw new Error(
      `Duplicate Discord command name: ${command.name}`,
    );
  }

  commandNames.add(command.name);
  commands.push(command);
}

if (commands.length === 0) {
  throw new Error('No Discord commands were found.');
}

const rest = new REST().setToken(token);

await rest.put(
  Routes.applicationGuildCommands(clientId, guildId),
  {
    body: commands,
  },
);

console.log(
  `Successfully registered ${commands.length} Discord commands: ` +
    [...commandNames].join(', '),
);