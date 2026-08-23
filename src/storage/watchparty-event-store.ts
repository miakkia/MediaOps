import {
  mkdir,
  readFile,
  rename,
  writeFile,
} from 'node:fs/promises';
import { dirname, join } from 'node:path';

const DATA_DIRECTORY =
  process.env.MEDIAOPS_DATA_DIR?.trim() || './data';

const STORE_PATH = join(
  DATA_DIRECTORY,
  'watchparty-events.json',
);

const TEMP_STORE_PATH = `${STORE_PATH}.tmp`;

interface WatchPartyEventLink {
  partyId: string;
  scheduledEventId: string;
  createdAt: string;
  updatedAt: string;
}

interface WatchPartyEventStore {
  version: 1;
  links: WatchPartyEventLink[];
}

let mutationQueue: Promise<void> = Promise.resolve();

function isLink(value: unknown): value is WatchPartyEventLink {
  if (!value || typeof value !== 'object') return false;
  const link = value as Record<string, unknown>;
  return (
    typeof link.partyId === 'string' &&
    typeof link.scheduledEventId === 'string' &&
    typeof link.createdAt === 'string' &&
    typeof link.updatedAt === 'string'
  );
}

function validateStore(value: unknown): WatchPartyEventStore {
  if (!value || typeof value !== 'object') {
    throw new Error('Watch Party event store has an invalid structure.');
  }

  const store = value as Record<string, unknown>;
  if (
    store.version !== 1 ||
    !Array.isArray(store.links) ||
    !store.links.every(isLink)
  ) {
    throw new Error('Watch Party event store failed validation.');
  }

  return {
    version: 1,
    links: store.links,
  };
}

async function ensureDirectory(): Promise<void> {
  await mkdir(dirname(STORE_PATH), { recursive: true });
}

async function loadStore(): Promise<WatchPartyEventStore> {
  await ensureDirectory();

  try {
    const raw = await readFile(STORE_PATH, 'utf8');
    return validateStore(JSON.parse(raw) as unknown);
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === 'ENOENT') {
      return { version: 1, links: [] };
    }
    throw error;
  }
}

async function saveStore(store: WatchPartyEventStore): Promise<void> {
  await ensureDirectory();
  const validated = validateStore(store);
  const serialized = `${JSON.stringify(validated, null, 2)}\n`;
  await writeFile(TEMP_STORE_PATH, serialized, 'utf8');
  await rename(TEMP_STORE_PATH, STORE_PATH);
}

async function mutate<T>(operation: () => Promise<T>): Promise<T> {
  let release: (() => void) | undefined;
  const previous = mutationQueue;
  mutationQueue = new Promise<void>(resolve => {
    release = resolve;
  });

  await previous;
  try {
    return await operation();
  } finally {
    release?.();
  }
}

export async function getWatchPartyScheduledEventId(
  partyId: string,
): Promise<string | undefined> {
  const store = await loadStore();
  return store.links.find(link => link.partyId === partyId)?.scheduledEventId;
}

export async function setWatchPartyScheduledEventId(
  partyId: string,
  scheduledEventId: string,
): Promise<void> {
  await mutate(async () => {
    const store = await loadStore();
    const now = new Date().toISOString();
    const existing = store.links.find(link => link.partyId === partyId);

    if (existing) {
      existing.scheduledEventId = scheduledEventId;
      existing.updatedAt = now;
    } else {
      store.links.push({
        partyId,
        scheduledEventId,
        createdAt: now,
        updatedAt: now,
      });
    }

    await saveStore(store);
  });
}

export async function removeWatchPartyScheduledEventId(
  partyId: string,
): Promise<void> {
  await mutate(async () => {
    const store = await loadStore();
    const nextLinks = store.links.filter(link => link.partyId !== partyId);
    if (nextLinks.length === store.links.length) return;
    await saveStore({ version: 1, links: nextLinks });
  });
}
