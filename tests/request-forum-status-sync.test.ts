import assert from 'node:assert/strict';
import test from 'node:test';

import {
  currentForumStatus,
  desiredForumTags,
  hasExactlyOneMediaTag,
  isAllowedForumStatusTransition,
  isManagedForumThread,
  isTerminalForumRequestStatus,
  normalizeForumRequestStatus,
  type ForumSyncConfig,
} from '../src/request/forum-status-sync.js';

const config: ForumSyncConfig = {
  forumChannelId: 'forum',
  webhookId: 'ombi-webhook',
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

test('requires exactly one configured media type tag', () => {
  assert.equal(hasExactlyOneMediaTag(['movie', 'requested'], config), true);
  assert.equal(hasExactlyOneMediaTag(['series', 'requested'], config), true);
  assert.equal(hasExactlyOneMediaTag(['movie', 'series', 'requested'], config), false);
  assert.equal(hasExactlyOneMediaTag(['requested'], config), false);
});

test('requires exactly one configured status tag on managed threads', () => {
  assert.equal(isManagedForumThread(['movie', 'requested'], config), true);
  assert.equal(isManagedForumThread(['series', 'processing'], config), true);
  assert.equal(isManagedForumThread(['movie', 'requested', 'processing'], config), false);
  assert.equal(isManagedForumThread(['movie'], config), false);
});

test('reads the current status only when exactly one status tag is present', () => {
  assert.equal(currentForumStatus(['movie', 'requested'], config), 'requested');
  assert.equal(currentForumStatus(['series', 'processing'], config), 'processing');
  assert.equal(currentForumStatus(['movie', 'requested', 'processing'], config), undefined);
});

test('allows forward request transitions and blocks terminal rewrites', () => {
  assert.equal(isAllowedForumStatusTransition('requested', 'processing'), true);
  assert.equal(isAllowedForumStatusTransition('requested', 'available'), true);
  assert.equal(isAllowedForumStatusTransition('processing', 'available'), true);
  assert.equal(isAllowedForumStatusTransition('processing', 'failed'), true);
  assert.equal(isAllowedForumStatusTransition('available', 'processing'), false);
  assert.equal(isAllowedForumStatusTransition('failed', 'requested'), false);
  assert.equal(isAllowedForumStatusTransition('denied', 'available'), false);
});
