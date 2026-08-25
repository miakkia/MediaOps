import assert from 'node:assert/strict';
import test from 'node:test';

import type {
  ScheduledWatchParty,
} from '../src/storage/watchparty-store.js';

import {
  buildWatchPartyReminderContent,
  shouldSendWatchPartyReminder,
  WATCHPARTY_REMINDER_LEAD_TIME_MS,
} from '../src/watchparty/reminders.js';

const NOW = Date.parse('2026-08-25T18:00:00.000Z');

function party(
  overrides: Partial<ScheduledWatchParty> = {},
): ScheduledWatchParty {
  const scheduledAt =
    new Date(
      NOW + WATCHPARTY_REMINDER_LEAD_TIME_MS,
    ).toISOString();

  return {
    id: 'party-1',
    guildId: 'guild-1',
    channelId: 'channel-1',
    messageId: 'message-1',
    organizerDiscordId: 'organizer-1',
    embyItemId: 'emby-1',
    mediaTitle: 'Reminder Movie',
    mediaYear: 2026,
    scheduledAt,
    status: 'ready',
    partyCode: undefined,
    reminderSentAt: undefined,
    participants: [],
    createdAt: new Date(NOW - 60_000).toISOString(),
    updatedAt: new Date(NOW - 60_000).toISOString(),
    ...overrides,
  };
}

test('reminder becomes eligible exactly 15 minutes before start', () => {
  assert.equal(
    shouldSendWatchPartyReminder(party(), NOW),
    true,
  );
});

test('reminder is not eligible before the 15-minute window', () => {
  assert.equal(
    shouldSendWatchPartyReminder(
      party(),
      NOW - 1,
    ),
    false,
  );
});

test('reminder is not eligible at or after scheduled start', () => {
  const item = party();
  const scheduledTime =
    new Date(item.scheduledAt).getTime();

  assert.equal(
    shouldSendWatchPartyReminder(
      item,
      scheduledTime,
    ),
    false,
  );
});

test('persisted reminder marker prevents duplicate reminders after restart', () => {
  assert.equal(
    shouldSendWatchPartyReminder(
      party({
        reminderSentAt:
          new Date(NOW).toISOString(),
      }),
      NOW,
    ),
    false,
  );
});

test('terminal and active parties never receive reminders', () => {
  for (const status of [
    'active',
    'cancelled',
    'auto_cancelled',
    'expired',
  ] as const) {
    assert.equal(
      shouldSendWatchPartyReminder(
        party({ status }),
        NOW,
      ),
      false,
      status,
    );
  }
});

test('scheduled and ready parties are both eligible in the reminder window', () => {
  assert.equal(
    shouldSendWatchPartyReminder(
      party({ status: 'scheduled' }),
      NOW,
    ),
    true,
  );
  assert.equal(
    shouldSendWatchPartyReminder(
      party({ status: 'ready' }),
      NOW,
    ),
    true,
  );
});

test('invalid scheduled date is never eligible', () => {
  assert.equal(
    shouldSendWatchPartyReminder(
      party({ scheduledAt: 'invalid-date' }),
      NOW,
    ),
    false,
  );
});

test('reminder content includes media identity and a stable Discord timestamp', () => {
  const item = party();
  const timestamp =
    Math.floor(
      new Date(item.scheduledAt).getTime() / 1000,
    );

  const content =
    buildWatchPartyReminderContent(item, 'en');

  assert.match(content, /Reminder Movie/);
  assert.match(content, /2026/);
  assert.doesNotMatch(
    content,
    new RegExp(`<t:${timestamp}:R>`),
  );
  assert.match(
    content,
    new RegExp(`<t:${timestamp}:F>`),
  );
});
