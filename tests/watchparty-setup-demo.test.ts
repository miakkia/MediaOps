import assert from 'node:assert/strict';
import test from 'node:test';

import { ButtonStyle } from 'discord.js';

import { createWatchPartySetupRow } from '../src/watchparty/setup-panel.js';

test('demo Watch Party setup Open control is disabled and has no URL', () => {
  const privateUrl = 'https://private.example/';
  const row = createWatchPartySetupRow(true, privateUrl).toJSON();
  const button = row.components[2] as unknown as Record<string, unknown>;

  assert.equal(button.disabled, true);
  assert.equal(button.style, ButtonStyle.Secondary);
  assert.equal(button.custom_id, 'watchpartysetup:demo:open');
  assert.equal('url' in button, false);
  assert.equal(JSON.stringify(row).includes(privateUrl), false);
});

test('normal Watch Party setup Open control keeps its public URL', () => {
  const publicUrl = 'https://watch.example.com/';
  const row = createWatchPartySetupRow(false, publicUrl).toJSON();
  const button = row.components[2] as unknown as Record<string, unknown>;

  assert.equal(button.style, ButtonStyle.Link);
  assert.equal(button.url, publicUrl);
  assert.equal(button.disabled ?? false, false);
});

test('normal Watch Party setup fails closed when URL is missing', () => {
  assert.throws(
    () => createWatchPartySetupRow(false),
    /Watch Party URL is required outside demo mode/,
  );
});
