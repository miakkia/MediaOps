import assert from 'node:assert/strict';
import test from 'node:test';

process.env.WATCHPARTY_URL = 'https://watch.solitariohomecinema.cc';

const {
  getWatchPartyJoinUrl,
} = await import('../src/services/watchparty.js');

test('builds direct Watch Party room URL', () => {
  assert.equal(
    getWatchPartyJoinUrl('NNQUP'),
    'https://watch.solitariohomecinema.cc/party/NNQUP',
  );
});

test('normalizes party code casing', () => {
  assert.equal(
    getWatchPartyJoinUrl('nnqup'),
    'https://watch.solitariohomecinema.cc/party/NNQUP',
  );
});
