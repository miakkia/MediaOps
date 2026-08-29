import assert from 'node:assert/strict';
import test from 'node:test';

import {
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
