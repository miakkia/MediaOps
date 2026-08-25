import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test, { after, before } from 'node:test';

let dataDir = '';
let storePath = '';

before(async () => {
  dataDir = await mkdtemp(join(tmpdir(), 'mediaops-watchparty-'));
  storePath = join(dataDir, 'watchparties.json');
  process.env.MEDIAOPS_DATA_DIR = dataDir;
  process.env.WATCHPARTY_RETENTION_DAYS = '30';
});

after(async () => {
  delete process.env.MEDIAOPS_DATA_DIR;
  delete process.env.WATCHPARTY_RETENTION_DAYS;
  if (dataDir) await rm(dataDir, { recursive: true, force: true });
});

async function loadStoreModule() {
  return import('../src/storage/watchparty-store.js');
}

function party(overrides: Record<string, unknown> = {}) {
  const now = new Date().toISOString();
  return {
    id: 'party-1', guildId: 'guild-1', channelId: 'channel-1', messageId: 'message-1',
    organizerDiscordId: 'user-1', embyItemId: 'emby-1', mediaTitle: 'Test Movie', mediaYear: 2026,
    scheduledAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), status: 'scheduled',
    partyCode: undefined, reminderSentAt: undefined, participants: [], createdAt: now, updatedAt: now,
    ...overrides,
  };
}

async function writeStore(parties: unknown[]) {
  await writeFile(storePath, `${JSON.stringify({ version: 1, parties }, null, 2)}\n`, 'utf8');
}

test('moves a scheduled party to ready inside the 30-minute window', async () => {
  const scheduledAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  await writeStore([party({ scheduledAt })]);
  const { refreshWatchPartyLifecycle } = await loadStoreModule();
  const [updated] = await refreshWatchPartyLifecycle();
  assert.equal(updated?.status, 'ready');
});

test('auto-cancels a party 30 minutes after start when no room exists', async () => {
  const scheduledAt = new Date(Date.now() - 31 * 60 * 1000).toISOString();
  await writeStore([party({ scheduledAt, status: 'ready' })]);
  const { refreshWatchPartyLifecycle } = await loadStoreModule();
  const [updated] = await refreshWatchPartyLifecycle();
  assert.equal(updated?.status, 'auto_cancelled');
});

test('expires an active party 4.5 hours after its scheduled start', async () => {
  const scheduledAt = new Date(Date.now() - 4.5 * 60 * 60 * 1000 - 1000).toISOString();
  await writeStore([party({ scheduledAt, status: 'active', partyCode: 'ABCDE' })]);
  const { refreshWatchPartyLifecycle } = await loadStoreModule();
  const [updated] = await refreshWatchPartyLifecycle();
  assert.equal(updated?.status, 'expired');
});

test('keeps active parties in the upcoming list', async () => {
  const active = party({ id: 'active-1', status: 'active', partyCode: 'ABCDE', scheduledAt: new Date(Date.now() - 5 * 60 * 1000).toISOString() });
  const cancelled = party({ id: 'cancelled-1', status: 'cancelled' });
  await writeStore([active, cancelled]);
  const { getUpcomingWatchParties } = await loadStoreModule();
  const upcoming = await getUpcomingWatchParties('guild-1');
  assert.deepEqual(upcoming.map(item => item.id), ['active-1']);
});

test('replaces an existing RSVP from the same Discord user', async () => {
  await writeStore([party()]);
  const { setParticipantResponse } = await loadStoreModule();
  await setParticipantResponse('party-1', 'guest-1', 'going');
  const updated = await setParticipantResponse('party-1', 'guest-1', 'not_going');
  assert.equal(updated.participants.length, 1);
  assert.equal(updated.participants[0]?.discordUserId, 'guest-1');
  assert.equal(updated.participants[0]?.response, 'not_going');
});

test('serializes concurrent Watch Party mutations without losing data', async () => {
  await writeStore([party()]);
  const { setParticipantResponse, setWatchPartyCode, setWatchPartyReminderSentAt } = await loadStoreModule();
  const reminderAt = new Date().toISOString();

  await Promise.all([
    setParticipantResponse('party-1', 'guest-1', 'going'),
    setParticipantResponse('party-1', 'guest-2', 'going'),
    setWatchPartyCode('party-1', 'ABCDE'),
    setWatchPartyReminderSentAt('party-1', reminderAt),
  ]);

  const raw = JSON.parse(await readFile(storePath, 'utf8')) as {
    parties: Array<{ partyCode?: string; reminderSentAt?: string; participants: Array<{ discordUserId: string }> }>;
  };
  const saved = raw.parties[0];
  assert.equal(saved?.partyCode, 'ABCDE');
  assert.equal(saved?.reminderSentAt, reminderAt);
  assert.deepEqual(saved?.participants.map(item => item.discordUserId).sort(), ['guest-1', 'guest-2']);
});

test('removes terminal history older than configured retention', async () => {
  const old = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString();
  const recent = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
  await writeStore([
    party({ id: 'old-expired', status: 'expired', updatedAt: old }),
    party({ id: 'recent-cancelled', status: 'cancelled', updatedAt: recent }),
    party({ id: 'future', status: 'scheduled' }),
  ]);
  const { cleanupWatchPartyHistory } = await loadStoreModule();
  const removed = await cleanupWatchPartyHistory();
  assert.equal(removed, 1);
  const raw = JSON.parse(await readFile(storePath, 'utf8')) as { parties: Array<{ id: string }> };
  assert.deepEqual(raw.parties.map(item => item.id).sort(), ['future', 'recent-cancelled']);
});
