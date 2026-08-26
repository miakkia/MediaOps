import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DEFAULT_MEDIAOPS_BOT_NAME,
  DEFAULT_MEDIAOPS_SERVER_NAME,
  getMediaOpsBranding,
} from '../src/config/branding.js';

test('branding uses safe public defaults', () => {
  const branding = getMediaOpsBranding({});
  assert.equal(branding.botName, DEFAULT_MEDIAOPS_BOT_NAME);
  assert.equal(branding.serverName, DEFAULT_MEDIAOPS_SERVER_NAME);
});

test('branding preserves configured installation names', () => {
  const branding = getMediaOpsBranding({
    MEDIAOPS_BOT_NAME: '🎬 Solitario Butler',
    MEDIAOPS_SERVER_NAME: 'SolitarioHomeCinema',
  });

  assert.equal(branding.botName, '🎬 Solitario Butler');
  assert.equal(branding.serverName, 'SolitarioHomeCinema');
});

test('branding ignores blank configured values', () => {
  const branding = getMediaOpsBranding({
    MEDIAOPS_BOT_NAME: '   ',
    MEDIAOPS_SERVER_NAME: '',
  });

  assert.equal(branding.botName, DEFAULT_MEDIAOPS_BOT_NAME);
  assert.equal(branding.serverName, DEFAULT_MEDIAOPS_SERVER_NAME);
});
