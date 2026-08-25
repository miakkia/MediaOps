import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { dirname, join } from 'node:path';

const DATA_DIRECTORY = process.env.MEDIAOPS_DATA_DIR?.trim() || './data';
const STORE_PATH = join(DATA_DIRECTORY, 'watchparties.json');
const TEMP_STORE_PATH = `${STORE_PATH}.tmp`;

const READY_LEAD_TIME_MS = 30 * 60 * 1000;
const AUTO_CANCEL_GRACE_MS = 30 * 60 * 1000;
const ACTIVE_EXPIRY_MS = 4.5 * 60 * 60 * 1000;
const DEFAULT_RETENTION_DAYS = 30;

let mutationQueue: Promise<void> = Promise.resolve();

export type WatchPartyStatus =
  | 'scheduled'
  | 'ready'
  | 'active'
  | 'auto_cancelled'
  | 'expired'
  | 'cancelled';

export type WatchPartyRsvp = 'going' | 'not_going';

export interface WatchPartyParticipant {
  discordUserId: string;
  response: WatchPartyRsvp;
  respondedAt: string;
}

export interface ScheduledWatchParty {
  id: string;
  guildId: string;
  channelId: string;
  messageId: string | undefined;
  organizerDiscordId: string;
  embyItemId: string;
  mediaTitle: string;
  mediaYear: number | undefined;
  scheduledAt: string;
  status: WatchPartyStatus;
  partyCode: string | undefined;
  reminderSentAt: string | undefined;
  participants: WatchPartyParticipant[];
  createdAt: string;
  updatedAt: string;
}

interface WatchPartyStore {
  version: 1;
  parties: ScheduledWatchParty[];
}

export interface CreateScheduledWatchPartyInput {
  guildId: string;
  channelId: string;
  organizerDiscordId: string;
  embyItemId: string;
  mediaTitle: string;
  mediaYear: number | undefined;
  scheduledAt: string;
}

function getRetentionMs(): number {
  const raw = process.env.WATCHPARTY_RETENTION_DAYS?.trim();
  if (!raw) return DEFAULT_RETENTION_DAYS * 24 * 60 * 60 * 1000;
  const days = Number(raw);
  if (!Number.isFinite(days) || days < 1) {
    return DEFAULT_RETENTION_DAYS * 24 * 60 * 60 * 1000;
  }
  return Math.floor(days) * 24 * 60 * 60 * 1000;
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || typeof value === 'string';
}

function isValidStatus(value: unknown): value is WatchPartyStatus {
  return value === 'scheduled' || value === 'ready' || value === 'active' ||
    value === 'auto_cancelled' || value === 'expired' || value === 'cancelled';
}

function isValidParticipant(value: unknown): value is WatchPartyParticipant {
  if (!value || typeof value !== 'object') return false;
  const participant = value as Record<string, unknown>;
  return isString(participant.discordUserId) &&
    (participant.response === 'going' || participant.response === 'not_going') &&
    isString(participant.respondedAt);
}

function isValidParty(value: unknown): value is ScheduledWatchParty {
  if (!value || typeof value !== 'object') return false;
  const party = value as Record<string, unknown>;
  return isString(party.id) && isString(party.guildId) && isString(party.channelId) &&
    isOptionalString(party.messageId) && isString(party.organizerDiscordId) &&
    isString(party.embyItemId) && isString(party.mediaTitle) &&
    (party.mediaYear === undefined || typeof party.mediaYear === 'number') &&
    isString(party.scheduledAt) && isValidStatus(party.status) &&
    isOptionalString(party.partyCode) && isOptionalString(party.reminderSentAt) &&
    Array.isArray(party.participants) && party.participants.every(isValidParticipant) &&
    isString(party.createdAt) && isString(party.updatedAt);
}

function validateStore(value: unknown): WatchPartyStore {
  if (!value || typeof value !== 'object') {
    throw new Error('Watch Party store has an invalid structure.');
  }
  const store = value as Record<string, unknown>;
  if (store.version !== 1 || !Array.isArray(store.parties) || !store.parties.every(isValidParty)) {
    throw new Error('Watch Party store failed validation.');
  }
  return { version: 1, parties: store.parties };
}

async function ensureDataDirectory(): Promise<void> {
  await mkdir(dirname(STORE_PATH), { recursive: true });
}

async function loadStoreUnsafe(): Promise<WatchPartyStore> {
  await ensureDataDirectory();
  try {
    const parsed: unknown = JSON.parse(await readFile(STORE_PATH, 'utf8'));
    return validateStore(parsed);
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === 'ENOENT') return { version: 1, parties: [] };
    throw error;
  }
}

async function saveStoreUnsafe(store: WatchPartyStore): Promise<void> {
  await ensureDataDirectory();
  const validatedStore = validateStore(store);
  const serialized = `${JSON.stringify(validatedStore, null, 2)}\n`;
  await writeFile(TEMP_STORE_PATH, serialized, { encoding: 'utf8', flag: 'w' });
  await rename(TEMP_STORE_PATH, STORE_PATH);
}

async function serializeMutation<T>(operation: () => Promise<T>): Promise<T> {
  const previous = mutationQueue;
  let release!: () => void;
  mutationQueue = new Promise<void>(resolve => { release = resolve; });
  await previous;
  try {
    return await operation();
  } finally {
    release();
  }
}

async function mutateStore<T>(
  operation: (store: WatchPartyStore) => Promise<T> | T,
): Promise<T> {
  return serializeMutation(async () => {
    const store = await loadStoreUnsafe();
    const result = await operation(store);
    await saveStoreUnsafe(store);
    return result;
  });
}

