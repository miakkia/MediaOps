import assert from 'node:assert/strict';
import test from 'node:test';

import {
  desiredForumTags,
  isTerminalForumRequestStatus,
  normalizeForumRequestStatus,
  type ForumSyncConfig,
} from '../src/request/forum-status-sync.js';

const config: ForumSyncConfig = {
  forumChannelId: 'forum',
  movieTagId: 'movie',
  seriesTagId: 'series',
  requestedTagId: 'requested',
  processingTagId: 'processing',
  availableTagId: 'available',
  failedTagId: 'failed',
  deniedTagId: 'denied',
};

test('normalizes Ombi request statuses used by Forum embeds', () => {
  assert.equal(normalizeForumRequestStatus('Pending Approval'), 'requested');
  assert.equal(normalizeForumRequestStatus('Approved'), 'processing');
  assert.equal(normalizeForumRequestStatus('Available'), 'available');
  assert.equal(normalizeForumRequestStatus('Failed'), 'failed');
  assert.equal(normalizeForumRequestStatus('Denied'), 'denied');
  assert.equal(normalizeForumRequestStatus('Something Else'), undefined);
});

test('replaces the status tag while preserving movie media type', () => {
  assert.deepEqual(
    desiredForumTags(['movie', 'requested'], 'available', config),
    ['movie', 'available'],
  );
});

test('replaces the status tag while preserving series media type', () => {
  assert.deepEqual(
    desiredForumTags(['series', 'processing'], 'failed', config),
    ['series', 'failed'],
  );
});

test('only completed request states are terminal', () => {
  assert.equal(isTerminalForumRequestStatus('requested'), false);
  assert.equal(isTerminalForumRequestStatus('processing'), false);
  assert.equal(isTerminalForumRequestStatus('available'), true);
  assert.equal(isTerminalForumRequestStatus('failed'), true);
  assert.equal(isTerminalForumRequestStatus('denied'), true);
});
