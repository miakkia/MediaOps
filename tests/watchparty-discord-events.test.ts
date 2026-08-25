import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getDiscordScheduledEventEndTime,
  shouldCreateDiscordScheduledEvent,
} from '../src/watchparty/discord-events.js';

test('creates Discord Scheduled Event only at least 48 hours ahead', () => {
  const now = new Date('2026-08-23T12:00:00.000Z');

  assert.equal(
    shouldCreateDiscordScheduledEvent(
      new Date('2026-08-25T12:00:00.000Z'),
      now,
    ),
    true,
  );

  assert.equal(
    shouldCreateDiscordScheduledEvent(
      new Date('2026-08-25T11:59:59.999Z'),
      now,
    ),
    false,
  );
});

test('external Discord event uses the 4.5 hour Watch Party safety window', () => {
  const start = new Date('2026-08-23T21:30:00.000Z');
  const end = getDiscordScheduledEventEndTime(start);

  assert.equal(
    end.toISOString(),
    '2026-08-24T02:00:00.000Z',
  );
});