export async function loadWatchPartyStore(): Promise<WatchPartyStore> {
  await mutationQueue;
  return loadStoreUnsafe();
}

export async function saveWatchPartyStore(store: WatchPartyStore): Promise<void> {
  await serializeMutation(() => saveStoreUnsafe(store));
}

export async function getWatchParties(): Promise<ScheduledWatchParty[]> {
  const store = await loadWatchPartyStore();
  return [...store.parties];
}

export async function getUpcomingWatchParties(guildId?: string): Promise<ScheduledWatchParty[]> {
  const parties = await getWatchParties();
  return parties
    .filter(party => (!guildId || party.guildId === guildId) &&
      (party.status === 'scheduled' || party.status === 'ready' || party.status === 'active'))
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
}

export async function refreshWatchPartyLifecycle(): Promise<ScheduledWatchParty[]> {
  return mutateStore(store => {
    const now = Date.now();
    for (let index = 0; index < store.parties.length; index += 1) {
      const party = store.parties[index];
      if (!party || party.status === 'cancelled' || party.status === 'auto_cancelled' || party.status === 'expired') continue;
      const scheduledTime = new Date(party.scheduledAt).getTime();
      if (Number.isNaN(scheduledTime)) continue;

      let nextStatus: WatchPartyStatus = party.status;
      if (party.status === 'scheduled' && now >= scheduledTime - READY_LEAD_TIME_MS && now < scheduledTime) {
        nextStatus = 'ready';
      }
      if ((party.status === 'scheduled' || party.status === 'ready') && !party.partyCode && now >= scheduledTime + AUTO_CANCEL_GRACE_MS) {
        nextStatus = 'auto_cancelled';
      }
      if (party.status === 'active' && now >= scheduledTime + ACTIVE_EXPIRY_MS) {
        nextStatus = 'expired';
      }
      if (nextStatus !== party.status) {
        store.parties[index] = { ...party, status: nextStatus, updatedAt: new Date().toISOString() };
      }
    }
    return [...store.parties];
  });
}

export async function cleanupWatchPartyHistory(): Promise<number> {
  return mutateStore(store => {
    const cutoff = Date.now() - getRetentionMs();
    const before = store.parties.length;
    store.parties = store.parties.filter(party => {
      if (party.status !== 'cancelled' && party.status !== 'auto_cancelled' && party.status !== 'expired') return true;
      const referenceTime = new Date(party.updatedAt).getTime();
      return Number.isNaN(referenceTime) || referenceTime >= cutoff;
    });
    return before - store.parties.length;
  });
}

export async function createScheduledWatchParty(input: CreateScheduledWatchPartyInput): Promise<ScheduledWatchParty> {
  const scheduledDate = new Date(input.scheduledAt);
  if (Number.isNaN(scheduledDate.getTime())) throw new Error('Scheduled Watch Party date is invalid.');
  if (scheduledDate.getTime() <= Date.now()) throw new Error('Scheduled Watch Party date must be in the future.');

  return mutateStore(store => {
    const now = new Date().toISOString();
    const party: ScheduledWatchParty = {
      id: randomUUID(), guildId: input.guildId, channelId: input.channelId,
      messageId: undefined, organizerDiscordId: input.organizerDiscordId,
      embyItemId: input.embyItemId, mediaTitle: input.mediaTitle, mediaYear: input.mediaYear,
      scheduledAt: scheduledDate.toISOString(), status: 'scheduled', partyCode: undefined,
      reminderSentAt: undefined, participants: [], createdAt: now, updatedAt: now,
    };
    store.parties.push(party);
    return party;
  });
}

export async function findWatchPartyById(partyId: string): Promise<ScheduledWatchParty | undefined> {
  const store = await loadWatchPartyStore();
  return store.parties.find(party => party.id === partyId);
}

export async function setWatchPartyMessageId(partyId: string, messageId: string): Promise<ScheduledWatchParty> {
  return updateWatchParty(partyId, party => ({ ...party, messageId }));
}

export async function setWatchPartyStatus(partyId: string, status: WatchPartyStatus): Promise<ScheduledWatchParty> {
  return updateWatchParty(partyId, party => ({ ...party, status }));
}

export async function setWatchPartyCode(partyId: string, partyCode: string | undefined): Promise<ScheduledWatchParty> {
  return updateWatchParty(partyId, party => ({ ...party, partyCode }));
}

export async function setWatchPartyReminderSentAt(partyId: string, reminderSentAt: string | undefined): Promise<ScheduledWatchParty> {
  return updateWatchParty(partyId, party => ({ ...party, reminderSentAt }));
}

export async function setParticipantResponse(
  partyId: string,
  discordUserId: string,
  response: WatchPartyRsvp,
): Promise<ScheduledWatchParty> {
  return updateWatchParty(partyId, party => {
    const participants = party.participants.filter(item => item.discordUserId !== discordUserId);
    participants.push({ discordUserId, response, respondedAt: new Date().toISOString() });
    return { ...party, participants };
  });
}

async function updateWatchParty(
  partyId: string,
  updater: (party: ScheduledWatchParty) => ScheduledWatchParty,
): Promise<ScheduledWatchParty> {
  return mutateStore(store => {
    const index = store.parties.findIndex(party => party.id === partyId);
    const currentParty = index >= 0 ? store.parties[index] : undefined;
    if (!currentParty) throw new Error('Scheduled Watch Party was not found.');

    const updatedParty = { ...updater(currentParty), updatedAt: new Date().toISOString() };
    if (!isValidParty(updatedParty)) throw new Error('Updated Watch Party failed validation.');
    store.parties[index] = updatedParty;
    return updatedParty;
  });
}
