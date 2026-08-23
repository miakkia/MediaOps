import assert from 'node:assert/strict';
import test, { afterEach } from 'node:test';

import {
  getMediaOpsTimezone,
  parseWatchPartyDateTime,
} from '../src/watchparty/timezone.js';

const originalTimezone = process.env.MEDIAOPS_TIMEZONE;

afterEach(() => {
  if (originalTimezone === undefined) {
    delete process.env.MEDIAOPS_TIMEZONE;
  } else {
    process.env.MEDIAOPS_TIMEZONE = originalTimezone;
  }
});

test('defaults to America/Toronto', () => {
  delete process.env.MEDIAOPS_TIMEZONE;

  assert.equal(
    getMediaOpsTimezone(),
    'America/Toronto',
  );
});

test('accepts a valid configured timezone', () => {
  process.env.MEDIAOPS_TIMEZONE = 'UTC';

  assert.equal(
    getMediaOpsTimezone(),
    'UTC',
  );
});

test('falls back when timezone is invalid', () => {
  process.env.MEDIAOPS_TIMEZONE = 'Not/A_Timezone';

  assert.equal(
    getMediaOpsTimezone(),
    'America/Toronto',
  );
});

test('preserves explicit ISO offsets', () => {
  process.env.MEDIAOPS_TIMEZONE = 'UTC';

  assert.equal(
    parseWatchPartyDateTime(
      '2026-08-25T21:00:00-04:00',
    ).toISOString(),
    '2026-08-26T01:00:00.000Z',
  );
});

test('interprets summer wall-clock time in America/Toronto', () => {
  process.env.MEDIAOPS_TIMEZONE = 'America/Toronto';

  assert.equal(
    parseWatchPartyDateTime(
      '2026-08-25 21:00',
    ).toISOString(),
    '2026-08-26T01:00:00.000Z',
  );
});

test('interprets winter wall-clock time in America/Toronto', () => {
  process.env.MEDIAOPS_TIMEZONE = 'America/Toronto';

  assert.equal(
    parseWatchPartyDateTime(
      '2026-12-25 21:00',
    ).toISOString(),
    '2026-12-26T02:00:00.000Z',
  );
});

test('rejects unsupported date formats', () => {
  const parsed =
    parseWatchPartyDateTime(
      'August 25 at 9pm',
    );

  assert.equal(
    Number.isNaN(parsed.getTime()),
    true,
  );
});
