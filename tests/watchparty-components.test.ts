import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createWatchPartyActiveRow,
  createWatchPartyJoinRow,
  parseWatchPartyCancelCustomId,
  parseWatchPartyRsvpCustomId,
  parseWatchPartyStartEarlyCustomId,
} from '../src/watchparty/components.js';

test('parses a going RSVP custom ID', () => {
  assert.deepEqual(
    parseWatchPartyRsvpCustomId('watchparty:rsvp:going:party-123'),
    {
      action: 'going',
      partyId: 'party-123',
    },
  );
});

test('parses a not-going RSVP custom ID', () => {
  assert.deepEqual(
    parseWatchPartyRsvpCustomId('watchparty:rsvp:not_going:party-123'),
    {
      action: 'not_going',
      partyId: 'party-123',
    },
  );
});

test('parses a start-early custom ID', () => {
  assert.deepEqual(
    parseWatchPartyStartEarlyCustomId('watchparty:rsvp:start_early:party-123'),
    {
      action: 'start_early',
      partyId: 'party-123',
    },
  );
});

test('parses a cancel custom ID', () => {
  assert.deepEqual(
    parseWatchPartyCancelCustomId('watchparty:rsvp:cancel:party-123'),
    {
      action: 'cancel',
      partyId: 'party-123',
    },
  );
});

test('rejects malformed or unrelated custom IDs', () => {
  const invalid = [
    '',
    'watchparty:rsvp:going',
    'watchparty:other:going:party-123',
    'other:rsvp:going:party-123',
    'watchparty:rsvp:unknown:party-123',
    'watchparty:rsvp:cancel:',
  ];

  for (const customId of invalid) {
    assert.equal(parseWatchPartyRsvpCustomId(customId), undefined);
    assert.equal(parseWatchPartyStartEarlyCustomId(customId), undefined);
    assert.equal(parseWatchPartyCancelCustomId(customId), undefined);
  }
});

test('active Watch Party row exposes only the Close Room action', () => {
  const row = createWatchPartyActiveRow(
    'party-123',
    'Close Room',
  ).toJSON();

  assert.equal(row.components.length, 1);

  const button = row.components[0] as unknown as Record<string, unknown>;

  assert.equal(button.label, 'Close Room');
  assert.equal(button.custom_id, 'watchparty:rsvp:cancel:party-123');
  assert.equal(button.style, 4);
  assert.notEqual(button.disabled, true);
});

test('demo join button is disabled and never serializes the configured URL', () => {
  const row = createWatchPartyJoinRow(
    'Join Watch Party',
    'https://private.example/party/ABCDE',
    true,
  ).toJSON();

  const button = row.components[0] as unknown as Record<string, unknown>;

  assert.equal(button.disabled, true);
  assert.equal(button.style, 2);
  assert.equal(button.custom_id, 'watchparty:demo:join');
  assert.equal('url' in button, false);
});

test('normal join button keeps the configured Watch Party URL', () => {
  const row = createWatchPartyJoinRow(
    'Join Watch Party',
    'https://watch.example.com/party/ABCDE',
    false,
  ).toJSON();

  const button = row.components[0] as unknown as Record<string, unknown>;

  assert.equal(button.style, 5);
  assert.equal(button.url, 'https://watch.example.com/party/ABCDE');
  assert.equal('custom_id' in button, false);
});
