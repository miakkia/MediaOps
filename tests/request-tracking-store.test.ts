import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

async function loadStore(dataDir: string) {
  process.env.MEDIAOPS_DATA_DIR = dataDir;
  return import(`../src/storage/request-tracking-store.js?test=${encodeURIComponent(dataDir)}`);
}

test('persists and updates tracked requests without duplication', async () => {
  const dataDir = await mkdtemp(join(tmpdir(), 'mediaops-requests-'));

  try {
    const store = await loadStore(dataDir);
    const now = new Date().toISOString();

    await store.saveTrackedRequest({
      providerRequestId: '2566',
      providerId: '123',
      mediaType: 'series',
      title: 'Dead Like Me',
      year: 2003,
      discordUserId: '42',
      status: 'pending',
      createdAt: now,
      updatedAt: now,
      availableNotifiedAt: undefined,
    });

    await store.updateTrackedRequest('2566', {
      status: 'available',
      availableNotifiedAt: now,
    });

    const items = await store.listTrackedRequests();
    assert.equal(items.length, 1);
    assert.equal(items[0]?.title, 'Dead Like Me');
    assert.equal(items[0]?.status, 'available');
    assert.equal(items[0]?.availableNotifiedAt, now);

    const raw = JSON.parse(await readFile(join(dataDir, 'requests.json'), 'utf8'));
    assert.equal(raw.length, 1);
  } finally {
    await rm(dataDir, { recursive: true, force: true });
  }
});
